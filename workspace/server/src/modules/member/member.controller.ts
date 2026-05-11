import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MemberService } from './member.service';
import { QueryMembersDto } from './member.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Member')
@Controller()
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Roles('merchant')
  @Get('members')
  @ApiOperation({ summary: '搜索会员' })
  async searchMembers(@Query() query: QueryMembersDto) {
    return this.memberService.searchMembers(
      query.search,
      query.page,
      query.page_size,
    );
  }

  @Roles('merchant')
  @Get('members/:id')
  @ApiOperation({ summary: '会员详情（含消费记录）' })
  async getMemberDetail(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page?: number,
    @Query('page_size') pageSize?: number,
  ) {
    return this.memberService.getMemberDetail(
      id,
      page ?? 1,
      pageSize ?? 20,
    );
  }
}
