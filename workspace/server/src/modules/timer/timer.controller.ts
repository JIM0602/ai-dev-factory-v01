import { Controller, Get, Post, Put, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TimerService } from './timer.service';
import { CheckInDto, ExtendTimeDto, ChangeTableDto } from './timer.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Timer')
@Controller()
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Roles('merchant')
  @Post('reservations/:id/checkin')
  @ApiOperation({ summary: '到店登记（创建计时会话）' })
  async checkIn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckInDto,
  ) {
    return this.timerService.checkIn(id, dto);
  }

  @Roles('merchant')
  @Get('timer/dashboard')
  @ApiOperation({ summary: '计时看板' })
  async getDashboard() {
    return this.timerService.getDashboard();
  }

  @Roles('merchant')
  @Post('timer/:sessionId/extend')
  @ApiOperation({ summary: '加时操作' })
  async extendTime(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: ExtendTimeDto,
  ) {
    return this.timerService.extendTime(sessionId, dto);
  }

  @Roles('merchant')
  @Post('timer/:sessionId/end')
  @ApiOperation({ summary: '结束计时' })
  async endSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.timerService.endSession(sessionId);
  }

  @Roles('merchant')
  @Put('timer/:sessionId/table')
  @ApiOperation({ summary: '更换桌位' })
  async changeTable(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: ChangeTableDto,
  ) {
    return this.timerService.changeTable(sessionId, dto);
  }
}
