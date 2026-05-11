import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WechatLoginDto {
  @ApiProperty({ description: 'wx.login() 返回的临时 code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class AdminLoginDto {
  @ApiProperty({ description: '用户名' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ description: '密码' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginResponseDto {
  token: string;
  expires_in: number;
  role: 'customer' | 'merchant';
  nickname?: string;
  username?: string;
  openid?: string;
}
