// 인증 서비스
// 인증 관련 비즈니스 로직을 처리합니다

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type AuthUserPayload = {
  id: number;
  email: string;
  name: string;
};

export type AuthTokensResponse = {
  accessToken: string;
  user: AuthUserPayload;
};

@Injectable()
export class AuthService {
  private static readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const hashed = await bcrypt.hash(dto.password, AuthService.BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
      },
    });

    return this.buildTokenResponse(user.id, user.email, user.name);
  }

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return this.buildTokenResponse(user.id, user.email, user.name);
  }

  private buildTokenResponse(
    id: number,
    email: string,
    name: string,
  ): AuthTokensResponse {
    const payload = { sub: id, email };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      user: { id, email, name },
    };
  }
}
