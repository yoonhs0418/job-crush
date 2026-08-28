import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type JwtRequestUser = { sub: number; email?: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: JwtRequestUser }
    >();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('인증이 필요합니다.');
    }
    const token = header.slice(7);
    try {
      const payload = await this.jwtService.verifyAsync<
        JwtRequestUser & { sub: number | string }
      >(token);
      const sub =
        typeof payload.sub === 'number'
          ? payload.sub
          : Number.parseInt(String(payload.sub), 10);
      if (!Number.isInteger(sub) || sub < 1) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }
      request.user = {
        sub,
        email: payload.email,
      };
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
}
