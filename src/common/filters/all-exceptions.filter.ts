import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodError, ZodIssue } from 'zod';
import { logger } from '../../utils/logger';

const formatZodIssue = (issue: ZodIssue) => ({
  path: issue.path,
  message: issue.message,
  code: issue.code,
  expected: 'expected' in issue ? issue.expected : undefined,
  received: 'received' in issue ? issue.received : undefined,
});

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ZodError) {
      const issues = exception.issues.map(formatZodIssue);
      logger.info('Validation failed', { issues });
      return response.status(HttpStatus.BAD_REQUEST).json({
        code: HttpStatus.BAD_REQUEST,
        message: '요청 데이터 형식이 올바르지 않습니다.',
        data: { errors: issues },
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string'
          ? res
          : typeof res === 'object' && 'message' in res
            ? (res as Record<string, any>).message || exception.message
            : exception.message;

      const data = typeof res === 'object' && res && 'data' in res ? (res as any).data : [];

      if (status >= 500) {
        logger.error('Unhandled exception', { message, stack: exception.stack });
      } else {
        logger.info('Handled error response', { status, message });
      }

      return response.status(status).json({
        code: status,
        data,
        message,
      });
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message = (exception as Error)?.message || 'Internal Server Error';
    logger.error('Unhandled exception', { message, stack: (exception as Error)?.stack });

    return response.status(status).json({
      code: status,
      data: [],
      message,
    });
  }
}
