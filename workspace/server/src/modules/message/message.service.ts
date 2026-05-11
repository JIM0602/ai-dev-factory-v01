import { Injectable } from '@nestjs/common';
import { MessageRepository } from '../../database/repositories/message.repository';
import { MessageRecipientType } from '../../database/entities/message.entity';

/**
 * 消息通知服务（V1 预留）
 *
 * V1 仅提供 createMessage() 方法供其他模块调用以记录消息，
 * 不实现实际的消息发送（微信订阅消息等）。
 */
@Injectable()
export class MessageService {
  constructor(private readonly messageRepo: MessageRepository) {}

  /**
   * 创建一条消息记录
   *
   * @param recipientType 接收方类型
   * @param recipientId   接收方标识
   * @param scene         通知场景
   * @param title         消息标题
   * @param content       消息内容
   */
  async createMessage(
    recipientType: MessageRecipientType,
    recipientId: string,
    scene: string,
    title: string,
    content: Record<string, any>,
  ) {
    return this.messageRepo.createMessage({
      recipient_type: recipientType,
      recipient_id: recipientId,
      scene,
      title,
      content,
    });
  }
}
