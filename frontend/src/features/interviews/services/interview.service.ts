import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/constants/api';

import type {
  CreateInterviewSessionPayload,
  InterviewEvaluationResponse,
  InterviewListItem,
  InterviewSession,
  SubmitAnswerResponse,
} from '../types/interview.types';

export const interviewService = {
  async createSession(payload: CreateInterviewSessionPayload): Promise<InterviewSession> {
    const response = await apiClient.post<InterviewSession>(API_ENDPOINTS.INTERVIEWS.SESSIONS, payload);
    return response.data;
  },

  /** 백엔드 GET /interviews/sessions/:id — 세션 메타 + questions[] */
  async getSession(sessionId: string): Promise<InterviewSession> {
    const response = await apiClient.get<InterviewSession>(
      API_ENDPOINTS.INTERVIEWS.SESSION_BY_ID(sessionId),
    );
    return response.data;
  },

  /** 턴 처리: 답변 영상(+오디오) 세그먼트 업로드 → STT 결과 + 다음 질문 */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    media: Blob,
  ): Promise<SubmitAnswerResponse> {
    const form = new FormData();
    // Blob type이 비어 있으면 서버 multer가 거절할 수 있어 명시적으로 webm 지정
    const file =
      media.type && media.type.length > 0
        ? media
        : new Blob([media], { type: 'video/webm' });
    form.append('media', file, 'answer.webm');
    form.append('questionId', String(questionId));
    const response = await apiClient.post<SubmitAnswerResponse>(
      API_ENDPOINTS.INTERVIEWS.SESSION_ANSWER(sessionId),
      form,
      { timeout: 120000 }, // STT(로컬 Whisper) + 꼬리질문 생성이 길어질 수 있어 전역 10초 대신 120초 허용
    );
    return response.data;
  },

  /** 세션 종료: 답변별 지표 집계 → 비동기 종합 분석 시작 (영상 업로드 없음) */
  async finalizeSession(sessionId: string): Promise<{ status: string }> {
    const response = await apiClient.post<{ status: string }>(
      API_ENDPOINTS.INTERVIEWS.SESSION_FINALIZE(sessionId),
      {},
      { timeout: 30000 },
    );
    return response.data;
  },

  async getEvaluation(sessionId: string): Promise<InterviewEvaluationResponse> {
    const response = await apiClient.get<InterviewEvaluationResponse>(
      API_ENDPOINTS.INTERVIEWS.SESSION_EVALUATION(sessionId),
    );
    return response.data;
  },

  /** 면접 목록 (분석기록 → 면접 기록) */
  async listSessions(): Promise<InterviewListItem[]> {
    const response = await apiClient.get<InterviewListItem[]>(
      API_ENDPOINTS.INTERVIEWS.LIST,
    );
    return response.data;
  },

  /** 면접 기록 삭제 */
  async deleteSession(sessionId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.INTERVIEWS.BY_ID(sessionId));
  },
};
