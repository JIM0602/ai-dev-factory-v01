import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { ReservationStatus } from '../../database/entities/reservation.entity';
import { ReservationRuleRepository } from '../../database/repositories/reservation-rule.repository';
import { ReservationRepository } from '../../database/repositories/reservation.repository';

/**
 * 定时任务服务
 *
 * 负责预约自动取消等周期性任务。
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly rulesRepo: ReservationRuleRepository,
    private readonly reservationRepo: ReservationRepository,
  ) {}

  /**
   * 预约自动取消
   *
   * 每 5 分钟检查一次，自动取消超时未确认的预约。
   */
  @Cron('*/5 * * * *')
  async autoCancelPendingReservations() {
    this.logger.log('[Scheduler] 开始检查超时待确认预约...');

    const rules = await this.rulesRepo.getRules();
    if (!rules) {
      this.logger.warn('[Scheduler] 预约规则未配置，跳过');
      return;
    }

    // 未启用自动取消
    if (!rules.auto_cancel_hours || rules.auto_cancel_hours <= 0) {
      this.logger.debug('[Scheduler] 自动取消未启用');
      return;
    }

    // 未启用确认模式，无需自动取消
    if (!rules.require_confirmation) {
      this.logger.debug('[Scheduler] 确认模式未启用，跳过');
      return;
    }

    const pendingReservations =
      await this.reservationRepo.findPendingToAutoCancel(rules.auto_cancel_hours);

    if (pendingReservations.length === 0) {
      this.logger.debug('[Scheduler] 无超时待确认预约');
      return;
    }

    this.logger.log(
      `[Scheduler] 找到 ${pendingReservations.length} 条超时待确认预约，准备自动取消`,
    );

    // 在事务中批量更新
    await this.dataSource.transaction(async (manager) => {
      const ids = pendingReservations.map((r) => r.id);
      await manager.update(
        (await import('../../database/entities/reservation.entity')).Reservation,
        ids,
        {
          status: ReservationStatus.CANCELLED,
          cancel_reason: '系统自动取消（超时未确认）',
        },
      );
    });

    this.logger.log(
      `[Scheduler] 已自动取消 ${pendingReservations.length} 条超时待确认预约`,
    );
  }
}
