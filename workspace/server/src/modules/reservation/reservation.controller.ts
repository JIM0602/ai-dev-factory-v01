import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import {
  CreateReservationDto,
  MerchantCreateReservationDto,
  UpdateReservationStatusDto,
  QueryReservationSlotsDto,
  QueryMyReservationsDto,
  QueryMerchantReservationsDto,
} from './reservation.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Reservation')
@Controller()
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // ---------------------------------------------------------------------------
  // 公开接口 / 顾客端
  // ---------------------------------------------------------------------------

  @Public()
  @Get('reservations/slots')
  @ApiOperation({ summary: '获取指定日期的可预约时段列表' })
  async getSlots(@Query() query: QueryReservationSlotsDto) {
    return this.reservationService.getSlots(query.date);
  }

  @Roles('customer', 'merchant')
  @Post('reservations')
  @ApiOperation({ summary: '顾客提交预约' })
  async createReservation(
    @Body() dto: CreateReservationDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // 如果是商家身份创建预约，视为代客预约
    if (user.role === 'merchant') {
      return this.reservationService.createMerchantReservation(dto);
    }
    return this.reservationService.createReservation(dto, user.sub);
  }

  @Roles('customer')
  @Get('reservations/my')
  @ApiOperation({ summary: '顾客查看自己的预约列表' })
  async getMyReservations(
    @Query() query: QueryMyReservationsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationService.getMyReservations(
      user.sub,
      query.status,
      query.page,
      query.page_size,
    );
  }

  @Roles('customer', 'merchant')
  @Get('reservations/:id')
  @ApiOperation({ summary: '获取预约详情' })
  async getReservationDetail(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reservationService.getReservationDetail(id, user);
  }

  @Roles('customer', 'merchant')
  @Post('reservations/:id/cancel')
  @ApiOperation({ summary: '取消预约' })
  async cancelReservation(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    if (user.role === 'merchant') {
      return this.reservationService.merchantCancelReservation(id);
    }
    return this.reservationService.cancelReservation(id, user.sub);
  }

  // ---------------------------------------------------------------------------
  // 商家端
  // ---------------------------------------------------------------------------

  @Roles('merchant')
  @Get('reservations/merchant')
  @ApiOperation({ summary: '商家查看所有预约列表' })
  async getMerchantReservations(@Query() query: QueryMerchantReservationsDto) {
    return this.reservationService.getMerchantReservations(
      {
        date: query.date,
        status: query.status,
        search: query.search,
      },
      query.page,
      query.page_size,
    );
  }

  @Roles('merchant')
  @Post('reservations/merchant')
  @ApiOperation({ summary: '商家手动添加预约（代客预约）' })
  async createMerchantReservation(@Body() dto: MerchantCreateReservationDto) {
    return this.reservationService.createMerchantReservation(dto);
  }

  @Roles('merchant')
  @Post('reservations/:id/confirm')
  @ApiOperation({ summary: '商家确认预约' })
  async confirmReservation(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.confirmReservation(id);
  }

  @Roles('merchant')
  @Post('reservations/:id/reject')
  @ApiOperation({ summary: '商家拒绝预约' })
  async rejectReservation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationService.rejectReservation(id, dto.reason);
  }

  // ---------------------------------------------------------------------------
  // 容量查看
  // ---------------------------------------------------------------------------

  @Roles('merchant')
  @Get('admin/capacity')
  @ApiOperation({ summary: '当前容量概况' })
  async getCapacity(@Query('date') date?: string) {
    return this.reservationService.getCapacityOverview(date);
  }
}
