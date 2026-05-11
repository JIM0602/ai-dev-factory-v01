import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, DeepPartial } from 'typeorm';
import {
  TimerSession,
  TimerSessionStatus,
} from '../../database/entities/timer-session.entity';
import {
  Reservation,
  ReservationStatus,
} from '../../database/entities/reservation.entity';
import { Member } from '../../database/entities/member.entity';
import { ConsumptionRecord } from '../../database/entities/consumption-record.entity';
import { Coupon, CouponSource } from '../../database/entities/coupon.entity';
import { TimerSessionRepository } from '../../database/repositories/timer-session.repository';
import { TimerExtensionRepository } from '../../database/repositories/timer-extension.repository';
import { CouponRepository } from '../../database/repositories/coupon.repository';
import { ReservationRepository } from '../../database/repositories/reservation.repository';
import { MemberRepository } from '../../database/repositories/member.repository';
import { ConsumptionRecordRepository } from '../../database/repositories/consumption-record.repository';
import { StoreRepository } from '../../database/repositories/store.repository';
import { ReservationRuleRepository } from '../../database/repositories/reservation-rule.repository';
import { CheckInDto, ExtendTimeDto, ChangeTableDto } from './timer.dto';

/**
 * 计时服务
 *
 * 提供到店登记、加时、结束计时、计时看板等功能。
 */
