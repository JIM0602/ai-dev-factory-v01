import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  Reservation,
  ReservationStatus,
  ReservationSource,
} from '../entities/reservation.entity';
import { BaseRepository } from './base.repository';

/**
 * 预约记录 Repository
 *
 * 核心业务 Repository，封装容量查询、状态流转等核心操作。
 */
@Injectable()
export class ReservationRepository extends BaseRepository<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    repository: Repository<Reservation>,
  ) {
    super(repository);
  }

  /**
   * 查询某日期某时段的已占用容量（pending + confirmed + in_progress）
   * 用于容量校验，应在事务中配合 SELECT FOR UPDATE 使用
   */
  async countOccupied(date: string, slotStartTime: string): Promise<number> {
    return this.count({
      reservation_date: date,
      slot_start_time: slotStartTime,
      status: In([
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
        ReservationStatus.IN_PROGRESS,
      ]),
    } as any);
  }

  /**
   * 查询某日期某时段的已占用容量（带行级锁，用于并发安全）
   */
  async countOccupiedForUpdate(
    date: string,
    slotStartTime: string,
  ): Promise<number> {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('COUNT(*)', 'count')
      .where('r.reservation_date = :date', { date })
      .andWhere('r.slot_start_time = :slotStartTime', { slotStartTime })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [
          ReservationStatus.PENDING,
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
        ],
      })
      .setLock('pessimistic_write')
      .getRawOne();
    return parseInt(result?.count || '0', 10);
  }

  /**
   * 检查顾客在同日期同时段是否已有有效预约
   */
  async hasExistingReservation(
    openid: string,
    date: string,
    slotStartTime: string,
  ): Promise<boolean> {
    return this.exists({
      customer_openid: openid,
      reservation_date: date,
      slot_start_time: slotStartTime,
      status: In([
        ReservationStatus.PENDING,
        ReservationStatus.CONFIRMED,
        ReservationStatus.IN_PROGRESS,
      ]),
    } as any);
  }

  /**
   * 按顾客 OpenID 查询预约列表（分页）
   */
  async findByCustomer(
    openid: string,
    status?: ReservationStatus,
    page: number = 1,
    pageSize: number = 20,
  ) {
    const where: any = { customer_openid: openid };
    if (status) where.status = status;

    return this.paginate(
      {
        where,
        order: { reservation_date: 'DESC', slot_start_time: 'DESC' },
      },
      page,
      pageSize,
    );
  }

  /**
   * 商家端多条件查询预约列表
   */
  async findByMerchant(
    filters: {
      date?: string;
      status?: ReservationStatus;
      keyword?: string;
      source?: ReservationSource;
    },
    page: number = 1,
    pageSize: number = 20,
  ) {
    const qb = this.repo.createQueryBuilder('r');

    if (filters.date) {
      qb.andWhere('r.reservation_date = :date', { date: filters.date });
    }
    if (filters.status) {
      qb.andWhere('r.status = :status', { status: filters.status });
    }
    if (filters.keyword) {
      qb.andWhere(
        '(r.customer_name ILIKE :keyword OR r.customer_phone LIKE :keywordPattern)',
        {
          keyword: `%${filters.keyword}%`,
          keywordPattern: `%${filters.keyword}%`,
        },
      );
    }
    if (filters.source) {
      qb.andWhere('r.source = :source', { source: filters.source });
    }

    qb.orderBy('r.reservation_date', 'DESC')
      .addOrderBy('r.slot_start_time', 'ASC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }

  /**
   * 查询需要自动取消的待确认预约
   * 条件：status='pending'，且距预约开始时间不足 auto_cancel_hours 小时
   */
  async findPendingToAutoCancel(autoCancelHours: number): Promise<Reservation[]> {
    // 计算截止时间：当前时间 + auto_cancel_hours 小时后，预约开始的预约需取消
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() + autoCancelHours);

    return this.repo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: ReservationStatus.PENDING })
      .andWhere(
        `(r.reservation_date::text || ' ' || r.slot_start_time::text)::timestamp <= :cutoffTime`,
        { cutoffTime: cutoffTime.toISOString() },
      )
      .getMany();
  }

  /**
   * 批量更新预约状态
   */
  async batchUpdateStatus(
    ids: number[],
    status: ReservationStatus,
    extra?: { cancel_reason?: string; rejection_reason?: string },
  ): Promise<void> {
    const data: any = { status };
    if (extra?.cancel_reason) data.cancel_reason = extra.cancel_reason;
    if (extra?.rejection_reason) data.rejection_reason = extra.rejection_reason;

    await this.repo.update(ids, data);
  }

  /**
   * 获取今日概览统计数据
   */
  async getTodaySummary(date: string): Promise<{
    totalReservations: number;
    inProgress: number;
    pending: number;
    confirmed: number;
  }> {
    const [totalReservations, inProgress, pending, confirmed] =
      await Promise.all([
        this.count({ reservation_date: date } as any),
        this.count({
          reservation_date: date,
          status: ReservationStatus.IN_PROGRESS,
        } as any),
        this.count({
          reservation_date: date,
          status: ReservationStatus.PENDING,
        } as any),
        this.count({
          reservation_date: date,
          status: ReservationStatus.CONFIRMED,
        } as any),
      ]);

    return { totalReservations, inProgress, pending, confirmed };
  }

  /**
   * 获取某日期所有时段的容量占用情况
   */
  async getSlotOccupancy(date: string): Promise<
    { slotStartTime: string; occupied: number }[]
  > {
    const result = await this.repo
      .createQueryBuilder('r')
      .select('r.slot_start_time', 'slotStartTime')
      .addSelect('COUNT(*)', 'occupied')
      .where('r.reservation_date = :date', { date })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [
          ReservationStatus.PENDING,
          ReservationStatus.CONFIRMED,
          ReservationStatus.IN_PROGRESS,
        ],
      })
      .groupBy('r.slot_start_time')
      .orderBy('r.slot_start_time', 'ASC')
      .getRawMany();

    return result.map((row: any) => ({
      slotStartTime: row.slotStartTime,
      occupied: parseInt(row.occupied, 10),
    }));
  }
}
