import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TimerSession,
  TimerSessionStatus,
} from '../entities/timer-session.entity';
import { BaseRepository } from './base.repository';

/**
 * 计时会话 Repository
 */
@Injectable()
export class TimerSessionRepository extends BaseRepository<TimerSession> {
  constructor(
    @InjectRepository(TimerSession)
    repository: Repository<TimerSession>,
  ) {
    super(repository);
  }

  /**
   * 按预约 ID 查找计时会话
   */
  async findByReservationId(
    reservationId: number,
  ): Promise<TimerSession | null> {
    return this.findOneBy({ reservation_id: reservationId } as any);
  }

  /**
   * 获取所有进行中的计时会话（计时看板用）
   * 按剩余时间升序排列（剩余最少的排最前）
   */
  async findActiveSessions(): Promise<TimerSession[]> {
    return this.repo
      .createQueryBuilder('ts')
      .leftJoinAndSelect('ts.reservation', 'r')
      .where('ts.status = :status', {
        status: TimerSessionStatus.ACTIVE,
      })
      .orderBy(
        `ts.check_in_time + (ts.original_duration_minutes + ts.total_extension_minutes) * INTERVAL '1 minute'`,
        'ASC',
      )
      .getMany();
  }

  /**
   * 获取进行中的计时会话数量
   */
  async countActive(): Promise<number> {
    return this.count({
      status: TimerSessionStatus.ACTIVE,
    } as any);
  }

  /**
   * 创建计时会话（到店登记）
   */
  async startSession(data: {
    reservation_id: number;
    table_number: number;
    check_in_time: Date;
    expected_end_time: Date;
    original_duration_minutes: number;
  }): Promise<TimerSession> {
    return this.create({
      ...data,
      status: TimerSessionStatus.ACTIVE,
      total_extension_minutes: 0,
    } as any);
  }

  /**
   * 加时操作：累加 extension_minutes 并延长 expected_end_time
   */
  async extendTime(
    sessionId: number,
    extensionMinutes: number,
  ): Promise<TimerSession> {
    const session = await this.findByIdOrFail(sessionId);
    const newTotal = session.total_extension_minutes + extensionMinutes;
    const newExpectedEnd = new Date(
      session.expected_end_time.getTime() + extensionMinutes * 60 * 1000,
    );

    await this.repo.update(sessionId, {
      total_extension_minutes: newTotal,
      expected_end_time: newExpectedEnd,
    } as any);

    return this.findByIdOrFail(sessionId);
  }

  /**
   * 结束计时
   */
  async endSession(
    sessionId: number,
    actualEndTime: Date,
  ): Promise<TimerSession> {
    await this.repo.update(sessionId, {
      status: TimerSessionStatus.COMPLETED,
      actual_end_time: actualEndTime,
    } as any);

    return this.findByIdOrFail(sessionId);
  }
}
