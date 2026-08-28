import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

// 기능 모듈들
import { AuthModule } from './features/auth/auth.module';
import { AnalysisModule } from './features/analysis/analysis.module';
import { JobsModule } from './features/jobs/jobs.module';
import { ApplicationsModule } from './features/applications/applications.module';
import { UsersModule } from './features/users/users.module';
import { PrismaModule } from './database/prisma.module';
import { InterviewsModule } from './features/interviews/interviews.module';

@Module({
  imports: [
    // 전역 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true, // 모든 모듈에서 ConfigModule을 사용할 수 있게 설정
      envFilePath: ['.env.local', '.env'],
    }),
    // 분석 API 등 @UseGuards(ThrottlerGuard)가 붙은 라우트에만 적용 (전역 가드 아님)
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 5,
      },
    ]),
    PrismaModule,

    // 기능 모듈들
    AuthModule,
    AnalysisModule,
    JobsModule,
    ApplicationsModule,
    UsersModule,
    InterviewsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
