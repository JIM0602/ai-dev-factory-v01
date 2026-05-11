import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
  ReservationSource,
} from '../../database/entities/reservation.entity';
import { ReservationRepository } from '../../database/repositories/reservation.repository';
import { ReservationRuleRepository } from '../../database/repositories/reservation-rule.repository';
import { StoreRepository } from '../../database/repositories/store.repository';
import { TimerSessionRepository } from '../../database/repositories/timer-session.repository';
import { TimerExtensionRepository } from '../../database/repositories/timer-extension.repository';
import { CouponRepository } from '../../database/repositories/coupon.repository';
import { CreateReservationDto, MerchantCreateReservationDto } from './reservation.dto';

/**
 * 预约服务
 *
 * 核心业务逻辑：容量校验、预约创建、状态流转、取消预约等。
 */
@Injectable()
export class ReservationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly reservationRepo: ReservationRepository,
    private readonly rulesRepo: ReservationRuleRepository,
    private readonly storeRepo: StoreRepository,
    private readonly timerSessionRepo: TimerSessionRepository,
    private readonly timerExtensionRepo: TimerExtensionRepository,
    private readonly couponRepo: CouponRepository,
  ) {}

  /**
   * 获取指定日期的可预约时段列表
   */
  async getSlots(date: string) {
    const rules = await this.rulesRepo.getRulesOrFail();
    const store = await this.storeRepo.getStoreConfigOrFail();
    const now = new Date();

    // 检查日期是否在可预约范围内
    const todayStr = now.toISOString().slice(0, 10);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + rules.advance_days);
    const maxDateStr = maxDate.toISOString().slice(0, 10);

    if (date < todayStr) {
      return {
        date,
        is_open: false,
        slots: [],
      };
    }

    if (date > maxDateStr) {
      throw new BadRequestException({
        code: 20004,
        message: '预约日期超出可预约范围',
        data: null,
      });
    }

    // 检查是否休息日
    const dateObj = new Date(date + 'T00:00:00+08:00');
    const dayOfWeek = dateObj.getDay();
    const restDays: number[] = store.rest_days || [];
    const isOpen = !restDays.includes(dayOfWeek);

    if (!isOpen) {
      return {
        date,
        is_open: false,
        slots: [],
      };
    }

    // 生成时段列表
    const slots = this.generateSlots(
      store.open_time,
      store.close_time,
      rules.slot_duration,
    );

    // 查询每个时段的占用情况
    const occupancyMap = await this.reservationRepo.getSlotOccupancy(date);
    const occupancyBySlot = new Map<string, number>();
    for (const o of occupancyMap) {
      occupancyBySlot.set(o.slotStartTime, o.occupied);
    }

    const slotList = slots.map((slot) => {
      const occupied = occupancyBySlot.get(slot.startTime) || 0;
      const available = Math.max(0, store.table_count - occupied);

      // 判断是否已过去
      const isPast = this.isSlotPast(date, slot.startTime, now);

      // 判断是否已截止
      const isCutoff = this.isSlotCutoff(date, slot.startTime, rules.cutoff_minutes, now);

      const isAvailable = !isPast && !isCutoff && available > 0;

      return {
        start_time: slot.startTime,
        end_time: slot.endTime,
        total_tables: store.table_count,
        booked_count: occupied,
        available_count: available,
        is_available: isAvailable,
        is_past: isPast,
        is_cutoff: isCutoff,
      };
    });

    return {
      date,
      is_open: true,
      slots: slotList,
    };
  }

  /**
   * 顾客创建预约
   */
  async createReservation(
    dto: CreateReservationDto,
    openid: string,
    source: ReservationSource = ReservationSource.CUSTOMER,
  ) {
    return this.createReservationInternal(dto, openid, source);
  }

  /**
   * 商家代客预约
   */
  async createMerchantReservation(dto: MerchantCreateReservationDto) {
    // 商家代约使用一个固定 openid 前缀标识
    const merchantOpenid = `merchant_booking_${Date.now()}`;
    return this.createReservationInternal(
      dto,
      merchantOpenid,
      ReservationSource.MERCHANT,
    );
  }

  /**
   * 预约创建核心逻辑
   *
   * 在事务中使用行级锁防止超卖。
   */
  private async createReservationInternal(
    dto: CreateReservationDto,
    openid: string,
    source: ReservationSource,
  ) {
    const rules = await this.rulesRepo.getRulesOrFail();
    const store = await this.storeRepo.getStoreConfigOrFail();

    // 1. 基础校验
    this.validateReservationDate(dto.reservation_date, rules.advance_days);
    this.validateReservationSlot(
      dto.reservation_date,
      dto.slot_start_time,
      dto.slot_end_time,
      rules.slot_duration,
      store,
      rules.cutoff_minutes,
    );

    // 2. 检查休息日
    const dateObj = new Date(dto.reservation_date + 'T00:00:00+08:00');
    const dayOfWeek = dateObj.getDay();
    const restDays: number[] = store.rest_days || [];
    if (restDays.includes(dayOfWeek)) {
      throw new BadRequestException({
        code: 20003,
        message: '非营业日期，无法预约',
        data: null,
      });
    }

    // 3. 事务中执行容量检查和预约创建
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const reservationRepo = manager.getRepository(Reservation);

      // 3a. 行级锁检查容量
      const occupied = await reservationRepo
        .createQueryBuilder('r')
        .select('COUNT(*)', 'count')
        .where('r.reservation_date = :date', { date: dto.reservation_date })
        .andWhere('r.slot_start_time = :slotStart', {
          slotStart: dto.slot_start_time,
        })
        .andWhere('r.status IN (:...statuses)', {
          statuses: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.IN_PROGRESS,
          ],
        })
        .setLock('pessimistic_write')
        .getRawOne();

      const occupiedCount = parseInt(occupied?.count || '0', 10);

      if (occupiedCount >= store.table_count) {
        throw new BadRequestException({
          code: 30001,
          message: '该时段已约满，请选择其他时段',
          data: null,
        });
      }

      // 3b. 检查重复预约（同一 openid + 同日期 + 同时段）
      // 商家代约不检查 openid 重复
      if (source === ReservationSource.CUSTOMER) {
        const existingCount = await reservationRepo
          .createQueryBuilder('r')
          .select('COUNT(*)', 'count')
          .where('r.customer_openid = :openid', { openid })
          .andWhere('r.reservation_date = :date', {
            date: dto.reservation_date,
          })
          .andWhere('r.slot_start_time = :slotStart', {
            slotStart: dto.slot_start_time,
          })
          .andWhere('r.status NOT IN (:...statuses)', {
            statuses: [
              ReservationStatus.CANCELLED,
              ReservationStatus.REJECTED,
            ],
          })
          .getRawOne();

        if (parseInt(existingCount?.count || '0', 10) > 0) {
          throw new BadRequestException({
            code: 30002,
            message: '您在该时段已有预约，请勿重复预约',
            data: null,
          });
        }
      }

      // 3c. 确定初始状态
      let status: ReservationStatus;
      if (source === ReservationSource.MERCHANT) {
        // 商家代约直接确认
        status = ReservationStatus.CONFIRMED;
      } else {
        // 顾客预约根据规则决定
        status = rules.require_confirmation
          ? ReservationStatus.PENDING
          : ReservationStatus.CONFIRMED;
      }

      // 3d. 创建预约记录
      const reservation = reservationRepo.create({
        customer_openid: openid,
        customer_name: dto.customer_name,
        customer_phone: dto.customer_phone,
        reservation_date: dto.reservation_date,
        slot_start_time: dto.slot_start_time,
        slot_end_time: dto.slot_end_time,
        guest_count: dto.guest_count ?? 1,
        status,
        source,
        remark: dto.remark ?? null,
      });

      const saved = await reservationRepo.save(reservation);

      return {
        id: saved.id,
        reservation_date: saved.reservation_date,
        slot_start_time: saved.slot_start_time,
        slot_end_time: saved.slot_end_time,
        guest_count: saved.guest_count,
        customer_name: saved.customer_name,
        customer_phone: saved.customer_phone,
        status: saved.status,
        source: saved.source,
        remark: saved.remark,
        created_at: saved.created_at,
      };
    });
  }

  /**
   * 我的预约列表（顾客端）
   */
  async getMyReservations(
    openid: string,
    status?: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    let statusFilter: ReservationStatus | undefined;
    if (status && status !== 'all') {
      statusFilter = status as ReservationStatus;
    }

    const result = await this.reservationRepo.findByCustomer(
      openid,
      statusFilter,
      page,
      pageSize,
    );

    const store = await this.storeRepo.getStoreConfigOrFail();

    return {
      list: result.items.map((r) => ({
        id: r.id,
        reservation_date: r.reservation_date,
        slot_start_time: r.slot_start_time,
        slot_end_time: r.slot_end_time,
        guest_count: r.guest_count,
        status: r.status,
        source: r.source,
        store_name: store.name,
        can_cancel: this.canCustomerCancel(r),
        created_at: r.created_at,
      })),
      pagination: {
        page: result.page,
        page_size: result.pageSize,
        total: result.total,
        total_pages: Math.ceil(result.total / result.pageSize),
      },
    };
  }

  /**
   * 获取预约详情
   */
  async getReservationDetail(
    id: number,
    user?: { sub: string; role: string },
  ) {
    const reservation = await this.reservationRepo.findByIdOrFail(id);

    // 顾客只能查看自己的预约
    if (user && user.role === 'customer' && reservation.customer_openid !== user.sub) {
      throw new ForbiddenException({
        code: 30004,
        message: '该预约不属于您',
        data: null,
      });
    }

    const store = await this.storeRepo.getStoreConfigOrFail();

    // 构建手机号脱敏
    const phoneMasked = this.maskPhone(reservation.customer_phone);
    const phoneFull = reservation.customer_phone;

    // 查询关联的计时会话
    let timerSession: any = null;
    if (
      reservation.status === ReservationStatus.IN_PROGRESS ||
      reservation.status === ReservationStatus.COMPLETED
    ) {
      const session = await this.timerSessionRepo.findByReservationId(
        reservation.id,
      );
      if (session) {
        const extensions = await this.timerExtensionRepo.findByTimerSessionId(
          session.id,
        );
        const coupons = await this.couponRepo.findByTimerSessionId(session.id);

        // 计算剩余秒数
        let remainingSeconds = 0;
        if (session.status === 'active') {
          const now = new Date().getTime();
          const endTime = session.expected_end_time.getTime();
          remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));
        }

        timerSession = {
          id: session.id,
          table_number: session.table_number,
          check_in_time: session.check_in_time,
          expected_end_time: session.expected_end_time,
          actual_end_time: session.actual_end_time,
          original_duration_minutes: session.original_duration_minutes,
          total_extension_minutes: session.total_extension_minutes,
          status: session.status,
          remaining_seconds: remainingSeconds,
          extensions: extensions.map((e) => ({
            id: e.id,
            extension_minutes: e.extension_minutes,
            created_at: e.created_at,
          })),
          coupons: coupons.map((c) => ({
            id: c.id,
            coupon_code: c.coupon_code,
            coupon_source: c.coupon_source,
            coupon_type: c.coupon_type,
          })),
        };
      }
    }

    return {
      id: reservation.id,
      reservation_date: reservation.reservation_date,
      slot_start_time: reservation.slot_start_time,
      slot_end_time: reservation.slot_end_time,
      guest_count: reservation.guest_count,
      customer_name: reservation.customer_name,
      customer_phone: phoneMasked,
      customer_phone_full: phoneFull,
      status: reservation.status,
      source: reservation.source,
      cancel_reason: reservation.cancel_reason,
      rejection_reason: reservation.rejection_reason,
      remark: reservation.remark,
      store_name: store.name,
      store_address: store.address,
      can_cancel: this.canCustomerCancel(reservation),
      timer_session: timerSession,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
    };
  }

  /**
   * 顾客取消预约
   */
  async cancelReservation(id: number, openid: string) {
    const reservation = await this.reservationRepo.findByIdOrFail(id);

    // 顾客只能取消自己的预约
    if (reservation.customer_openid !== openid) {
      throw new ForbiddenException({
        code: 30004,
        message: '该预约不属于您',
        data: null,
      });
    }

    // 状态检查
    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new BadRequestException({
        code: 30005,
        message: '当前状态不允许取消',
        data: null,
      });
    }

    // 取消时间检查
    const rules = await this.rulesRepo.getRulesOrFail();
    if (!this.canCustomerCancel(reservation, rules.customer_cancel_hours)) {
      throw new BadRequestException({
        code: 30003,
        message: '已超过取消时间，如需取消请联系商家',
        data: null,
      });
    }

    // 更新状态为 cancelled
    await this.reservationRepo.repo.update(id, {
      status: ReservationStatus.CANCELLED,
      cancel_reason: '顾客自行取消',
    });

    return { message: '预约已取消' };
  }

  /**
   * 商家取消预约（客服场景，可取消任何预约）
   */
  async merchantCancelReservation(id: number) {
    const reservation = await this.reservationRepo.findByIdOrFail(id);

    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new BadRequestException({
        code: 30005,
        message: '当前状态不允许取消',
        data: null,
      });
    }

    await this.reservationRepo.repo.update(id, {
      status: ReservationStatus.CANCELLED,
      cancel_reason: '商家取消',
    });

    return { message: '预约已取消' };
  }

  /**
   * 商家查看所有预约列表
   */
  async getMerchantReservations(
    filters: {
      date?: string;
      status?: string;
      search?: string;
    },
    page: number = 1,
    pageSize: number = 20,
  ) {
    let statusFilter: ReservationStatus | undefined;
    if (filters.status && filters.status !== 'all') {
      statusFilter = filters.status as ReservationStatus;
    }

    const result = await this.reservationRepo.findByMerchant(
      {
        date: filters.date,
        status: statusFilter,
        keyword: filters.search,
      },
      page,
      pageSize,
    );

    // 获取汇总数据
    let summary = {
      pending_count: 0,
      confirmed_count: 0,
      in_progress_count: 0,
    };

    if (!filters.status || filters.status === 'all') {
      const today = new Date().toISOString().slice(0, 10);
      const todaySummary = await this.reservationRepo.getTodaySummary(
        filters.date || today,
      );
      summary = {
        pending_count: todaySummary.pending,
        confirmed_count: todaySummary.confirmed,
        in_progress_count: todaySummary.inProgress,
      };
    }

    return {
      list: result.items.map((r) => ({
        id: r.id,
        customer_name: r.customer_name,
        customer_phone: this.maskPhone(r.customer_phone),
        reservation_date: r.reservation_date,
        slot_start_time: r.slot_start_time,
        slot_end_time: r.slot_end_time,
        guest_count: r.guest_count,
        status: r.status,
        source: r.source,
        remark: r.remark,
        created_at: r.created_at,
      })),
      summary,
      pagination: {
        page: result.page,
        page_size: result.pageSize,
        total: result.total,
        total_pages: Math.ceil(result.total / result.pageSize),
      },
    };
  }

  /**
   * 商家确认预约
   */
  async confirmReservation(id: number) {
    const reservation = await this.reservationRepo.findByIdOrFail(id);

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException({
        code: 30005,
        message: '仅待确认状态的预约可确认',
        data: null,
      });
    }

    await this.reservationRepo.repo.update(id, {
      status: ReservationStatus.CONFIRMED,
    });

    return { message: '预约已确认' };
  }

  /**
   * 商家拒绝预约
   */
  async rejectReservation(id: number, reason?: string) {
    const reservation = await this.reservationRepo.findByIdOrFail(id);

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException({
        code: 30005,
        message: '仅待确认状态的预约可拒绝',
        data: null,
      });
    }

    await this.reservationRepo.repo.update(id, {
      status: ReservationStatus.REJECTED,
      rejection_reason: reason ?? null,
    });

    return { message: '预约已拒绝' };
  }

  /**
   * 容量概况（商家端）
   */
  async getCapacityOverview(date?: string) {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const store = await this.storeRepo.getStoreConfigOrFail();
    const rules = await this.rulesRepo.getRulesOrFail();

    const slots = this.generateSlots(
      store.open_time,
      store.close_time,
      rules.slot_duration,
    );

    const occupancy = await this.reservationRepo.getSlotOccupancy(targetDate);
    const occupancyBySlot = new Map<string, number>();
    for (const o of occupancy) {
      occupancyBySlot.set(o.slotStartTime, o.occupied);
    }

    return {
      date: targetDate,
      table_count: store.table_count,
      slots: slots.map((slot) => {
        const occupied = occupancyBySlot.get(slot.startTime) || 0;
        return {
          start_time: slot.startTime,
          end_time: slot.endTime,
          total_tables: store.table_count,
          booked_count: occupied,
          available_count: Math.max(0, store.table_count - occupied),
        };
      }),
    };
  }

  // ---------------------------------------------------------------------------
  // 辅助方法
  // ---------------------------------------------------------------------------

  /**
   * 手机号脱敏：中间 4 位替换为 ****
   */
  maskPhone(phone: string): string {
    if (!phone || phone.length !== 11) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }

  /**
   * 检查预约日期是否在允许范围内
   */
  private validateReservationDate(date: string, advanceDays: number) {
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      throw new BadRequestException({
        code: 20004,
        message: '不能预约过去的日期',
        data: null,
      });
    }

    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + advanceDays);
    const maxDateStr = maxDate.toISOString().slice(0, 10);
    if (date > maxDateStr) {
      throw new BadRequestException({
        code: 20004,
        message: '预约日期超出可预约范围',
        data: null,
      });
    }
  }

  /**
   * 校验时段合法性
   */
  private validateReservationSlot(
    date: string,
    slotStart: string,
    slotEnd: string,
    slotDuration: number,
    store: any,
    cutoffMinutes: number,
  ) {
    // 检查 start < end
    if (slotStart >= slotEnd) {
      throw new BadRequestException({
        code: 20002,
        message: '时段开始时间必须早于结束时间',
        data: null,
      });
    }

    // 检查时段长度是否等于 slot_duration
    const startMinutes = this.timeToMinutes(slotStart);
    const endMinutes = this.timeToMinutes(slotEnd);
    if (endMinutes - startMinutes !== slotDuration) {
      throw new BadRequestException({
        code: 20002,
        message: `时段长度必须为 ${slotDuration} 分钟`,
        data: null,
      });
    }

    // 检查是否在营业时间内
    const openMinutes = this.timeToMinutes(store.open_time);
    const closeMinutes = this.timeToMinutes(store.close_time);
    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      throw new BadRequestException({
        code: 20002,
        message: '时段不在营业时间范围内',
        data: null,
      });
    }

    // 检查是否已截止
    if (this.isSlotCutoff(date, slotStart, cutoffMinutes, new Date())) {
      throw new BadRequestException({
        code: 20004,
        message: '该时段预约已截止',
        data: null,
      });
    }

    // 检查是否已过去
    if (this.isSlotPast(date, slotStart, new Date())) {
      throw new BadRequestException({
        code: 20004,
        message: '该时段已过去，无法预约',
        data: null,
      });
    }
  }

  /**
   * 生成时段列表
   */
  private generateSlots(
    openTime: string,
    closeTime: string,
    slotDuration: number,
  ): { startTime: string; endTime: string }[] {
    const openMinutes = this.timeToMinutes(openTime);
    const closeMinutes = this.timeToMinutes(closeTime);
    const slots: { startTime: string; endTime: string }[] = [];

    let current = openMinutes;
    while (current + slotDuration <= closeMinutes) {
      slots.push({
        startTime: this.minutesToTime(current),
        endTime: this.minutesToTime(current + slotDuration),
      });
      current += slotDuration;
    }

    return slots;
  }

  /**
   * 判断时段是否已过去
   */
  private isSlotPast(date: string, startTime: string, now: Date): boolean {
    const slotDateTime = new Date(`${date}T${startTime}:00+08:00`);
    return now >= slotDateTime;
  }

  /**
   * 判断时段是否已截止
   */
  private isSlotCutoff(
    date: string,
    startTime: string,
    cutoffMinutes: number,
    now: Date,
  ): boolean {
    if (cutoffMinutes <= 0) return false;
    const slotDateTime = new Date(`${date}T${startTime}:00+08:00`);
    const cutoffTime = new Date(slotDateTime.getTime() - cutoffMinutes * 60 * 1000);
    return now >= cutoffTime;
  }

  /**
   * 判断顾客是否可以取消预约
   */
  private canCustomerCancel(
    reservation: Reservation,
    customerCancelHours?: number,
  ): boolean {
    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      return false;
    }

    const hours = customerCancelHours ?? 3;
    const slotDateTime = new Date(
      `${reservation.reservation_date}T${reservation.slot_start_time}:00+08:00`,
    );
    const cancelDeadline = new Date(
      slotDateTime.getTime() - hours * 60 * 60 * 1000,
    );
    return new Date() < cancelDeadline;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}
