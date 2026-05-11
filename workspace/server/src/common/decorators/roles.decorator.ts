import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles() 装饰器
 * 标记接口需要的角色列表
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
