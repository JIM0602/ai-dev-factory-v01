import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimerExtension } from '../entities/timer-extension.entity';
import { BaseRepository } from './base.repository';

/**
 * 加时记录 Repository
 */
@Injectable()
export class TimerExtensionRepository extends BaseRepository<TimerExtension> {
  constructor(
    @InjectRepository(TimerExtension)
    repository: Repository<TimerExtension>,
  ) {
    super(repository);
  }

  /**
   * 查询某计时会话的所有加时记录
   */
  async findByTimerSessionId(timerSessionId: number): Promise<TimerExtension[]> {
    return this.findBy({ timer_session_id: timerSessionId } as any);
  }

  /**
   * 记录一次加时操作
   */
  async recordExtension(
    timerSessionId: number,
    extensionMinutes: number,
  ): Promise<TimerExtension> {
    return this.create({
      timer_session_id: timerSessionId,
      extension_minutes: extensionMinutes,
    } as any);
  }

  /**
   * 获取某计时会话的累计加时次数
   */
  async countByTimerSessionId(timerSessionId: number): Promise<number> {
    return this.count({ timer_session_id: timerSessionId } as any);
  }
}