@Injectable()
export class TimerService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly timerSessionRepo: TimerSessionRepository,
    private readonly timerExtensionRepo: TimerExtensionRepository,
    private readonly couponRepo: CouponRepository,
    private readonly reservationRepo: ReservationRepository,
    private readonly memberRepo: MemberRepository,
    private readonly consumptionRecordRepo: ConsumptionRecordRepository,
    private readonly storeRepo: StoreRepository,
    private readonly rulesRepo: ReservationRuleRepository,
  ) {}

  /**
   * 到店登记（创建计时会话）
   */
  async checkIn(reservationId: number, dto: CheckInDto) {
    const reservation = await this.reservationRepo.findByIdOrFail(reservationId);

    // 校验预约状态
    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException({
        code: 30005,
        message: '仅已确认状态的预约可到店登记',
        data: null,
      });
    }

    // 校验预约日期是否为今天
    const today = new Date().toISOString().slice(0, 10);
    if (reservation.reservation_date !== today) {
      throw new BadRequestException({
        code: 20006,
        message: '预约日期不是今天，无法到店登记',
        data: null,
      });
    }

    // 检查是否已有计时会话
    const existingSession = await this.timerSessionRepo.findByReservationId(
      reservationId,
    );
    if (existingSession) {
      throw new BadRequestException({
        code: 30005,
        message: '该预约已登记计时',
        data: null,
      });
    }

    // 获取时段时长
    const rules = await this.rulesRepo.getRulesOrFail();
    const store = await this.storeRepo.getStoreConfigOrFail();

    // 计算时段时长（分钟）
    const startMinutes = this.timeToMinutes(reservation.slot_start_time);
    const endMinutes = this.timeToMinutes(reservation.slot_end_time);
    const originalDurationMinutes = endMinutes - startMinutes;

    // 确定桌位号
    let tableNumber: number;
    if (dto.table_number) {
      // 校验自定义桌位号
      if (dto.table_number > store.table_count) {
        throw new BadRequestException({
          code: 20002,
          message: `桌位号不能超过最大桌位数 ${store.table_count}`,
          data: null,
        });
      }
      // 检查桌位号是否被占用
      const activeSessions = await this.timerSessionRepo.findActiveSessions();
      const occupiedTables = activeSessions.map((s) => s.table_number);
      if (occupiedTables.includes(dto.table_number)) {
        throw new BadRequestException({
          code: 30001,
          message: `桌位 ${dto.table_number} 已被占用`,
          data: null,
        });
      }
      tableNumber = dto.table_number;
    } else {
      // 自动分配最小可用桌位号
      const activeSessions = await this.timerSessionRepo.findActiveSessions();
      const occupiedTables = new Set(activeSessions.map((s) => s.table_number));
      let assigned = 0;
      for (let i = 1; i <= store.table_count; i++) {
        if (!occupiedTables.has(i)) {
          assigned = i;
          break;
        }
      }
      if (assigned === 0) {
        throw new BadRequestException({
          code: 30001,
          message: '所有桌位已被占用',
          data: null,
        });
      }
      tableNumber = assigned;
    }

    const now = new Date();
    const expectedEndTime = new Date(
      now.getTime() + originalDurationMinutes * 60 * 1000,
    );

    // 事务中执行
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const timerRepo = manager.getRepository(TimerSession);
      const resvRepo = manager.getRepository(Reservation);
      const couponRepo = manager.getRepository(Coupon);

      // 创建计时会话
      const session = timerRepo.create({
        reservation_id: reservationId,
        table_number: tableNumber,
        check_in_time: now,
        expected_end_time: expectedEndTime,
        original_duration_minutes: originalDurationMinutes,
        total_extension_minutes: 0,
        status: TimerSessionStatus.ACTIVE,
      });
      const savedSession = await timerRepo.save(session);

      // 更新预约状态为 in_progress
      await resvRepo.update(reservationId, {
        status: ReservationStatus.IN_PROGRESS,
      });

      // 处理团购券
      if (dto.coupons && dto.coupons.length > 0) {
        for (const c of dto.coupons) {
          const coupon = couponRepo.create({
            timer_session_id: savedSession.id,
            coupon_code: c.coupon_code,
            coupon_source: c.coupon_source as CouponSource,
            coupon_type: c.coupon_type ?? null,
          });
          await couponRepo.save(coupon);
        }
      }

      return {
        timer_session_id: savedSession.id,
        table_number: savedSession.table_number,
        check_in_time: savedSession.check_in_time,
        expected_end_time: savedSession.expected_end_time,
        original_duration_minutes: savedSession.original_duration_minutes,
        reservation_status: 'in_progress',
      };
    });
  }

  /**
   * 加时操作
   */
  async extendTime(sessionId: number, dto: ExtendTimeDto) {
    const session = await this.timerSessionRepo.findByIdOrFail(sessionId);

    if (session.status !== TimerSessionStatus.ACTIVE) {
      throw new BadRequestException({
        code: 30005,
        message: '仅进行中的计时可加时',
        data: null,
      });
    }

    // 记录加时操作
    await this.timerExtensionRepo.recordExtension(sessionId, dto.extension_minutes);

    // 更新计时会话
    const newTotal =
      session.total_extension_minutes + dto.extension_minutes;
    const newExpectedEnd = new Date(
      session.expected_end_time.getTime() + dto.extension_minutes * 60 * 1000,
    );

    await this.timerSessionRepo.repo.update(sessionId, {
      total_extension_minutes: newTotal,
      expected_end_time: newExpectedEnd,
    } as any);

    // 计算剩余秒数
    const now = new Date().getTime();
    const endTime = newExpectedEnd.getTime();
    const remainingSeconds = Math.max(
      0,
      Math.floor((endTime - now) / 1000),
    );

    return {
      timer_session_id: sessionId,
      new_remaining_seconds: remainingSeconds,
      total_extension_minutes: newTotal,
    };
  }

  /**
   * 结束计时
   */
  async endSession(sessionId: number) {
    const session = await this.timerSessionRepo.findByIdOrFail(sessionId);

    if (session.status !== TimerSessionStatus.ACTIVE) {
      throw new BadRequestException({
        code: 30005,
        message: '仅进行中的计时可结束',
        data: null,
      });
    }

    const now = new Date();

    return this.dataSource.transaction(async (manager: EntityManager) => {
      const timerRepo = manager.getRepository(TimerSession);
      const resvRepo = manager.getRepository(Reservation);
      const memberRepo = manager.getRepository(Member);
      const consumptionRepo = manager.getRepository(ConsumptionRecord);

      // 1. 更新计时会话
      const actualEndTime = now;
      await timerRepo.update(sessionId, {
        status: TimerSessionStatus.COMPLETED,
        actual_end_time: actualEndTime,
      } as any);

      // 2. 更新预约状态
      const reservation = await resvRepo.findOne({
        where: { id: session.reservation_id },
      });
      if (reservation) {
        await resvRepo.update(reservation.id, {
          status: ReservationStatus.COMPLETED,
        });
      }

      // 3. 计算消费时长
      const durationMs =
        actualEndTime.getTime() - session.check_in_time.getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      // 4. 查找或创建会员
      let member = await memberRepo.findOne({
        where: { phone: reservation!.customer_phone },
      });
      if (!member) {
        member = memberRepo.create({
          name: reservation!.customer_name,
          phone: reservation!.customer_phone,
          total_visits: 1,
          total_duration_minutes: durationMinutes,
          last_visit_date: new Date().toISOString().slice(0, 10),
        } as DeepPartial<Member>) as Member;
        member = await memberRepo.save(member as DeepPartial<Member>);
      } else {
        await memberRepo.update(member.id, {
          name: reservation!.customer_name,
          total_visits: member.total_visits + 1,
          total_duration_minutes:
            member.total_duration_minutes + durationMinutes,
          last_visit_date: new Date().toISOString().slice(0, 10),
        } as DeepPartial<Member>);
      }

      // 5. 检查是否使用团购券
      const hasCoupon = await this.couponRepo.hasCoupon(sessionId);

      // 6. 创建消费记录
      await consumptionRepo.save(
        consumptionRepo.create({
          member_id: member!.id,
          reservation_id: session.reservation_id,
          timer_session_id: sessionId,
          visit_date: new Date().toISOString().slice(0, 10),
          check_in_time: session.check_in_time,
          check_out_time: actualEndTime,
          duration_minutes: durationMinutes,
          has_coupon: hasCoupon,
          source: reservation!.source,
        }),
      );

      return {
        timer_session_id: sessionId,
        actual_end_time: actualEndTime,
        total_duration_minutes: durationMinutes,
        reservation_status: 'completed',
      };
    });
  }

  /**
   * 计时看板
   */
  async getDashboard() {
    const store = await this.storeRepo.getStoreConfigOrFail();
    const activeSessions = await this.timerSessionRepo.findActiveSessions();
    const activeCount = activeSessions.length;
    const availableTables = Math.max(0, store.table_count - activeCount);

    const now = Date.now();
    const sessions = activeSessions.map((session) => {
      const endTime = session.expected_end_time.getTime();
      const remainingSeconds = Math.max(
        0,
        Math.floor((endTime - now) / 1000),
      );

      // 获取预约信息
      const reservation = (session as any).reservation;

      // 已使用分钟数
      const usedMs = now - session.check_in_time.getTime();
      const usedMinutes = Math.floor(usedMs / 60000);

      return {
        id: session.id,
        customer_name: reservation?.customer_name || '未知',
        table_number: session.table_number,
        slot_start_time: reservation?.slot_start_time || '',
        slot_end_time: reservation?.slot_end_time || '',
        check_in_time: session.check_in_time,
        original_duration_minutes: session.original_duration_minutes,
        used_minutes: usedMinutes,
        remaining_seconds: remainingSeconds,
        total_extension_minutes: session.total_extension_minutes,
        is_urgent: remainingSeconds < 900, // < 15 分钟
        is_critical: remainingSeconds < 300, // < 5 分钟
      };
    });

    // 按剩余时间升序排列（最快要到期的排最前）
    sessions.sort((a, b) => a.remaining_seconds - b.remaining_seconds);

    return {
      active_count: activeCount,
      available_tables: availableTables,
      sessions,
    };
  }

  /**
   * 更换桌位
   */
  async changeTable(sessionId: number, dto: ChangeTableDto) {
    const session = await this.timerSessionRepo.findByIdOrFail(sessionId);

    if (session.status !== TimerSessionStatus.ACTIVE) {
      throw new BadRequestException({
        code: 30005,
        message: '仅进行中的计时可更换桌位',
        data: null,
      });
    }

    const store = await this.storeRepo.getStoreConfigOrFail();
    if (dto.table_number > store.table_count) {
      throw new BadRequestException({
        code: 20002,
        message: `桌位号不能超过最大桌位数 ${store.table_count}`,
        data: null,
      });
    }

    // 检查新桌位是否被占用
    const activeSessions = await this.timerSessionRepo.findActiveSessions();
    const occupiedTables = activeSessions
      .filter((s) => s.id !== sessionId)
      .map((s) => s.table_number);
    if (occupiedTables.includes(dto.table_number)) {
      throw new BadRequestException({
        code: 30001,
        message: `桌位 ${dto.table_number} 已被占用`,
        data: null,
      });
    }

    await this.timerSessionRepo.repo.update(sessionId, {
      table_number: dto.table_number,
    } as any);

    return {
      timer_session_id: sessionId,
      table_number: dto.table_number,
    };
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
