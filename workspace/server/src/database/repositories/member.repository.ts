import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Member } from '../entities/member.entity';
import { BaseRepository } from './base.repository';

/**
 * 会员档案 Repository
 */
@Injectable()
export class MemberRepository extends BaseRepository<Member> {
  constructor(
    @InjectRepository(Member)
    repository: Repository<Member>,
  ) {
    super(repository);
  }

  /**
   * 按手机号精确查找会员
   */
  async findByPhone(phone: string): Promise<Member | null> {
    return this.findOneBy({ phone } as any);
  }

  /**
   * 按姓名模糊搜索会员
   */
  async searchByName(keyword: string, page: number = 1, pageSize: number = 20) {
    return this.paginate(
      {
        where: { name: ILike(`%${keyword}%`) } as any,
        order: { last_visit_date: 'DESC', total_visits: 'DESC' },
      },
      page,
      pageSize,
    );
  }

  /**
   * 查找或创建会员（以手机号为唯一标识）
   * 如果会员已存在则更新信息，否则创建新会员
   */
  async findOrCreate(data: {
    name: string;
    phone: string;
  }): Promise<Member> {
    const existing = await this.findByPhone(data.phone);
    if (existing) {
      return existing;
    }
    return this.create({
      name: data.name,
      phone: data.phone,
      total_visits: 0,
      total_duration_minutes: 0,
    } as any);
  }

  /**
   * 会员消费后更新统计信息
   */
  async updateAfterVisit(
    memberId: number,
    visitDate: string,
    durationMinutes: number,
  ): Promise<Member> {
    const member = await this.findByIdOrFail(memberId);
    await this.repo.update(memberId, {
      total_visits: member.total_visits + 1,
      total_duration_minutes: member.total_duration_minutes + durationMinutes,
      last_visit_date: visitDate,
      name: member.name, // 保持最近一次消费的姓名
    } as any);
    return this.findByIdOrFail(memberId);
  }

  /**
   * 获取会员总数
   */
  async getTotalCount(): Promise<number> {
    return this.count();
  }
}
