import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../entities/store.entity';
import { BaseRepository } from './base.repository';

/**
 * 门店信息 Repository
 *
 * V1 单门店，大部分操作针对 id=1 的记录。
 */
@Injectable()
export class StoreRepository extends BaseRepository<Store> {
  constructor(
    @InjectRepository(Store)
    repository: Repository<Store>,
  ) {
    super(repository);
  }

  /**
   * 获取门店配置（V1 固定 id=1）
   */
  async getStoreConfig(): Promise<Store | null> {
    return this.findById(1);
  }

  /**
   * 获取门店配置，不存在则抛异常
   */
  async getStoreConfigOrFail(): Promise<Store> {
    return this.findByIdOrFail(1);
  }

  /**
   * 更新门店配置（V1 固定 id=1）
   */
  async updateStoreConfig(data: Partial<Store>): Promise<Store> {
    return this.update(1, data as any);
  }

  /**
   * 获取桌位总数
   */
  async getTableCount(): Promise<number> {
    const store = await this.getStoreConfig();
    return store?.table_count ?? 0;
  }

  /**
   * 格式化营业时间供前端使用
   */
  async getBusinessHours(): Promise<{ open: string; close: string } | null> {
    const store = await this.getStoreConfig();
    if (!store) return null;
    return { open: store.open_time, close: store.close_time };
  }
}
