import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import EvaluationChart from '@/features/interviews/components/EvaluationChart';
import StrengthsWeaknesses from '@/features/interviews/components/StrengthsWeaknesses';
import TimelineView from '@/features/interviews/components/TimelineView';
import { interviewService } from '@/features/interviews/services/interview.service';
import type {
  InterviewEvaluationResponse,
  InterviewProgress,
} from '@/features/interviews/types/interview.types';

const POLL_INTERVAL_MS = 4000;
const PENDING_STATUSES = ['PENDING', 'IN_PROGRESS', 'PROCESSING'];

type StepState = 'done' | 'pending' | 'failed';

/** 단일 단계 표시 행 (✓ / 진행중 스피너 / 실패). */
const StepRow = ({ label, state }: { label: string; state: StepState }) => {
  const icon =
    state === 'done' ? (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-xs font-bold text-success">
        ✓
      </span>
    ) : state === 'failed' ? (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/15 text-xs font-bold text-danger">
        !
      </span>
    ) : (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    );
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="flex w-5 justify-center">{icon}</span>
      <span
        className={`text-sm ${
          state === 'done'
            ? 'text-black dark:text-white'
            : state === 'failed'
              ? 'text-danger'
              : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {label}
      </span>
    </div>
  );
};

/** 질문별 분석 + 종합 평가 진행 체크리스트. */
const ProgressChecklist = ({
  progress,
  evaluated,
}: {
  progress: InterviewProgress | null;
  evaluated: boolean;
}) => {
  if (!progress) return null;
  const answered = progress.questions.filter((q) => q.answered);

  return (
    <div className="w-full max-w-lg rounded-2xl border border-stroke bg-white p-6 text-left shadow-sm dark:border-strokedark dark:bg-boxdark">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
        분석 진행 상황
      </p>
      <div className="flex flex-col divide-y divide-stroke dark:divide-strokedark">
        {answered.length === 0 && (
          <p className="py-2 text-sm text-gray-500">기록된 답변이 없습니다.</p>
        )}
        {answered.map((q) => {
          const mediaState: StepState =
            q.mediaStatus === 'done'
              ? 'done'
              : q.mediaStatus === 'failed'
                ? 'failed'
                : 'pending';
          const label =
            q.type === 'follow_up' ? `꼬리질문 (Q${q.order})` : `질문 ${q.order}`;
          return (
            <div key={q.id} className="py-2">
              <p className="mb-1 truncate text-sm font-medium text-black dark:text-white">
                {label}
              </p>
              <div className="pl-2">
                <StepRow label="답변 텍스트 변환(STT)" state={q.answered ? 'done' : 'pending'} />
                <StepRow label="표정·음성·심박 분석" state={mediaState} />
              </div>
            </div>
          );
        })}
        <div className="py-2">
          <StepRow label="AI 종합 평가" state={evaluated ? 'done' : 'pending'} />
        </div>
      </div>
    </div>
  );
};

const InterviewResultPage = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const title = useMemo(() => sessionId ?? 'session', [sessionId]);

  const [data, setData] = useState<InterviewEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEvaluation = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await interviewService.getEvaluation(sessionId);
      setData(res);
      setError(null);
      // 분석이 끝나지 않았으면 폴링 예약
      const stillProcessing =
        !res.evaluation && PENDING_STATUSES.includes(res.status.toUpperCase());
      if (stillProcessing) {
        timerRef.current = setTimeout(fetchEvaluation, POLL_INTERVAL_MS);
      }
    } catch (err) {
      console.error('면접 평가 조회 실패:', err);
      setError('평가 결과를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchEvaluation();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchEvaluation]);

  const evaluation = data?.evaluation ?? null;
  const status = data?.status?.toUpperCase() ?? '';
  const progress = data?.progress ?? null;
  const isProcessing = !evaluation && PENDING_STATUSES.includes(status);
  const isFailed = status === 'FAILED';

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-16">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Session #{title}</p>
        <h1 className="mt-2 text-3xl font-bold text-black dark:text-white">AI 면접 평가 리포트</h1>
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          면접 진행 동안 수집된 시선, 표정, 음성, 심박 데이터를 기반으로 분석한 결과입니다.
        </p>
      </header>

      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-gray-500">결과를 불러오는 중입니다…</p>
        </div>
      )}

      {!isLoading && error && (
        <p className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center text-sm text-danger">
          {error}
        </p>
      )}

      {!isLoading && !error && isProcessing && (
        <div className="flex flex-col items-center gap-6 py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              AI가 답변과 비언어 데이터를 분석하고 있습니다. 잠시만 기다려 주세요…
            </p>
          </div>
          <ProgressChecklist progress={progress} evaluated={false} />
        </div>
      )}

      {!isLoading && !error && isFailed && (
        <p className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-center text-sm text-danger">
          분석 처리 중 오류가 발생했습니다. 다시 시도해 주세요.
        </p>
      )}

      {!isLoading && !error && evaluation && (
        <>
          <EvaluationChart evaluation={evaluation} />

          {evaluation.heartRate?.bpm != null && (
            <div className="flex items-center justify-between rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">추정 심박 (rPPG)</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  웹캠 영상의 미세한 색 변화로 추정한 심박수입니다.
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-black dark:text-white">
                  {Math.round(evaluation.heartRate.bpm)}
                  <span className="ml-1 text-sm font-normal text-gray-500">bpm</span>
                </p>
                <p className="text-xs text-gray-400">
                  신뢰도 {Math.round(evaluation.heartRate.confidence * 100)}%
                </p>
              </div>
            </div>
          )}

          <StrengthsWeaknesses
            strengths={evaluation.strengths}
            weaknesses={evaluation.weaknesses}
            suggestions={evaluation.suggestions}
          />

          {evaluation.timeline && evaluation.timeline.length > 0 && (
            <TimelineView items={evaluation.timeline} />
          )}
        </>
      )}
    </div>
  );
};

export default InterviewResultPage;
