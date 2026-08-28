import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateInterviewFromAnalysisDto } from './dto/create-interview-from-analysis.dto';
import type { MulterFile } from '../analysis/analysis.controller';

@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async getSession(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.interviewsService.getSessionByIdForUser(userId, id);
  }

  @Post('from-analysis')
  @UseGuards(JwtAuthGuard)
  async createFromAnalysis(
    @CurrentUser('sub') userId: number,
    @Body() dto: CreateInterviewFromAnalysisDto,
  ) {
    return this.interviewsService.createFromAnalysis(
      userId,
      dto.analysisResultId,
    );
  }

  /** 사용자의 면접 목록 (분석기록 → 면접 기록) */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listInterviews(@CurrentUser('sub') userId: number) {
    return this.interviewsService.listForUser(userId);
  }

  /** 면접 기록 삭제 (평가/질문 포함) */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteInterview(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.interviewsService.deleteForUser(userId, id);
  }

  /** 턴 처리: 답변 영상(+오디오) 세그먼트 업로드 → STT + 다음 질문 반환 */
  @Post('sessions/:id/answer')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('media', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 답변 세그먼트(영상+오디오) 최대 100MB
      fileFilter: (_req, file, cb) => {
        const mime = (file.mimetype ?? '').toLowerCase();
        const name = (file.originalname ?? '').toLowerCase();
        const allowedMime =
          /^(audio|video)\//.test(mime) || mime === 'application/octet-stream';
        const allowedExt = /\.(webm|mp4|wav|m4a|ogg|mp3)$/.test(name);
        // Chrome/FormData가 octet-stream·빈 mimetype으로 보내는 경우가 있어 확장자도 허용
        cb(null, allowedMime || allowedExt || mime === '');
      },
    }),
  )
  async submitAnswer(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: MulterFile,
    @Body('questionId', ParseIntPipe) questionId: number,
  ) {
    if (!file) {
      throw new BadRequestException(
        '답변 미디어가 업로드되지 않았습니다. (필드명 media, webm/mp4 등)',
      );
    }
    const buffer = file.buffer;
    if (!buffer?.length) {
      throw new BadRequestException(
        '답변 미디어를 읽지 못했습니다. 녹화가 비어 있지 않은지 확인해 주세요.',
      );
    }
    return this.interviewsService.submitAnswer(
      userId,
      id,
      questionId,
      buffer,
      file.originalname || 'answer.webm',
    );
  }

  /** 세션 종료: 답변별 지표를 집계해 종합 평가를 비동기로 시작 (영상 업로드 없음) */
  @Post('sessions/:id/finalize')
  @UseGuards(JwtAuthGuard)
  async finalizeSession(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.interviewsService.finalizeSession(userId, id);
  }

  /** 결과 페이지 폴링: 종합 평가 조회 (분석 중이면 evaluation=null) */
  @Get('sessions/:id/evaluation')
  @UseGuards(JwtAuthGuard)
  async getEvaluation(
    @CurrentUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.interviewsService.getEvaluationForUser(userId, id);
  }
}
