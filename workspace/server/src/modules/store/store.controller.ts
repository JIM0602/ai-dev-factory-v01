import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { UpdateStoreDto, UpdateRulesDto } from './store.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Store')
@Controller()
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Public()
  @Get('store/info')
  @ApiOperation({ summary: '获取门店公开展示信息' })
  async getStoreInfo() {
    return this.storeService.getStoreInfo();
  }

  @Roles('merchant')
  @Get('store/config')
  @ApiOperation({ summary: '获取门店完整配置（商家端）' })
  async getStoreConfig() {
    return this.storeService.getStoreConfig();
  }

  @Roles('merchant')
  @Put('store/config')
  @ApiOperation({ summary: '更新门店配置' })
  async updateStoreConfig(@Body() dto: UpdateStoreDto) {
    return this.storeService.updateStoreConfig(dto);
  }

  @Roles('merchant')
  @Get('rules')
  @ApiOperation({ summary: '获取预约规则' })
  async getRules() {
    return this.storeService.getRules();
  }

  @Roles('merchant')
  @Put('rules')
  @ApiOperation({ summary: '更新预约规则' })
  async updateRules(@Body() dto: UpdateRulesDto) {
    return this.storeService.updateRules(dto);
  }
}
