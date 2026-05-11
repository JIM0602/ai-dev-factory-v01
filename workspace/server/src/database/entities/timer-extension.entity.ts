import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TimerSession } from './timer-session.entity';

/**
 * 加时记录表
 *
 * 记录每次加时操作。一次计时会话可多次加时。
 */
@Entity('timer_extensions')
export class TimerExtension {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => TimerSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'timer_session_id' })
  timerSession: TimerSession;

  @Index('idx_timer_extensions_session')
  @Column({ type: 'bigint' })
  timer_session_id: number;

  @Column({ type: 'integer' })
  extension_minutes: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
