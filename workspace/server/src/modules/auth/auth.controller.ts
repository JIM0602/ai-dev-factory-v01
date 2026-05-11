import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WechatLoginDto, AdminLoginDto } from './auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('wechat-login')
  @ApiOperation({ summary: '微信小程序登录' })
  async wechatLogin(@Body() dto: WechatLoginDto) {
    return this.authService.wechatLogin(dto.code);
  }

  @Public()
  @Post('admin-login')
  @ApiOperation({ summary: 'Web 后台登录' })
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.username, dto.password);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: '刷新 Token' })
  async refreshToken(@CurrentUser() user: JwtPayload) {
    return this.authService.refreshToken(user);
  }
}
