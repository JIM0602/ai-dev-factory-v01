import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { QueryCouponsDto } from './coupon.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Coupon')
@Controller()
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Roles('merchant')
  @Get('coupons')
  @ApiOperation({ summary: '查询团购券核销记录' })
  async searchCoupons(@Query() query: QueryCouponsDto) {
    return this.couponService.searchCoupons(
      {
        source: query.source,
        start_date: query.start_date,
        end_date: query.end_date,
      },
      query.page,
      query.page_size,
    );
  }
}
