import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';

/**
 * 预约规则表（V1 单套规则，仅 1 行记录）
 */
@Entity('reservation_rules')
@Check('id = 1')
export class ReservationRule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: false })
  require_confirmation: boolean;

  @Column({ type: 'integer', default: 7 })
  advance_days: number;

  @Column({ type: 'integer', default: 60 })
  cutoff_minutes: number;

  @Column({ type: 'integer', nullable: true })
  auto_cancel_hours: number | null;

  @Column({ type: 'integer', default: 3 })
  customer_cancel_hours: number;

  @Column({ type: 'integer', default: 60 })
  slot_duration: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
