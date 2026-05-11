import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Reservation } from './reservation.entity';

/**
 * 计时会话状态枚举
 */
export enum TimerSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

/**
 * 计时会话表
 *
 * 记录每次顾客到店后的计时信息。
 * 与 Reservation 是 1:1 关系（一次预约最多一条计时会话）。
 */
@Entity('timer_sessions')
export class TimerSession {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @OneToOne(() => Reservation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reservation_id' })
  reservation: Reservation;

  @Column({ type: 'bigint', unique: true })
  reservation_id: number;

  @Column({ type: 'integer' })
  table_number: number;

  @Column({ type: 'timestamptz' })
  check_in_time: Date;

  @Column({ type: 'timestamptz' })
  expected_end_time: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actual_end_time: Date | null;

  @Column({ type: 'integer' })
  original_duration_minutes: number;

  @Column({ type: 'integer', default: 0 })
  total_extension_minutes: number;

  @Index('idx_timer_sessions_status')
  @Column({
    type: 'enum',
    enum: TimerSessionStatus,
    default: TimerSessionStatus.ACTIVE,
  })
  status: TimerSessionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
