import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() 装饰器
 * 标记接口无需认证即可访问
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
