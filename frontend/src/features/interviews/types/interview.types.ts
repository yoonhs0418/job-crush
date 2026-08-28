export type InterviewSessionStatus =
  | 'pending'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type InterviewQuestionType = 'initial' | 'follow_up' | 'behavioral' | 'technical';

export interface InterviewSession {
  id: string;
  userId?: string;
  jobId?: string;
  companyName: string;
  jobTitle: string;
  status: InterviewSessionStatus;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** GET /interviews/sessions/:id 응답에 포함 */
  questions?: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string;
  sessionId: string;
  order: number;
  text: string;
  type: InterviewQuestionType;
  createdAt: string;
}

export interface InterviewAnswer {
  id: string;
  sessionId: string;
  questionId: string;
  transcript: string;
  audioUrl?: string;
  durationMs?: number;
  createdAt: string;
}

export interface InterviewEvaluationMetric {
  name: string;
  score: number; // 0~100
  comment?: string;
}

export interface InterviewHeartRate {
  bpm: number | null;
  confidence: number;
}

export interface InterviewTimelineItem {
  id: string;
  question: string;
  score: number;
  feedback: string;
}

export interface InterviewEvaluation {
  sessionId: string;
  overallScore: number;
  contentScore: number;
  deliveryScore: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  metrics: InterviewEvaluationMetric[];
  heartRate?: InterviewHeartRate | null;
  timeline?: InterviewTimelineItem[];
  createdAt: string;
}

/** 질문별 분석 진행 단계 (결과 페이지 체크리스트) */
export interface InterviewProgressQuestion {
  id: string;
  order: number;
  type: 'initial' | 'follow_up';
  text: string;
  answered: boolean; // STT(답변 텍스트) 완료
  mediaAnalyzed: boolean; // 표정/음성/심박 분석 완료
  mediaStatus: 'idle' | 'pending' | 'done' | 'failed';
}

export interface InterviewProgress {
  status: string;
  evaluated: boolean;
  questions: InterviewProgressQuestion[];
}

/** GET /interviews/sessions/:id/evaluation 응답 (결과 페이지 폴링) */
export interface InterviewEvaluationResponse {
  status: string; // PENDING | IN_PROGRESS | PROCESSING | COMPLETED | FAILED
  progress?: InterviewProgress;
  evaluation: InterviewEvaluation | null;
}

/** GET /interviews 목록 항목 (분석기록 → 면접 기록) */
export interface InterviewListItem {
  id: string;
  companyName: string;
  jobTitle: string;
  status: string;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

/** 다음 질문(서버 턴 처리) */
export interface NextInterviewQuestion {
  id: string;
  order: number;
  text: string;
  type: InterviewQuestionType;
}

/** POST /interviews/sessions/:id/answer 응답 */
export interface SubmitAnswerResponse {
  transcript: string;
  nextQuestion: NextInterviewQuestion | null;
}

export interface CreateInterviewSessionPayload {
  jobId?: string;
  companyName: string;
  jobTitle: string;
  resumeId?: string;
  notes?: string;
}

