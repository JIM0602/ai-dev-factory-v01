import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../decorators/current-user.decorator';

/**
 * 数据归属权守卫
 *
 * 顾客只能访问自己的预约数据。
 * 商家可访问所有数据。
 */
@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) return false;

    // 商家可以访问所有数据
    if (user.role === 'merchant') return true;

    // 顾客只能访问自己的数据
    // 具体校验逻辑在 Service 层通过 openid 比对实现
    return true;
  }
}
