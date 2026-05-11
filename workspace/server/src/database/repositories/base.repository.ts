import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
  ObjectLiteral,
} from 'typeorm';
import { NotFoundException } from '@nestjs/common';

/**
 * 通用 Repository 基类
 *
 * 封装常用 CRUD 操作，减少各模块 Repository 的重复代码。
 * 子类通过 super 调用基类方法，或在基类方法不满足需求时直接使用 this.repository。
 */
export class BaseRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * 分页查询
   */
  async paginate(
    options: FindManyOptions<T>,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ items: T[]; total: number; page: number; pageSize: number }> {
    const [items, total] = await this.repository.findAndCount({
      ...options,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  /**
   * 按 ID 查找，不存在则抛异常
   */
  async findByIdOrFail(id: number | string, relations?: string[]): Promise<T> {
    const record = await this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
      relations,
    } as FindOneOptions<T>);
    if (!record) {
      throw new NotFoundException(
        `Record not found: ${this.repository.metadata.tableName} id=${id}`,
      );
    }
    return record;
  }

  /**
   * 按 ID 查找，可能为 null
   */
  async findById(id: number | string): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
    } as FindOneOptions<T>);
  }

  /**
   * 按条件查找单条记录
   */
  async findOneBy(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOne({ where });
  }

  /**
   * 按条件查找多条记录
   */
  async findBy(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where });
  }

  /**
   * 查找全部记录
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options || {});
  }

  /**
   * 创建记录
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * 更新记录
   */
  async update(id: number | string, data: DeepPartial<T>): Promise<T> {
    await this.repository.update(id as any, data as any);
    return this.findByIdOrFail(id);
  }

  /**
   * 删除记录
   */
  async delete(id: number | string): Promise<void> {
    const result = await this.repository.delete(id as any);
    if (result.affected === 0) {
      throw new NotFoundException(
        `Record not found: ${this.repository.metadata.tableName} id=${id}`,
      );
    }
  }

  /**
   * 计数
   */
  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repository.count({ where });
  }

  /**
   * 检查记录是否存在
   */
  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }

  /**
   * 暴露底层 TypeORM Repository，供子类做复杂查询
   */
  get repo(): Repository<T> {
    return this.repository;
  }
}
