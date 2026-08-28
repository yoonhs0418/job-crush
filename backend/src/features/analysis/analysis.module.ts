import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [ThrottlerModule, AuthModule],
  controllers: [AnalysisController],
  providers: [AnalysisService, JwtAuthGuard],
  exports: [AnalysisService],
})
export class AnalysisModule {}
