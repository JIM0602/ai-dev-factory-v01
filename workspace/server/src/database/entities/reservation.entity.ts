import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 预约状态枚举
 */
export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

/**
 * 预约来源枚举
 */
export enum ReservationSource {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
  WALK_IN = 'walk_in',
}

/**
 * 预约记录表（核心业务表）
 *
 * 状态流转:
 *   pending ──(商家确认)──> confirmed ──(到店登记)──> in_progress ──(结束计时)──> completed
 *     │                       │
 *     ├──(商家拒绝)──> rejected   └──(顾客取消)──> cancelled
 *     │
 *     └──(顾客取消/自动取消)──> cancelled
 */
@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Index('idx_reservations_customer_openid')
  @Column({ type: 'varchar', length: 64 })
  customer_openid: string;

  @Column({ type: 'varchar', length: 50 })
  customer_name: string;

  @Index('idx_reservations_customer_phone')
  @Column({ type: 'varchar', length: 11 })
  customer_phone: string;

  @Index('idx_reservations_date_status')
  @Column({ type: 'date' })
  reservation_date: string;

  @Index('idx_reservations_date_slot')
  @Column({ type: 'time' })
  slot_start_time: string;

  @Column({ type: 'time' })
  slot_end_time: string;

  @Column({ type: 'integer', default: 1 })
  guest_count: number;

  @Index('idx_reservations_date_status')
  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.PENDING,
  })
  status: ReservationStatus;

  @Column({
    type: 'enum',
    enum: ReservationSource,
    default: ReservationSource.CUSTOMER,
  })
  source: ReservationSource;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cancel_reason: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  remark: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
