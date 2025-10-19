import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '../interfaces/request-context.interface';

export const Context = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();

    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    };
  }
);
