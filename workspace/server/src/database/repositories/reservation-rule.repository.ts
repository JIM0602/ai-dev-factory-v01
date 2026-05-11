import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReservationRule } from '../entities/reservation-rule.entity';
import { BaseRepository } from './base.repository';

/**
 * 预约规则 Repository
 *
 * V1 单套规则，所有操作针对 id=1 的记录。
 */
@Injectable()
export class ReservationRuleRepository extends BaseRepository<ReservationRule> {
  constructor(
    @InjectRepository(ReservationRule)
    repository: Repository<ReservationRule>,
  ) {
    super(repository);
  }

  /**
   * 获取当前生效的预约规则（V1 固定 id=1）
   */
  async getRules(): Promise<ReservationRule | null> {
    return this.findById(1);
  }

  /**
   * 获取预约规则，不存在则抛异常
   */
  async getRulesOrFail(): Promise<ReservationRule> {
    return this.findByIdOrFail(1);
  }

  /**
   * 更新预约规则（V1 固定 id=1）
   */
  async updateRules(data: Partial<ReservationRule>): Promise<ReservationRule> {
    return this.update(1, data as any);
  }

  /**
   * 判断是否需要商家确认
   */
  async isConfirmationRequired(): Promise<boolean> {
    const rules = await this.getRules();
    return rules?.require_confirmation ?? false;
  }

  /**
   * 获取时段时长（分钟）
   */
  async getSlotDuration(): Promise<number> {
    const rules = await this.getRules();
    return rules?.slot_duration ?? 60;
  }
}
