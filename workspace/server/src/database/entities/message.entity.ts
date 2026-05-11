import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 消息接收方类型枚举
 */
export enum MessageRecipientType {
  CUSTOMER = 'customer',
  MERCHANT = 'merchant',
}

/**
 * 消息发送状态枚举
 */
export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

/**
 * 消息通知记录表（V1 预留）
 *
 * V1 仅建表和提供写入方法，不实现实际发送逻辑。
 * 后续模块可通过 service 的 createMessage() 记录消息。
 */
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Index('idx_messages_recipient')
  @Column({
    type: 'enum',
    enum: MessageRecipientType,
  })
  recipient_type: MessageRecipientType;

  @Index('idx_messages_recipient')
  @Column({ type: 'varchar', length: 64 })
  recipient_id: string;

  @Column({ type: 'varchar', length: 50 })
  scene: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Index('idx_messages_status')
  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING,
  })
  status: MessageStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
