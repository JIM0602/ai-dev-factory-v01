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
 * 团购券来源枚举
 */
export enum CouponSource {
  MEITUAN = 'meituan',
  DOUYIN = 'douyin',
  OTHER = 'other',
}

/**
 * 团购券核销记录表
 *
 * V1 仅做记录，不验证真伪。
 * 一次计时会话可核销多张券。
 */
@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => TimerSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'timer_session_id' })
  timerSession: TimerSession;

  @Index('idx_coupons_session')
  @Column({ type: 'bigint' })
  timer_session_id: number;

  @Column({ type: 'varchar', length: 100 })
  coupon_code: string;

  @Index('idx_coupons_source')
  @Column({
    type: 'enum',
    enum: CouponSource,
  })
  coupon_source: CouponSource;

  @Column({ type: 'varchar', length: 50, nullable: true })
  coupon_type: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
