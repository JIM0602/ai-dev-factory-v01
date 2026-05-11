import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface ErrorBody {
  code: number;
  message: string;
  data: null;
}

/**
 * 统一异常过滤器
 *
 * 处理所有异常，返回统一格式 { code, message, data }。
 * 错误码分类参见 api_design.md 2.2 节。
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ErrorBody = {
      code: 50001,
      message: '服务器内部错误',
      data: null,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 如果是 class-validator 抛出的校验错误，提取消息
      if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        if (Array.isArray(resp.message)) {
          body = {
            code: 20002,
            message: resp.message.join('; '),
            data: null,
          };
        } else {
          body = {
            code: 20001,
            message: resp.message || '参数校验失败',
            data: null,
          };
        }
      } else if (typeof exceptionResponse === 'object' && (exceptionResponse as any).code) {
        // 业务层手动抛出的带有自定义 code 的异常
        body = exceptionResponse as ErrorBody;
      } else {
        // 其他 HttpException
        const msg = typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;
        body = {
          code: this.statusToCode(status),
          message: msg,
          data: null,
        };
      }
    } else if (exception instanceof QueryFailedError) {
      // TypeORM 数据库错误
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        code: 50002,
        message: '数据库错误',
        data: null,
      };
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        code: 50001,
        message: exception.message || '服务器内部错误',
        data: null,
      };
    }

    // 生产环境不暴露内部错误详情
    if (process.env.NODE_ENV === 'production' && status === HttpStatus.INTERNAL_SERVER_ERROR) {
      body.message = '服务器内部错误';
    }

    response.status(status).json(body);
  }

  private statusToCode(status: number): number {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return 10001; // 未登录
      case HttpStatus.FORBIDDEN:
        return 10003; // 无权限
      case HttpStatus.NOT_FOUND:
        return 40001; // 资源不存在
      case HttpStatus.CONFLICT:
        return 30002; // 重复操作
      default:
        return 50001; // 服务器错误
    }
  }
}
