import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsumptionRecord } from '../entities/consumption-record.entity';
import { ReservationSource } from '../entities/reservation.entity';
import { BaseRepository } from './base.repository';

/**
 * 消费记录 Repository
 */
@Injectable()
export class ConsumptionRecordRepository extends BaseRepository<ConsumptionRecord> {
  constructor(
    @InjectRepository(ConsumptionRecord)
    repository: Repository<ConsumptionRecord>,
  ) {
    super(repository);
  }

  /**
   * 查询某会员的消费历史（分页）
   */
  async findByMemberId(
    memberId: number,
    page: number = 1,
    pageSize: number = 20,
  ) {
    return this.paginate(
      {
        where: { member_id: memberId } as any,
        order: { visit_date: 'DESC', check_in_time: 'DESC' },
      },
      page,
      pageSize,
    );
  }

  /**
   * 按预约 ID 查找消费记录
   */
  async findByReservationId(
    reservationId: number,
  ): Promise<ConsumptionRecord | null> {
    return this.findOneBy({ reservation_id: reservationId } as any);
  }

  /**
   * 按计时会话 ID 查找消费记录
   */
  async findByTimerSessionId(
    timerSessionId: number,
  ): Promise<ConsumptionRecord | null> {
    return this.findOneBy({ timer_session_id: timerSessionId } as any);
  }

  /**
   * 创建消费记录（计时结束时调用）
   */
  async createConsumptionRecord(data: {
    member_id: number;
    reservation_id: number;
    timer_session_id: number;
    visit_date: string;
    check_in_time: Date;
    check_out_time: Date;
    duration_minutes: number;
    has_coupon: boolean;
    source: ReservationSource;
  }): Promise<ConsumptionRecord> {
    return this.create(data as any);
  }

  /**
   * 按日期范围查询消费记录
   */
  async findByDateRange(
    startDate?: string,
    endDate?: string,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const qb = this.repo.createQueryBuilder('cr');

    if (startDate) {
      qb.andWhere('cr.visit_date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('cr.visit_date <= :endDate', { endDate });
    }

    qb.orderBy('cr.visit_date', 'DESC').addOrderBy('cr.check_in_time', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }
}
