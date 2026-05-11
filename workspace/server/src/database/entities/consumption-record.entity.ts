import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Member } from './member.entity';
import { ReservationSource } from './reservation.entity';

/**
 * 消费记录表
 *
 * 计时结束时自动生成的消费记录。
 * 与 Reservation 和 TimerSession 均为 1:1 关系。
 */
@Entity('consumption_records')
export class ConsumptionRecord {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @Index('idx_consumption_member')
  @Column({ type: 'bigint' })
  member_id: number;

  @Column({ type: 'bigint', unique: true })
  reservation_id: number;

  @Column({ type: 'bigint', unique: true })
  timer_session_id: number;

  @Index('idx_consumption_visit_date')
  @Column({ type: 'date' })
  visit_date: string;

  @Column({ type: 'timestamptz' })
  check_in_time: Date;

  @Column({ type: 'timestamptz' })
  check_out_time: Date;

  @Column({ type: 'integer' })
  duration_minutes: number;

  @Column({ type: 'boolean', default: false })
  has_coupon: boolean;

  @Column({
    type: 'enum',
    enum: ReservationSource,
  })
  source: ReservationSource;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
