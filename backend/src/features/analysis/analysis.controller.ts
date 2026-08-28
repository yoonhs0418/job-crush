import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Redirect,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnalysisService } from './analysis.service';
import { AnalyzeResumeDto } from './dto/analyze-resume.dto';
import { Buffer } from 'buffer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  /** 대시보드 집계 통계 (총 분석 횟수/평균 점수/이번 달/면접 횟수) */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@CurrentUser('sub') userId: number) {
    return this.analysisService.getDashboardStats(userId);
  }

  /** 사용자의 자소서 분석 기록 목록 (히스토리/대시보드) */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listAnalyses(@CurrentUser('sub') userId: number) {
    return this.analysisService.listForUser(userId);
  }

  /** 저장된 분석 결과 상세 조회 (분석 기록 → 자세히 보기) */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getAnalysisById(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.analysisService.getByIdForUser(userId, id);
  }

  /** 분석 결과 삭제 (연결된 면접도 함께 삭제) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteAnalysis(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.analysisService.deleteForUser(userId, id);
  }

  /**
   * 브라우저가 이 API 주소만 GET으로 연 경우(주소창 등) → 웹 분석 페이지로 보냄.
   * 실제 업로드는 POST multipart + JWT.
   */
  @Get('resume/upload')
  @Redirect(undefined, 302)
  uploadResumeRedirectToWebApp(): { url: string } {
    const firstOrigin =
      process.env.CORS_ORIGIN?.split(',')[0]?.trim() ||
      'http://localhost:5173';
    const base = firstOrigin.replace(/\/$/, '');
    return { url: `${base}/analysis` };
  }

  @Post('resume')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  async analyzeResume(
    @CurrentUser('sub') userId: number,
    @Body() dto: AnalyzeResumeDto,
  ) {
    return this.analysisService.analyzeResumeForUser(
      userId,
      dto.resumeText,
      dto.jobDescription,
      dto.companyName,
      { resumeTitle: dto.resumeTitle },
    );
  }

  @Post('resume/upload')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @UseInterceptors(FileInterceptor('resumeFile'))
  async analyzeResumePdf(
    @CurrentUser('sub') userId: number,
    @UploadedFile() file: MulterFile,
    @Body()
    body: {
      companyName: string;
      jobDescription: string;
      resumeText?: string;
      resumeTitle?: string;
    },
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }
    const text = await this.analysisService.extractTextFromPdf(file.buffer);
    return this.analysisService.analyzeResumeForUser(
      userId,
      text,
      body.jobDescription,
      body.companyName,
      { resumeTitle: body.resumeTitle, pdfUrl: null },
    );
  }
}
