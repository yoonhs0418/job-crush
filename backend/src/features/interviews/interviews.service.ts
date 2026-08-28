// POST /interviews/from-analysis, GET /interviews/sessions/:id
// 분석 결과(회원 소유)를 기준으로 면접 세션·질문을 생성·조회합니다.
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import {
  MlService,
  VideoAnalysisResult,
  FaceMetricsResult,
  VoiceMetricsResult,
  HeartRateResult,
} from '../../shared/ml/ml.service';

/** 답변 제출 응답: STT 결과 + 다음 질문(없으면 null) */
export type SubmitAnswerResult = {
  transcript: string;
  nextQuestion: {
    id: string;
    order: number;
    text: string;
    type: 'initial' | 'follow_up' | 'behavioral' | 'technical';
  } | null;
};

/** 분석 단계별 진행 상황 (결과 페이지 체크리스트용) */
export type InterviewProgress = {
  status: string;
  evaluated: boolean;
  questions: Array<{
    id: string;
    order: number;
    type: 'initial' | 'follow_up';
    text: string;
    answered: boolean; // STT(답변 텍스트) 완료
    mediaAnalyzed: boolean; // 표정/음성/심박 분석 완료
    mediaStatus: 'idle' | 'pending' | 'done' | 'failed';
  }>;
};

/** 면접 평가 조회 응답 (결과 페이지 폴링용) */
export type InterviewEvaluationResult = {
  status: string; // PENDING | IN_PROGRESS | PROCESSING | COMPLETED | FAILED
  progress: InterviewProgress;
  evaluation: {
    sessionId: string;
    overallScore: number;
    contentScore: number;
    deliveryScore: number;
    confidenceScore: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    metrics: Array<{ name: string; score: number; comment?: string }>;
    heartRate?: { bpm: number | null; confidence: number } | null;
    timeline: Array<{ id: string; question: string; score: number; feedback: string }>;
    createdAt: string;
  } | null;
};

/** 면접 목록 항목 (분석기록 → 면접 기록) */
export type InterviewListItem = {
  id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
};

