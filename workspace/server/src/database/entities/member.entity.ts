import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 会员档案表
 *
 * 基于手机号自动归集的会员信息。
 * 手机号是会员唯一标识。同一手机号的所有消费记录归集到同一会员。
 */
@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Index('idx_members_phone')
  @Column({ type: 'varchar', length: 11, unique: true })
  phone: string;

  @Column({ type: 'integer', default: 0 })
  total_visits: number;

  @Column({ type: 'integer', default: 0 })
  total_duration_minutes: number;

  @Column({ type: 'date', nullable: true })
  last_visit_date: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
