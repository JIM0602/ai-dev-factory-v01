import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Message,
  MessageRecipientType,
  MessageStatus,
} from '../entities/message.entity';
import { BaseRepository } from './base.repository';

/**
 * 消息通知记录 Repository（V1 预留）
 *
 * V1 仅提供写入能力，不实现实际发送。
 */
@Injectable()
export class MessageRepository extends BaseRepository<Message> {
  constructor(
    @InjectRepository(Message)
    repository: Repository<Message>,
  ) {
    super(repository);
  }

  /**
   * 创建一条消息记录
   */
  async createMessage(data: {
    recipient_type: MessageRecipientType;
    recipient_id: string;
    scene: string;
    title: string;
    content: Record<string, any>;
  }): Promise<Message> {
    return this.create({
      ...data,
      status: MessageStatus.PENDING,
    } as any);
  }

  /**
   * 查询某接收方的消息列表
   */
  async findByRecipient(
    recipientType: MessageRecipientType,
    recipientId: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    return this.paginate(
      {
        where: {
          recipient_type: recipientType,
          recipient_id: recipientId,
        } as any,
        order: { created_at: 'DESC' },
      },
      page,
      pageSize,
    );
  }

  /**
   * 按场景查询消息
   */
  async findByScene(
    scene: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    return this.paginate(
      {
        where: { scene } as any,
        order: { created_at: 'DESC' },
      },
      page,
      pageSize,
    );
  }

  /**
   * 更新消息状态
   */
  async updateStatus(
    messageId: number,
    status: MessageStatus,
  ): Promise<Message> {
    return this.update(messageId, { status } as any);
  }
}
