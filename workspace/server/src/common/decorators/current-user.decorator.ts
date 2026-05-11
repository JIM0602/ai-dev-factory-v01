import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  sub: string;
  role: 'customer' | 'merchant';
  iat: number;
  exp: number;
}

/**
 * @CurrentUser() 参数装饰器
 * 从 request.user 中提取 JWT payload
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as JwtPayload;
  },
);
