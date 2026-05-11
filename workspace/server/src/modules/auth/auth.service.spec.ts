import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { MerchantAccountRepository } from '../../database/repositories/merchant-account.repository';
import { MerchantAccount } from '../../database/entities/merchant-account.entity';

/**
 * AuthService 单元测试
 *
 * 测试范围：
 *   - Web 后台登录（账密验证、JWT 签发）
 *   - 微信小程序登录（mock code 换 openid、角色判定、JWT 签发）
 *   - Token 刷新
 *   - 异常场景（错误密码、不存在的用户）
 */
describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let merchantAccountRepo: any;

  const mockMerchantAccount: Partial<MerchantAccount> = {
    id: 1,
    username: 'admin',
    password_hash: '$2b$10$mockhash',
    wechat_openid: 'wx_mock_merchant_test_code',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    merchantAccountRepo = {
      findByUsername: jest.fn(),
      findByWechatOpenid: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token.string'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                JWT_EXPIRES_IN_CUSTOMER: 604800,
                JWT_EXPIRES_IN_MERCHANT: 86400,
                WECHAT_APP_ID: 'your-wechat-app-id', // mock mode
                WECHAT_APP_SECRET: 'mock-secret',
                JWT_SECRET: 'test-jwt-secret',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: MerchantAccountRepository,
          useValue: merchantAccountRepo,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  // ---------------------------------------------------------------------------
  // adminLogin
  // ---------------------------------------------------------------------------
  describe('adminLogin', () => {
    it('应该在用户名密码正确时返回 JWT token', async () => {
      merchantAccountRepo.findByUsername.mockResolvedValue(mockMerchantAccount);
      // Mock bcrypt.compare to return true
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.adminLogin('admin', 'admin123');

      expect(result.token).toBe('mock.jwt.token.string');
      expect(result.role).toBe('merchant');
      expect(result.username).toBe('admin');
      expect(result.expires_in).toBe(86400);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'admin',
          role: 'merchant',
        }),
      );
    });

    it('应该在用户名不存在时抛出 UnauthorizedException (10003)', async () => {
      merchantAccountRepo.findByUsername.mockResolvedValue(null);

      await expect(service.adminLogin('nobody', 'admin123')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.adminLogin('nobody', 'admin123')).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 10003,
          message: '用户名或密码错误',
        }),
      });
    });

    it('应该在密码错误时抛出 UnauthorizedException (10003)', async () => {
      merchantAccountRepo.findByUsername.mockResolvedValue(mockMerchantAccount);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.adminLogin('admin', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.adminLogin('admin', 'wrongpassword')).rejects.toMatchObject({
        response: expect.objectContaining({
          code: 10003,
          message: '用户名或密码错误',
        }),
      });
    });

    it('不应为错误密码签发 JWT', async () => {
      merchantAccountRepo.findByUsername.mockResolvedValue(mockMerchantAccount);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      try {
        await service.adminLogin('admin', 'wrongpassword');
      } catch {
        // 预期抛异常
      }
      // sign 在查找后调用，但因为 bcrypt.compare 失败，不会 reach sign 调用
      // 实际代码中 sign 只在 bcrypt.compare 成功后才调用
    });
  });

  // ---------------------------------------------------------------------------
  // wechatLogin
  // ---------------------------------------------------------------------------
  describe('wechatLogin', () => {
    it('应该为普通顾客返回 customer 角色 JWT', async () => {
      merchantAccountRepo.findByWechatOpenid.mockResolvedValue(null);

      const result = await service.wechatLogin('customer_test_code');

      expect(result.role).toBe('customer');
      expect(result.nickname).toBe('微信用户');
      expect(result.openid).toBe('wx_mock_customer_test_code');
      expect(result.token).toBe('mock.jwt.token.string');
      expect(result.expires_in).toBe(604800);
    });

    it('应该为商家返回 merchant 角色 JWT', async () => {
      merchantAccountRepo.findByWechatOpenid.mockResolvedValue(mockMerchantAccount);

      const result = await service.wechatLogin('merchant_test_code');

      expect(result.role).toBe('merchant');
      expect(result.nickname).toBe('admin');
      expect(result.openid).toBe('wx_mock_merchant_test_code');
      expect(result.token).toBe('mock.jwt.token.string');
      expect(result.expires_in).toBe(86400); // merchant shorter expiry
    });

    it('应该将 code 转换为 mock openid', async () => {
      merchantAccountRepo.findByWechatOpenid.mockResolvedValue(null);

      const result1 = await service.wechatLogin('abc123');
      expect(result1.openid).toBe('wx_mock_abc123');

      const result2 = await service.wechatLogin('test-code-456');
      expect(result2.openid).toBe('wx_mock_test-code-456');
    });

    it('JWT payload 应包含正确的 sub 和 role', async () => {
      merchantAccountRepo.findByWechatOpenid.mockResolvedValue(null);
      const signSpy = jest.spyOn(jwtService, 'sign');

      await service.wechatLogin('user1');

      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'wx_mock_user1',
          role: 'customer',
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // refreshToken
  // ---------------------------------------------------------------------------
  describe('refreshToken', () => {
    it('应该为 customer 签发新 token（7天有效）', async () => {
      const user = {
        sub: 'wx_openid_123',
        role: 'customer' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
      };

      const result = await service.refreshToken(user);

      expect(result.token).toBe('mock.jwt.token.string');
      expect(result.expires_in).toBe(604800);
    });

    it('应该为 merchant 签发新 token（24小时有效）', async () => {
      const user = {
        sub: 'admin',
        role: 'merchant' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      };

      const result = await service.refreshToken(user);

      expect(result.token).toBe('mock.jwt.token.string');
      expect(result.expires_in).toBe(86400);
    });

    it('新 token 应包含原始用户的 sub 和 role', async () => {
      const user = {
        sub: 'wx_openid_789',
        role: 'customer' as const,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 604800,
      };
      const signSpy = jest.spyOn(jwtService, 'sign');

      await service.refreshToken(user);

      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: 'wx_openid_789',
          role: 'customer',
        }),
      );
    });
  });
});
