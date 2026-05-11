import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { MerchantAccountRepository } from '../../database/repositories/merchant-account.repository';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

/**
 * 认证服务
 *
 * 提供微信小程序登录、Web 后台登录、Token 刷新等功能。
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly merchantAccountRepo: MerchantAccountRepository,
  ) {}

  /**
   * 微信小程序登录
   *
   * 用微信 code 换取 openid（V1 使用 mock），
   * 判断 openid 是否为商家，签发对应角色的 JWT。
   */
  async wechatLogin(code: string): Promise<{
    token: string;
    expires_in: number;
    role: 'customer' | 'merchant';
    nickname: string;
    openid: string;
  }> {
    // V1: mock 微信 code 换 openid
    // 实际部署时需要调用微信接口 https://api.weixin.qq.com/sns/jscode2session
    const openid = await this.getOpenidByCode(code);

    // 检查是否为商家
    const merchantAccount = await this.merchantAccountRepo.findByWechatOpenid(openid);
    const role: 'customer' | 'merchant' = merchantAccount ? 'merchant' : 'customer';
    const expiresIn = role === 'merchant'
      ? this.configService.get<number>('JWT_EXPIRES_IN_MERCHANT', 86400)
      : this.configService.get<number>('JWT_EXPIRES_IN_CUSTOMER', 604800);

    const payload: JwtPayload = {
      sub: openid,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    };

    const token = this.jwtService.sign(payload);

    // Mock 昵称（V1 不做真实微信昵称获取）
    const nickname = role === 'merchant' ? merchantAccount!.username : '微信用户';

    return {
      token,
      expires_in: expiresIn,
      role,
      nickname,
      openid,
    };
  }

  /**
   * Web 后台登录
   *
   * 验证用户名密码，签发 JWT。
   */
  async adminLogin(username: string, password: string): Promise<{
    token: string;
    expires_in: number;
    role: 'merchant';
    username: string;
  }> {
    const account = await this.merchantAccountRepo.findByUsername(username);
    if (!account) {
      throw new UnauthorizedException({
        code: 10003,
        message: '用户名或密码错误',
        data: null,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 10003,
        message: '用户名或密码错误',
        data: null,
      });
    }

    const expiresIn = this.configService.get<number>('JWT_EXPIRES_IN_MERCHANT', 86400);

    const payload: JwtPayload = {
      sub: username,
      role: 'merchant',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      expires_in: expiresIn,
      role: 'merchant' as const,
      username,
    };
  }

  /**
   * 刷新 Token
   *
   * 用未过期的 Token 换取新 Token。
   */
  async refreshToken(user: JwtPayload): Promise<{
    token: string;
    expires_in: number;
  }> {
    const expiresIn = user.role === 'merchant'
      ? this.configService.get<number>('JWT_EXPIRES_IN_MERCHANT', 86400)
      : this.configService.get<number>('JWT_EXPIRES_IN_CUSTOMER', 604800);

    const payload: JwtPayload = {
      sub: user.sub,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn,
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      expires_in: expiresIn,
    };
  }

  /**
   * 用微信 code 换取 openid
   *
   * V1 简化方案：开发环境直接返回 mock openid。
   * 生产环境需要调用微信接口。
   */
  private async getOpenidByCode(code: string): Promise<string> {
    const wechatAppId = this.configService.get<string>('WECHAT_APP_ID');

    if (!wechatAppId || wechatAppId === 'your-wechat-app-id') {
      // 开发环境 mock：直接使用 code 作为 openid
      // 支持特殊 code 用于测试商家登录：
      //   'merchant_test_code' → 匹配数据库中 merchant_accounts.wechat_openid
      console.log(`[Auth] Mock wechat login with code: ${code}`);
      return `wx_mock_${code}`;
    }

    // 生产环境：调用微信接口
    try {
      const response = await fetch(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${wechatAppId}&secret=${this.configService.get<string>('WECHAT_APP_SECRET')}&js_code=${code}&grant_type=authorization_code`,
      );
      const data = await response.json() as any;
      if (data.errcode) {
        throw new UnauthorizedException({
          code: 10003,
          message: `微信登录失败: ${data.errmsg}`,
          data: null,
        });
      }
      return data.openid;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error('[Auth] Wechat API error:', error);
      throw new UnauthorizedException({
        code: 10003,
        message: '微信登录服务异常',
        data: null,
      });
    }
  }
}
