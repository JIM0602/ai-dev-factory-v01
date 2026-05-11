import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponSource } from '../entities/coupon.entity';
import { BaseRepository } from './base.repository';

/**
 * 团购券核销记录 Repository
 */
@Injectable()
export class CouponRepository extends BaseRepository<Coupon> {
  constructor(
    @InjectRepository(Coupon)
    repository: Repository<Coupon>,
  ) {
    super(repository);
  }

  /**
   * 查询某计时会话的所有团购券记录
   */
  async findByTimerSessionId(timerSessionId: number): Promise<Coupon[]> {
    return this.findBy({ timer_session_id: timerSessionId } as any);
  }

  /**
   * 记录一张团购券的核销
   */
  async recordCoupon(data: {
    timer_session_id: number;
    coupon_code: string;
    coupon_source: CouponSource;
    coupon_type?: string;
  }): Promise<Coupon> {
    return this.create(data as any);
  }

  /**
   * 批量记录团购券核销
   */
  async recordCoupons(
    coupons: {
      timer_session_id: number;
      coupon_code: string;
      coupon_source: CouponSource;
      coupon_type?: string;
    }[],
  ): Promise<Coupon[]> {
    const entities = coupons.map((c) =>
      this.repository.create({
        timer_session_id: c.timer_session_id,
        coupon_code: c.coupon_code,
        coupon_source: c.coupon_source,
        coupon_type: c.coupon_type ?? null,
      }),
    );
    return this.repository.save(entities);
  }

  /**
   * 多条件查询团购券记录
   */
  async searchCoupons(
    filters: {
      startDate?: string;
      endDate?: string;
      couponSource?: CouponSource;
    },
    page: number = 1,
    pageSize: number = 20,
  ) {
    const qb = this.repo.createQueryBuilder('c');

    if (filters.startDate) {
      qb.andWhere('c.created_at >= :startDate', {
        startDate: `${filters.startDate}T00:00:00+08:00`,
      });
    }
    if (filters.endDate) {
      qb.andWhere('c.created_at <= :endDate', {
        endDate: `${filters.endDate}T23:59:59+08:00`,
      });
    }
    if (filters.couponSource) {
      qb.andWhere('c.coupon_source = :source', {
        source: filters.couponSource,
      });
    }

    qb.orderBy('c.created_at', 'DESC');

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    return { items, total, page, pageSize };
  }

  /**
   * 检查某计时会话是否使用了团购券
   */
  async hasCoupon(timerSessionId: number): Promise<boolean> {
    return this.exists({ timer_session_id: timerSessionId } as any);
  }
}
