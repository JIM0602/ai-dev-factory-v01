import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
} from 'typeorm';

/**
 * 门店信息表（V1 单门店，仅 1 行记录）
 */
@Entity('store')
@Check('id = 1')
export class Store {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  address_guide: string | null;

  @Column({ type: 'varchar', length: 11 })
  phone: string;

  @Column({ type: 'jsonb', default: [] })
  photos: string[];

  @Column({ type: 'time', default: '10:00' })
  open_time: string;

  @Column({ type: 'time', default: '22:00' })
  close_time: string;

  @Column({ type: 'jsonb', default: [] })
  rest_days: number[];

  @Column({ type: 'integer', default: 8 })
  table_count: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
