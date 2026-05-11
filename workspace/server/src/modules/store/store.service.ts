import { Injectable, NotFoundException } from '@nestjs/common';
import { StoreRepository } from '../../database/repositories/store.repository';
import { ReservationRuleRepository } from '../../database/repositories/reservation-rule.repository';
import { ReservationRepository } from '../../database/repositories/reservation.repository';
import { TimerSessionRepository } from '../../database/repositories/timer-session.repository';
import { UpdateStoreDto, UpdateRulesDto } from './store.dto';

/**
 * 门店服务
 *
 * 提供门店配置读写、公开信息查询、预约规则读写。
 */
@Injectable()
export class StoreService {
  constructor(
    private readonly storeRepo: StoreRepository,
    private readonly rulesRepo: ReservationRuleRepository,
    private readonly reservationRepo: ReservationRepository,
    private readonly timerSessionRepo: TimerSessionRepository,
  ) {}

  /**
   * 获取门店公开信息（顾客端）
   */
  async getStoreInfo() {
    const store = await this.storeRepo.getStoreConfig();
    if (!store) {
      throw new NotFoundException({
        code: 40001,
        message: '门店不存在',
        data: null,
      });
    }

    // 判断今日是否营业
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=周日
    const restDays: number[] = store.rest_days || [];
    const isOpenToday = !restDays.includes(dayOfWeek);

    // 获取今日各时段剩余容量之和
    const dateStr = today.toISOString().slice(0, 10);
    const slotOccupancy = await this.reservationRepo.getSlotOccupancy(dateStr);
    const totalOccupied = slotOccupancy.reduce((sum, s) => sum + s.occupied, 0);

    // 计算今日时段数
    const rules = await this.rulesRepo.getRules();
    const slotDuration = rules?.slot_duration ?? 60;
    const slotCount = this.calculateSlotCount(
      store.open_time,
      store.close_time,
      slotDuration,
    );
    const totalSlotsCapacity = slotCount * store.table_count;
    const todayAvailableSlots = Math.max(0, totalSlotsCapacity - totalOccupied);

    return {
      id: store.id,
      name: store.name,
      address: store.address,
      address_guide: store.address_guide,
      phone: store.phone,
      photos: store.photos,
      open_time: store.open_time,
      close_time: store.close_time,
      rest_days: restDays,
      table_count: store.table_count,
      description: store.description,
      is_open_today: isOpenToday,
      today_available_slots: todayAvailableSlots,
    };
  }

  /**
   * 获取门店完整配置（商家端）
   */
  async getStoreConfig() {
    const store = await this.storeRepo.getStoreConfigOrFail();
    return {
      ...store,
      rest_days: store.rest_days || [],
      photos: store.photos || [],
    };
  }

  /**
   * 更新门店配置
   */
  async updateStoreConfig(dto: UpdateStoreDto) {
    const store = await this.storeRepo.updateStoreConfig({
      name: dto.name,
      address: dto.address,
      address_guide: dto.address_guide ?? null,
      phone: dto.phone,
      photos: dto.photos,
      open_time: dto.open_time,
      close_time: dto.close_time,
      rest_days: dto.rest_days ?? [],
      table_count: dto.table_count,
      description: dto.description ?? null,
    });
    return {
      ...store,
      rest_days: store.rest_days || [],
      photos: store.photos || [],
    };
  }

  /**
   * 获取预约规则
   */
  async getRules() {
    const rules = await this.rulesRepo.getRulesOrFail();
    return rules;
  }

  /**
   * 更新预约规则
   */
  async updateRules(dto: UpdateRulesDto) {
    return this.rulesRepo.updateRules({
      require_confirmation: dto.require_confirmation,
      advance_days: dto.advance_days,
      cutoff_minutes: dto.cutoff_minutes,
      auto_cancel_hours: dto.auto_cancel_hours ?? null,
      customer_cancel_hours: dto.customer_cancel_hours,
      slot_duration: dto.slot_duration,
    });
  }

  /**
   * 计算时段数量
   */
  private calculateSlotCount(
    openTime: string,
    closeTime: string,
    slotDuration: number,
  ): number {
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    const totalMinutes = closeMinutes - openMinutes;
    return Math.floor(totalMinutes / slotDuration);
  }
}
