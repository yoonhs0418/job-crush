// 인증 모듈
// 사용자 인증 및 권한 관리를 담당합니다

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { JwtModuleOptions } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret:
          config.get<string>('JWT_SECRET') ??
          process.env.JWT_SECRET ??
          'your-secret-key',
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ??
            process.env.JWT_EXPIRES_IN ??
            '1d') as SignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
