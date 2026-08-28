import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SttResult {
  transcript: string;
  language: string;
  durationSec: number;
  speechRateWpm?: number | null;
}

export interface FaceMetricsResult {
  framesAnalyzed: number;
  faceDetectionRate: number;
  eyeContactScore: number;
  eyeContactRatio: number;
  gazeStability: number;
  headStability: number;
  dominantExpression: string;
  expressionDistribution: Record<string, number>;
}

export interface VoiceMetricsResult {
  pitchMeanHz: number;
  pitchStdHz: number;
  energyMean: number;
  jitter: number;
  speechRateWpm?: number | null;
  pauseRatio: number;
}

export interface HeartRateResult {
  bpm: number | null;
  confidence: number;
  samples: number;
}

export interface VideoAnalysisResult {
  face: FaceMetricsResult;
  voice?: VoiceMetricsResult | null;
  heartRate: HeartRateResult;
}

/**
 * Python(FastAPI) ML 마이크로서비스 HTTP 클라이언트.
 * 클라이언트가 직접 호출하지 않고, Nest가 단일 진입점으로 위임한다.
 */
@Injectable()
export class MlService {
  private readonly logger = new Logger(MlService.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('ML_SERVICE_URL') ||
      'http://localhost:8000'
    ).replace(/\/$/, '');
  }

  async transcribe(buffer: Buffer, filename: string): Promise<SttResult> {
    const raw = await this.postFile<{
      transcript: string;
      language: string;
      duration_sec: number;
      speech_rate_wpm?: number | null;
    }>('/stt', buffer, filename, 'audio/webm', 120_000);

    return {
      transcript: raw.transcript ?? '',
      language: raw.language ?? 'ko',
      durationSec: raw.duration_sec ?? 0,
      speechRateWpm: raw.speech_rate_wpm ?? null,
    };
  }

  async analyzeVideo(
    buffer: Buffer,
    filename: string,
  ): Promise<VideoAnalysisResult> {
    const raw = await this.postFile<any>(
      '/analyze-video',
      buffer,
      filename,
      'video/webm',
      120_000,
    );

    return {
      face: {
        framesAnalyzed: raw.face?.frames_analyzed ?? 0,
        faceDetectionRate: raw.face?.face_detection_rate ?? 0,
        eyeContactScore: raw.face?.eye_contact_score ?? 0,
        eyeContactRatio: raw.face?.eye_contact_ratio ?? 0,
        gazeStability: raw.face?.gaze_stability ?? 0,
        headStability: raw.face?.head_stability ?? 0,
        dominantExpression: raw.face?.dominant_expression ?? 'neutral',
        expressionDistribution: raw.face?.expression_distribution ?? {},
      },
      voice: raw.voice
        ? {
            pitchMeanHz: raw.voice.pitch_mean_hz ?? 0,
            pitchStdHz: raw.voice.pitch_std_hz ?? 0,
            energyMean: raw.voice.energy_mean ?? 0,
            jitter: raw.voice.jitter ?? 0,
            speechRateWpm: raw.voice.speech_rate_wpm ?? null,
            pauseRatio: raw.voice.pause_ratio ?? 0,
          }
        : null,
      heartRate: {
        bpm: raw.heart_rate?.bpm ?? null,
        confidence: raw.heart_rate?.confidence ?? 0,
        samples: raw.heart_rate?.samples ?? 0,
      },
    };
  }

  private async postFile<T>(
    path: string,
    buffer: Buffer,
    filename: string,
    contentType: string,
    timeoutMs = 120_000,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(buffer)], { type: contentType }),
      filename,
    );

    // ML 분석이 멈춰도 요청이 영원히 매달리지 않도록 타임아웃을 건다.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: form,
        signal: controller.signal,
      });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.error(`ML 서비스 오류 ${response.status}: ${detail}`);
        throw new ServiceUnavailableException(
          'ML 분석 서비스 응답 오류가 발생했습니다.',
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      const aborted =
        error instanceof Error && error.name === 'AbortError';
      this.logger.error(
        `ML 서비스 호출 ${aborted ? '타임아웃' : '실패'}: ${String(error)}`,
      );
      throw new ServiceUnavailableException(
        aborted
          ? `ML 분석 서비스 응답이 ${Math.round(timeoutMs / 1000)}초 내에 오지 않았습니다.`
          : 'ML 분석 서비스에 연결하지 못했습니다.',
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
