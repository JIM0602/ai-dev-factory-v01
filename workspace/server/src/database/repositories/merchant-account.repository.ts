import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantAccount } from '../entities/merchant-account.entity';
import { BaseRepository } from './base.repository';

/**
 * 商家账号 Repository
 */
@Injectable()
export class MerchantAccountRepository extends BaseRepository<MerchantAccount> {
  constructor(
    @InjectRepository(MerchantAccount)
    repository: Repository<MerchantAccount>,
  ) {
    super(repository);
  }

  /**
   * 按用户名查找
   */
  async findByUsername(username: string): Promise<MerchantAccount | null> {
    return this.findOneBy({ username } as any);
  }

  /**
   * 按微信 OpenID 查找
   */
  async findByWechatOpenid(openid: string): Promise<MerchantAccount | null> {
    return this.findOneBy({ wechat_openid: openid } as any);
  }

  /**
   * 创建商家账号
   */
  async createAccount(
    username: string,
    passwordHash: string,
    wechatOpenid?: string,
  ): Promise<MerchantAccount> {
    return this.create({
      username,
      password_hash: passwordHash,
      wechat_openid: wechatOpenid ?? null,
    } as any);
  }

  /**
   * 更新密码
   */
  async updatePassword(id: number, passwordHash: string): Promise<MerchantAccount> {
    return this.update(id, { password_hash: passwordHash } as any);
  }

  /**
   * 绑定/更新微信 OpenID
   */
  async updateWechatOpenid(id: number, openid: string): Promise<MerchantAccount> {
    return this.update(id, { wechat_openid: openid } as any);
  }
}