/** 프론트 Session + 질문 목록에 맞춘 조회 응답 (스네이크 미사용, ISO 문자열) */
export type InterviewSessionDetail = {
  id: string;
  userId: string;
  companyName: string;
  jobTitle: string;
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  questions: Array<{
    id: string;
    sessionId: string;
    order: number;
    text: string;
    type: 'initial' | 'follow_up' | 'behavioral' | 'technical';
    createdAt: string;
  }>;
};

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analysisService: AnalysisService,
    private readonly mlService: MlService,
  ) {}

  /**
   * 본인 analysis에 매달린 면접만 조회 (다른 사용자 세션은 동일하게 NotFound 처리).
   */
  async getSessionByIdForUser(
    userId: number,
    interviewId: number,
  ): Promise<InterviewSessionDetail> {
    const row = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        analysis: { userId },
      },
      include: {
        interviewQuestions: { orderBy: { id: 'asc' } },
        analysis: { include: { company: true } },
      },
    });

    if (!row) {
      throw new NotFoundException('면접 세션을 찾을 수 없습니다.');
    }

    const company = row.analysis.company;
    const jobTitle =
      company.jobDescription.split(/\r?\n/).find((l) => l.trim().length > 0)?.trim().slice(0, 200) ??
      '채용 공고';

    const statusMap: Record<
      string,
      InterviewSessionDetail['status']
    > = {
      PENDING: 'pending',
      IN_PROGRESS: 'in_progress',
      PAUSED: 'paused',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    };
    const normalized = row.status.toUpperCase();
    const status = statusMap[normalized] ?? 'pending';

    const createdAt = row.createdAt.toISOString();
    const startedAt = row.startedAt?.toISOString();
    const completedAt = row.completedAt?.toISOString();
    // 가짜 updatedAt 제거: 실제 진행 타임스탬프가 있으면 최신값, 없으면 생성 시각
    const updatedAt = completedAt ?? startedAt ?? createdAt;

    const allowedQuestionTypes = [
      'initial',
      'follow_up',
      'behavioral',
      'technical',
    ] as const;
    type AllowedQuestionType = (typeof allowedQuestionTypes)[number];
    const normalizeQuestionType = (value: string): AllowedQuestionType =>
      (allowedQuestionTypes as readonly string[]).includes(value)
        ? (value as AllowedQuestionType)
        : 'initial';

    return {
      id: String(row.id),
      userId: String(userId),
      companyName: company.companyName,
      jobTitle,
      status,
      startedAt,
      completedAt,
      createdAt,
      updatedAt,
      questions: row.interviewQuestions.map((q, index) => ({
        id: String(q.id),
        sessionId: String(row.id),
        order: q.orderIndex > 0 ? q.orderIndex : index + 1,
        text: q.questionText,
        type: normalizeQuestionType(q.type),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async createFromAnalysis(userId: number, analysisResultId: number) {
    const ar = await this.prisma.analysisResult.findFirst({
      where: { id: analysisResultId, userId },
      include: { resume: true, company: true },
    });
    if (!ar) {
      throw new NotFoundException('분석 결과를 찾을 수 없습니다.');
    }

    const oa = ar.overallAssessment as { summary?: string } | null;
    const summary =
      typeof oa === 'object' && oa !== null && typeof oa.summary === 'string'
        ? oa.summary
        : '';

    const questions =
      await this.analysisService.generateInterviewQuestionsFromContext({
        companyName: ar.company.companyName,
        jobDescription: ar.company.jobDescription,
        resumeExcerpt: ar.resume.contentText,
        assessmentSummary: summary || '요약 없음',
      });

    return this.prisma.$transaction(async (tx) => {
      const interview = await tx.interview.create({
        data: {
          analysisId: ar.id,
          status: 'PENDING',
        },
      });
      await tx.interviewQuestion.createMany({
        data: questions.map((questionText, index) => ({
          interviewId: interview.id,
          questionText,
          orderIndex: index + 1,
          type: 'initial',
        })),
      });
      return tx.interview.findUniqueOrThrow({
        where: { id: interview.id },
        include: {
          interviewQuestions: { orderBy: { id: 'asc' } },
          analysis: {
            include: { company: true, resume: true },
          },
        },
      });
    });
  }

  /** 본인 소유 면접을 질문/분석 정보와 함께 로드 (없으면 NotFound). */
  private async getOwnedInterviewOrThrow(userId: number, interviewId: number) {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, analysis: { userId } },
      include: {
        interviewQuestions: { orderBy: { id: 'asc' } },
        analysis: { include: { company: true, resume: true } },
      },
    });
    if (!interview) {
      throw new NotFoundException('면접 세션을 찾을 수 없습니다.');
    }
    return interview;
  }

  /**
   * 턴 처리: 답변 오디오 → STT → 답변 저장 → (필요 시)꼬리질문 생성 → 다음 질문 반환.
   */
  async submitAnswer(
    userId: number,
    interviewId: number,
    questionId: number,
    media: Buffer,
    filename: string,
  ): Promise<SubmitAnswerResult> {
    const interview = await this.getOwnedInterviewOrThrow(userId, interviewId);
    const question = interview.interviewQuestions.find(
      (q) => q.id === questionId,
    );
    if (!question) {
      throw new NotFoundException('해당 질문을 찾을 수 없습니다.');
    }

    // 답변 세그먼트(영상+오디오)에서 STT를 먼저 받아 꼬리질문 판단에 사용한다.
    const stt = await this.mlService.transcribe(media, filename);
    const transcript = stt.transcript ?? '';

    await this.prisma.interviewQuestion.update({
      where: { id: question.id },
      data: { answerText: transcript, transcript },
    });

    // 표정/음성/심박 분석은 다음 질문 진행을 막지 않도록 백그라운드로 돌린다.
    void this.analyzeAnswerMedia(question.id, media, filename);

    // 첫 답변이면 세션 진행 상태 기록
    if (!interview.startedAt) {
      await this.prisma.interview.update({
        where: { id: interview.id },
        data: { startedAt: new Date(), status: 'IN_PROGRESS' },
      });
    }

    const company = interview.analysis.company;

    // 꼬리질문은 질문당 1회로 제한 (이미 자식이 있으면 생성하지 않음)
    const existingFollowUps = interview.interviewQuestions.filter(
      (q) => q.parentId === question.id,
    ).length;

    if (existingFollowUps === 0) {
      const followUp = await this.analysisService.generateFollowUpQuestion({
        companyName: company.companyName,
        jobDescription: company.jobDescription,
        previousQuestion: question.questionText,
        answerTranscript: transcript,
      });
      if (followUp) {
        const maxOrder = interview.interviewQuestions.reduce(
          (max, q) => Math.max(max, q.orderIndex),
          0,
        );
        const created = await this.prisma.interviewQuestion.create({
          data: {
            interviewId: interview.id,
            parentId: question.id,
            questionText: followUp,
            orderIndex: maxOrder + 1,
            type: 'follow_up',
          },
        });
        return {
          transcript,
          nextQuestion: {
            id: String(created.id),
            order: created.orderIndex,
            text: created.questionText,
            type: 'follow_up',
          },
        };
      }
    }

    // 다음 미응답 질문(현재 질문 이후) 반환
    const next = interview.interviewQuestions
      .filter((q) => q.id !== question.id && !q.answerText)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .find((q) => q.orderIndex > question.orderIndex);

    return {
      transcript,
      nextQuestion: next
        ? {
            id: String(next.id),
            order: next.orderIndex,
            text: next.questionText,
            type: next.type === 'follow_up' ? 'follow_up' : 'initial',
          }
        : null,
    };
  }

  /** 답변별 영상 세그먼트의 표정/음성/심박 분석 → 질문 mediaMetrics 저장 (백그라운드). */
  private async analyzeAnswerMedia(
    questionId: number,
    media: Buffer,
    filename: string,
  ): Promise<void> {
    try {
      const analysis = await this.mlService.analyzeVideo(media, filename);
      const metrics = {
        status: 'done',
        face: analysis.face,
        voice: analysis.voice ?? null,
        heartRate: analysis.heartRate,
      } as unknown as Prisma.InputJsonValue;
      await this.prisma.interviewQuestion.update({
        where: { id: questionId },
        data: { mediaMetrics: metrics },
      });
    } catch (error) {
      this.logger.warn(
        `답변 영상 분석 실패 (question ${questionId}): ${String(error)}`,
      );
      await this.prisma.interviewQuestion
        .update({
          where: { id: questionId },
          data: {
            mediaMetrics: { status: 'failed' } as unknown as Prisma.InputJsonValue,
          },
        })
        .catch(() => undefined);
    }
  }

  /**
   * 세션 종료(집계): 답변별로 이미 분석된 지표를 모아 Gemini 종합 평가를 만든다.
   * 통영상 분석을 하지 않으므로 빠르고, 즉시 PROCESSING을 반환한다.
   */
  async finalizeSession(
    userId: number,
    interviewId: number,
  ): Promise<{ status: string }> {
    const interview = await this.getOwnedInterviewOrThrow(userId, interviewId);

    await this.prisma.interview.update({
      where: { id: interview.id },
      data: { status: 'PROCESSING', completedAt: new Date() },
    });

    void this.runAggregateEvaluation(interview.id);

    return { status: 'PROCESSING' };
  }

  /** 진행 중인 답변별 영상 분석이 끝날 때까지(또는 타임아웃까지) 대기. */
  private async waitForPendingMedia(
    interviewId: number,
    maxWaitMs: number,
  ): Promise<void> {
    const start = Date.now();
    const intervalMs = 3000;
    while (Date.now() - start < maxWaitMs) {
      const qs = await this.prisma.interviewQuestion.findMany({
        where: { interviewId },
        select: { answerText: true, mediaMetrics: true },
      });
      const pending = qs.filter(
        (q) =>
          (q.answerText ?? '').trim().length > 0 && q.mediaMetrics == null,
      );
      if (pending.length === 0) return;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  /** 답변별 mediaMetrics(done)들을 하나의 비언어 지표로 평균/집계. */
  private aggregateMediaMetrics(
    questions: Array<{ mediaMetrics: Prisma.JsonValue | null }>,
  ): VideoAnalysisResult | null {
    type Done = {
      status?: string;
      face?: FaceMetricsResult;
      voice?: VoiceMetricsResult | null;
      heartRate?: HeartRateResult;
    };
    const done = questions
      .map((q) => q.mediaMetrics as Done | null)
      .filter(
        (m): m is Done =>
          !!m && typeof m === 'object' && m.status === 'done' && !!m.face,
      );
    if (done.length === 0) return null;

    const avg = (arr: number[]): number =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const faces = done.map((d) => d.face as FaceMetricsResult);
    const expressionCounts: Record<string, number> = {};
    const mergedDist: Record<string, number[]> = {};
    for (const f of faces) {
      if (f.dominantExpression) {
        expressionCounts[f.dominantExpression] =
          (expressionCounts[f.dominantExpression] ?? 0) + 1;
      }
      for (const [k, v] of Object.entries(f.expressionDistribution ?? {})) {
        (mergedDist[k] ??= []).push(typeof v === 'number' ? v : 0);
      }
    }
    const dominantExpression =
      Object.entries(expressionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      'neutral';
    const expressionDistribution: Record<string, number> = {};
    for (const [k, vals] of Object.entries(mergedDist)) {
      expressionDistribution[k] = avg(vals);
    }

    const face: FaceMetricsResult = {
      framesAnalyzed: faces.reduce((s, f) => s + (f.framesAnalyzed ?? 0), 0),
      faceDetectionRate: avg(faces.map((f) => f.faceDetectionRate ?? 0)),
      eyeContactScore: avg(faces.map((f) => f.eyeContactScore ?? 0)),
      eyeContactRatio: avg(faces.map((f) => f.eyeContactRatio ?? 0)),
      gazeStability: avg(faces.map((f) => f.gazeStability ?? 0)),
      headStability: avg(faces.map((f) => f.headStability ?? 0)),
      dominantExpression,
      expressionDistribution,
    };

    const voices = done
      .map((d) => d.voice)
      .filter((v): v is VoiceMetricsResult => !!v);
    const voice: VoiceMetricsResult | null = voices.length
      ? {
          pitchMeanHz: avg(voices.map((v) => v.pitchMeanHz ?? 0)),
          pitchStdHz: avg(voices.map((v) => v.pitchStdHz ?? 0)),
          energyMean: avg(voices.map((v) => v.energyMean ?? 0)),
          jitter: avg(voices.map((v) => v.jitter ?? 0)),
          speechRateWpm: avg(
            voices.map((v) => v.speechRateWpm ?? 0),
          ),
          pauseRatio: avg(voices.map((v) => v.pauseRatio ?? 0)),
        }
      : null;

    const hrs = done
      .map((d) => d.heartRate)
      .filter((h): h is HeartRateResult => !!h);
    const bpms = hrs
      .map((h) => h.bpm)
      .filter((b): b is number => typeof b === 'number');
    const heartRate: HeartRateResult = {
      bpm: bpms.length ? avg(bpms) : null,
      confidence: avg(hrs.map((h) => h.confidence ?? 0)),
      samples: hrs.reduce((s, h) => s + (h.samples ?? 0), 0),
    };

    return { face, voice, heartRate };
  }

  /** 답변별 지표 집계 + Gemini 종합 평가 + 저장 (백그라운드). */
  private async runAggregateEvaluation(interviewId: number): Promise<void> {
    try {
      // 백그라운드로 돌던 답변별 영상 분석이 마무리될 시간을 준다.
      await this.waitForPendingMedia(interviewId, 120_000);

      const interview = await this.prisma.interview.findUniqueOrThrow({
        where: { id: interviewId },
        include: {
          interviewQuestions: { orderBy: { orderIndex: 'asc' } },
          analysis: { include: { company: true } },
        },
      });

      const company = interview.analysis.company;
      const orderedQuestions = [...interview.interviewQuestions].sort(
        (a, b) => a.orderIndex - b.orderIndex,
      );
      const qa = orderedQuestions.map((q) => ({
        question: q.questionText,
        answer: (q.answerText ?? '').trim() || '(무응답)',
      }));

      const aggregate = this.aggregateMediaMetrics(
        interview.interviewQuestions,
      );

      const evaluation = await this.analysisService.generateOverallEvaluation({
        companyName: company.companyName,
        jobDescription: company.jobDescription,
        qa,
        nonverbalSummary: aggregate
          ? this.buildNonverbalSummary(aggregate)
          : '비언어(표정/음성/심박) 데이터가 충분히 수집되지 않았습니다.',
      });

      await this.applyPerQuestionReviews(orderedQuestions, evaluation);

      // Prisma Json 입력 타입(InputJsonValue)은 인덱스 시그니처를 요구하므로 캐스팅한다.
      const metricsJson = evaluation.metrics as unknown as Prisma.InputJsonValue;
      const heartRateSummaryJson = (
        aggregate
          ? {
              heartRate: aggregate.heartRate,
              face: aggregate.face,
              voice: aggregate.voice ?? null,
            }
          : { heartRate: { bpm: null, confidence: 0, samples: 0 } }
      ) as unknown as Prisma.InputJsonValue;

      const evaluationData = {
        overallScore: evaluation.overallScore,
        contentScore: evaluation.contentScore,
        deliveryScore: evaluation.deliveryScore,
        confidenceScore: evaluation.confidenceScore,
        strengths: evaluation.strengths as unknown as Prisma.InputJsonValue,
        weaknesses: evaluation.weaknesses as unknown as Prisma.InputJsonValue,
        suggestions: evaluation.suggestions as unknown as Prisma.InputJsonValue,
        metrics: metricsJson,
        heartRateSummary: heartRateSummaryJson,
      };

      await this.prisma.interviewEvaluation.upsert({
        where: { interviewId },
        create: { interviewId, ...evaluationData },
        update: evaluationData,
      });

      await this.prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'COMPLETED' },
      });
    } catch (error) {
      this.logger.error(
        `면접 종합 분석 실패 (interview ${interviewId}): ${String(error)}`,
      );
      await this.prisma.interview
        .update({ where: { id: interviewId }, data: { status: 'FAILED' } })
        .catch(() => undefined);
    }
  }

  /** Gemini 질문별 평가를 DB feedback·mediaMetrics에 반영. */
  private async applyPerQuestionReviews(
    orderedQuestions: Array<{ id: number }>,
    evaluation: {
      perQuestionReviews: Array<{
        questionIndex: number;
        score: number;
        feedback: string;
      }>;
    },
  ): Promise<void> {
    for (const review of evaluation.perQuestionReviews) {
      const q = orderedQuestions[review.questionIndex - 1];
      if (!q) continue;
      const row = await this.prisma.interviewQuestion.findUnique({
        where: { id: q.id },
        select: { mediaMetrics: true },
      });
      const prev =
        row?.mediaMetrics &&
        typeof row.mediaMetrics === 'object' &&
        !Array.isArray(row.mediaMetrics)
          ? (row.mediaMetrics as Record<string, unknown>)
          : {};
      await this.prisma.interviewQuestion.update({
        where: { id: q.id },
        data: {
          feedback: review.feedback,
          mediaMetrics: {
            ...prev,
            evaluationScore: review.score,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }
  }

  /** 비언어 지표를 LLM 평가용 자연어 요약으로 변환. */
  private buildNonverbalSummary(analysis: VideoAnalysisResult): string {
    const { face, voice, heartRate } = analysis;
    const lines = [
      `시선 안정성(정면 응시): ${(face.eyeContactScore * 100).toFixed(0)}점, 정면 응시 비율 ${(face.eyeContactRatio * 100).toFixed(0)}%`,
      `머리 움직임 안정성: ${(face.headStability * 100).toFixed(0)}점, 주요 표정: ${face.dominantExpression}`,
    ];
    if (voice) {
      lines.push(
        `음성 톤: 평균 피치 ${voice.pitchMeanHz.toFixed(0)}Hz, 피치 변동 ${voice.pitchStdHz.toFixed(0)}Hz, 침묵 비율 ${(voice.pauseRatio * 100).toFixed(0)}%`,
      );
    }
    if (heartRate.bpm != null) {
      lines.push(
        `추정 심박: ${heartRate.bpm.toFixed(0)}bpm (신뢰도 ${(heartRate.confidence * 100).toFixed(0)}%)`,
      );
    }
    return lines.join('\n');
  }

  /** 질문별 분석 진행 상황을 단계 체크리스트 형태로 변환. */
  private buildProgress(interview: {
    status: string;
    evaluation: unknown;
    interviewQuestions: Array<{
      id: number;
      orderIndex: number;
      type: string;
      questionText: string;
      answerText: string | null;
      mediaMetrics: Prisma.JsonValue | null;
    }>;
  }): InterviewProgress {
    return {
      status: interview.status,
      evaluated: !!interview.evaluation,
      questions: interview.interviewQuestions.map((q) => {
        const answered = (q.answerText ?? '').trim().length > 0;
        const mm = q.mediaMetrics as { status?: string } | null;
        const rawStatus =
          mm && typeof mm === 'object' && typeof mm.status === 'string'
            ? mm.status
            : null;
        const mediaStatus: 'idle' | 'pending' | 'done' | 'failed' =
          rawStatus === 'done' || rawStatus === 'failed'
            ? rawStatus
            : answered
              ? 'pending'
              : 'idle';
        return {
          id: String(q.id),
          order: q.orderIndex,
          type: q.type === 'follow_up' ? 'follow_up' : 'initial',
          text: q.questionText,
          answered,
          mediaAnalyzed: mediaStatus === 'done',
          mediaStatus,
        };
      }),
    };
  }

  /** 면접 평가 조회 (결과 페이지 폴링). 아직 분석 중이면 evaluation=null. */
  async getEvaluationForUser(
    userId: number,
    interviewId: number,
  ): Promise<InterviewEvaluationResult> {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, analysis: { userId } },
      include: {
        evaluation: true,
        interviewQuestions: { orderBy: { orderIndex: 'asc' } },
      },
    });
    if (!interview) {
      throw new NotFoundException('면접 세션을 찾을 수 없습니다.');
    }

    const progress = this.buildProgress(interview);

    if (!interview.evaluation) {
      return { status: interview.status, progress, evaluation: null };
    }

    const ev = interview.evaluation;
    const asStringArray = (value: unknown): string[] =>
      Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string')
        : [];
    const metrics = Array.isArray(ev.metrics)
      ? (ev.metrics as Array<{ name: string; score: number; comment?: string }>)
      : [];
    const heartRateSummary = ev.heartRateSummary as {
      heartRate?: { bpm: number | null; confidence: number };
    } | null;

    const timeline = [...interview.interviewQuestions]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) => {
        const mm = q.mediaMetrics as { evaluationScore?: number } | null;
        const perQScore =
          typeof mm?.evaluationScore === 'number'
            ? mm.evaluationScore
            : (q.answerText ?? '').trim().length > 0
              ? ev.overallScore
              : 0;
        return {
          id: String(q.id),
          question: q.questionText,
          score: perQScore,
          feedback:
            q.feedback ??
            ((q.answerText ?? '').trim().length > 0
              ? '답변이 기록되었습니다.'
              : '무응답'),
        };
      });

    return {
      status: interview.status,
      progress,
      evaluation: {
        sessionId: String(interview.id),
        overallScore: ev.overallScore,
        contentScore: ev.contentScore,
        deliveryScore: ev.deliveryScore,
        confidenceScore: ev.confidenceScore,
        strengths: asStringArray(ev.strengths),
        weaknesses: asStringArray(ev.weaknesses),
        suggestions: asStringArray(ev.suggestions),
        metrics,
        heartRate: heartRateSummary?.heartRate
          ? {
              bpm: heartRateSummary.heartRate.bpm,
              confidence: heartRateSummary.heartRate.confidence,
            }
          : null,
        timeline,
        createdAt: ev.createdAt.toISOString(),
      },
    };
  }

  /** 본인 면접 삭제 (평가 → 꼬리질문 → 질문 → 면접 순으로 정리). */
  async deleteForUser(
    userId: number,
    interviewId: number,
  ): Promise<{ deleted: true }> {
    const interview = await this.prisma.interview.findFirst({
      where: { id: interviewId, analysis: { userId } },
      select: { id: true },
    });
    if (!interview) {
      throw new NotFoundException('면접 세션을 찾을 수 없습니다.');
    }

    // 자기참조(꼬리질문 parentId)와 FK 제약 때문에 순서대로 삭제한다.
    await this.prisma.$transaction([
      this.prisma.interviewEvaluation.deleteMany({ where: { interviewId } }),
      this.prisma.interviewQuestion.deleteMany({
        where: { interviewId, parentId: { not: null } },
      }),
      this.prisma.interviewQuestion.deleteMany({ where: { interviewId } }),
      this.prisma.interview.delete({ where: { id: interviewId } }),
    ]);

    return { deleted: true };
  }

  /** 사용자의 면접 목록 (분석기록 → 면접 기록 섹션). */
  async listForUser(userId: number): Promise<InterviewListItem[]> {
    const rows = await this.prisma.interview.findMany({
      where: { analysis: { userId } },
      orderBy: { createdAt: 'desc' },
      include: {
        evaluation: { select: { overallScore: true } },
        analysis: { include: { company: true } },
      },
    });

    return rows.map((row) => {
      const company = row.analysis.company;
      const jobTitle =
        company.jobDescription
          .split(/\r?\n/)
          .find((l) => l.trim().length > 0)
          ?.trim()
          .slice(0, 200) ?? '채용 공고';
      return {
        id: String(row.id),
        companyName: company.companyName,
        jobTitle,
        status: row.status,
        overallScore: row.evaluation?.overallScore ?? null,
        createdAt: row.createdAt.toISOString(),
        completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      };
    });
  }
}
