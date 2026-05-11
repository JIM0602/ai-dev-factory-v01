import { Injectable } from '@nestjs/common';
import { CouponRepository } from '../../database/repositories/coupon.repository';
import { ReservationRepository } from '../../database/repositories/reservation.repository';
import { CouponSource } from '../../database/entities/coupon.entity';

@Injectable()
export class CouponService {
  constructor(
    private readonly couponRepo: CouponRepository,
    private readonly reservationRepo: ReservationRepository,
  ) {}

  /**
   * 查询团购券核销记录
   */
  async searchCoupons(
    filters: {
      source?: string;
      start_date?: string;
      end_date?: string;
    },
    page: number = 1,
    pageSize: number = 20,
  ) {
    let couponSource: CouponSource | undefined;
    if (filters.source && filters.source !== 'all') {
      couponSource = filters.source as CouponSource;
    }

    const result = await this.couponRepo.searchCoupons(
      {
        startDate: filters.start_date,
        endDate: filters.end_date,
        couponSource,
      },
      page,
      pageSize,
    );

    // 关联查询顾客信息
    const list = await Promise.all(
      result.items.map(async (c) => {
        // 查找关联的预约来获取顾客信息
        const session = await this.couponRepo.repo
          .createQueryBuilder('c')
          .leftJoinAndSelect('c.timerSession', 'ts')
          .leftJoinAndSelect('ts.reservation', 'r')
          .where('c.id = :id', { id: c.id })
          .getOne();

        const customerName = (session as any)?.timerSession?.reservation?.customer_name || '未知';
        const customerPhone = (session as any)?.timerSession?.reservation?.customer_phone || '';
        const visitDate = (session as any)?.timerSession?.reservation?.reservation_date || '';

        return {
          id: c.id,
          coupon_code: c.coupon_code,
          coupon_source: c.coupon_source,
          coupon_type: c.coupon_type,
          customer_name: customerName,
          customer_phone: this.maskPhone(customerPhone),
          visit_date: visitDate,
          created_at: c.created_at,
        };
      }),
    );

    return {
      list,
      pagination: {
        page: result.page,
        page_size: result.pageSize,
        total: result.total,
        total_pages: Math.ceil(result.total / result.pageSize),
      },
    };
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length !== 11) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(7);
  }
}
