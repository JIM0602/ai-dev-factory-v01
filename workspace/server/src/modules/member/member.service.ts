import { Injectable, NotFoundException } from '@nestjs/common';
import { MemberRepository } from '../../database/repositories/member.repository';
import { ConsumptionRecordRepository } from '../../database/repositories/consumption-record.repository';

@Injectable()
export class MemberService {
  constructor(
    private readonly memberRepo: MemberRepository,
    private readonly consumptionRecordRepo: ConsumptionRecordRepository,
  ) {}

  /**
   * 搜索会员
   *
   * - 全数字且长度 11 位：按手机号精确匹配
   * - 其他：按姓名模糊搜索
   */
  async searchMembers(search: string, page: number = 1, pageSize: number = 20) {
    // 判断是否为手机号搜索
    const isPhoneSearch = /^1[3-9]\d{9}$/.test(search);

    if (isPhoneSearch) {
      const member = await this.memberRepo.findByPhone(search);
      if (!member) {
        return {
          list: [],
          pagination: { page: 1, page_size: pageSize, total: 0, total_pages: 0 },
        };
      }
      return {
        list: [
          {
            id: member.id,
            name: member.name,
            phone: this.maskPhone(member.phone),
            total_visits: member.total_visits,
            total_duration_minutes: member.total_duration_minutes,
            last_visit_date: member.last_visit_date,
          },
        ],
        pagination: { page: 1, page_size: pageSize, total: 1, total_pages: 1 },
      };
    }

    // 姓名模糊搜索
    const result = await this.memberRepo.searchByName(search, page, pageSize);

    return {
      list: result.items.map((m) => ({
        id: m.id,
        name: m.name,
        phone: this.maskPhone(m.phone),
        total_visits: m.total_visits,
        total_duration_minutes: m.total_duration_minutes,
        last_visit_date: m.last_visit_date,
      })),
      pagination: {
        page: result.page,
        page_size: result.pageSize,
        total: result.total,
        total_pages: Math.ceil(result.total / result.pageSize),
      },
    };
  }

  /**
   * 获取会员详情（含消费记录）
   */
  async getMemberDetail(
    id: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const member = await this.memberRepo.findById(id);
    if (!member) {
      throw new NotFoundException({
        code: 40003,
        message: '会员不存在',
        data: null,
      });
    }

    const records = await this.consumptionRecordRepo.findByMemberId(
      id,
      page,
      pageSize,
    );

    return {
      id: member.id,
      name: member.name,
      phone: this.maskPhone(member.phone),
      phone_full: member.phone,
      total_visits: member.total_visits,
      total_duration_minutes: member.total_duration_minutes,
      last_visit_date: member.last_visit_date,
      records: {
        list: records.items.map((r) => ({
          id: r.id,
          visit_date: r.visit_date,
          check_in_time: r.check_in_time,
          check_out_time: r.check_out_time,
          duration_minutes: r.duration_minutes,
          has_coupon: r.has_coupon,
          source: r.source,
        })),
        pagination: {
          page: records.page,
          page_size: records.pageSize,
          total: records.total,
          total_pages: Math.ceil(records.total / records.pageSize),
        },
      },
    };
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length !== 11) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
}
