import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// 全局模块
import { DatabaseModule } from './database/database.module';

// 业务模块
import { AuthModule } from './modules/auth/auth.module';
import { StoreModule } from './modules/store/store.module';
import { ReservationModule } from './modules/reservation/reservation.module';
import { TimerModule } from './modules/timer/timer.module';
import { MemberModule } from './modules/member/member.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MessageModule } from './modules/message/message.module';
import { UploadModule } from './modules/upload/upload.module';

// 全局守卫/过滤器/拦截器
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

// 配置文件
import jwtConfig from './config/jwt.config';
import wechatConfig from './config/wechat.config';

@Module({
  imports: [
    // 全局配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [jwtConfig, wechatConfig],
    }),

    // 静态文件服务（上传的图片）
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
      },
    }),

    // 数据库
    DatabaseModule,

    // 定时任务（需要先于业务模块导入以注册 ScheduleModule）
    SchedulerModule,

    // 业务模块
    AuthModule,
    StoreModule,
    ReservationModule,
    TimerModule,
    MemberModule,
    CouponModule,
    MessageModule,
    UploadModule,
  ],
  providers: [
    // 全局 JWT 认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局角色守卫
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 全局响应拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
