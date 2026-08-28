import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtRequestUser } from '../guards/jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (key: keyof JwtRequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtRequestUser }>();
    const user = request.user;
    if (!user) {
      return undefined;
    }
    return key ? user[key] : user;
  },
);
