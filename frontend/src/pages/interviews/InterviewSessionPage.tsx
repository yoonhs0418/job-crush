import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import QuestionDisplay from '@/features/interviews/components/QuestionDisplay';
import SessionControls from '@/features/interviews/components/SessionControls';
import VideoCapture from '@/features/interviews/components/VideoCapture';
import { useMediaStream } from '@/features/interviews/hooks/useMediaStream';
import { useMediaRecorder } from '@/features/interviews/hooks/useMediaRecorder';
import { useSpeechSynthesis } from '@/features/interviews/hooks/useSpeechSynthesis';
import { interviewService } from '@/features/interviews/services/interview.service';
import {
  isFetchableInterviewSessionId,
  useInterviewSession,
} from '@/features/interviews/hooks/useInterviewSession';
import type { InterviewQuestion } from '@/features/interviews/types/interview.types';

type ActiveQuestion = Pick<InterviewQuestion, 'id' | 'order' | 'text' | 'type'>;

const InterviewSessionPage = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const fetchable = isFetchableInterviewSessionId(sessionId);
  const { stream, error } = useMediaStream();
  const { session, isLoading, error: sessionError } = useInterviewSession(sessionId);
  const { speak, cancel, supported: ttsSupported } = useSpeechSynthesis();
  const { startAnswer, stopAnswer, isAnswerRecording } =
    useMediaRecorder(stream);

  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [localIndex, setLocalIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<ActiveQuestion | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displaySessionId = useMemo(() => sessionId ?? session?.id ?? 'preview', [session?.id, sessionId]);
  const fallbackQuestion = useMemo<ActiveQuestion>(
    () => ({
      id: 'mock-question-1',
      order: 1,
      text: '최근에 해결한 가장 어려운 문제와 이를 해결하기 위해 취한 접근 방식을 설명해주세요.',
      type: 'initial',
    }),
    [],
  );

  const questions = useMemo<ActiveQuestion[]>(() => {
    if (session?.questions?.length) return session.questions;
    if (!fetchable) return [fallbackQuestion];
    return [];
  }, [fallbackQuestion, fetchable, session?.questions]);

  const totalQuestions = questions.length;
  const activeQuestion = currentQuestion ?? questions[localIndex];
  const currentOrder = activeQuestion?.order ?? localIndex + 1;

  const askQuestion = useCallback(
    (question?: ActiveQuestion) => {
      if (question && ttsSupported) speak(question.text);
    },
    [speak, ttsSupported],
  );

  const handleStart = useCallback(() => {
    const first = questions[0];
    setStatus('running');
    setLocalIndex(0);
    setCurrentQuestion(first);
    startAnswer();
    askQuestion(first);
  }, [askQuestion, questions, startAnswer]);

  /** 서버 턴 처리: 답변 오디오 업로드 → 다음 질문 수신 */
  const advanceViaServer = useCallback(
    async (audio: Blob, question: ActiveQuestion) => {
      if (!sessionId) return false;
      try {
        const res = await interviewService.submitAnswer(sessionId, question.id, audio);
        if (res.nextQuestion) {
          const next: ActiveQuestion = {
            id: res.nextQuestion.id,
            order: res.nextQuestion.order,
            text: res.nextQuestion.text,
            type: res.nextQuestion.type,
          };
          setCurrentQuestion(next);
          startAnswer();
          askQuestion(next);
        } else {
          setStatus('paused');
          setCurrentQuestion(undefined);
        }
        return true;
      } catch (err) {
        console.error('답변 제출 실패:', err);
        return false;
      }
    },
    [askQuestion, sessionId, startAnswer],
  );

  /** 로컬(미리보기) 진행: 다음 프리셋 질문으로 이동 */
  const advanceLocally = useCallback(() => {
    const nextIndex = localIndex + 1;
    if (nextIndex >= totalQuestions) {
      setStatus('paused');
      return;
    }
    setLocalIndex(nextIndex);
    setCurrentQuestion(questions[nextIndex]);
    startAnswer();
    askQuestion(questions[nextIndex]);
  }, [askQuestion, localIndex, questions, startAnswer, totalQuestions]);

  const handleAnswerComplete = useCallback(async () => {
    if (!activeQuestion || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const audio = await stopAnswer();
      const useServer = fetchable && Boolean(sessionId) && /^\d+$/.test(activeQuestion.id);
      if (useServer && audio) {
        const ok = await advanceViaServer(audio, activeQuestion);
        if (!ok) advanceLocally();
      } else {
        advanceLocally();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [activeQuestion, advanceLocally, advanceViaServer, fetchable, isSubmitting, sessionId, stopAnswer]);

  const handlePause = useCallback(() => {
    cancel();
    setStatus('paused');
  }, [cancel]);

  const handleEnd = useCallback(async () => {
    cancel();
    setIsSubmitting(true);
    try {
      const useServer =
        fetchable &&
        Boolean(sessionId) &&
        Boolean(activeQuestion) &&
        /^\d+$/.test(activeQuestion?.id ?? '');
      // 진행 중인 답변이 있으면 마지막 답변을 제출해 분석에 포함시킨다(다음 질문으로 넘기지는 않음).
      if (isAnswerRecording) {
        const media = await stopAnswer();
        if (useServer && media && sessionId && activeQuestion) {
          try {
            await interviewService.submitAnswer(sessionId, activeQuestion.id, media);
          } catch (err) {
            console.error('마지막 답변 제출 실패:', err);
          }
        }
      }
      setStatus('idle');
      setCurrentQuestion(undefined);
      if (fetchable && sessionId) {
        // 답변별 지표 집계 → 비동기 종합 분석 시작 (결과 페이지에서 폴링)
        try {
          await interviewService.finalizeSession(sessionId);
        } catch (err) {
          console.error('세션 종료(집계 시작) 실패:', err);
        }
        navigate(`/interviews/result/${sessionId}`);
      } else {
        navigate('/interviews/setup');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [activeQuestion, cancel, fetchable, isAnswerRecording, navigate, sessionId, stopAnswer]);

  const centerQuestionText = activeQuestion?.text ?? null;
  const showLoadedEmpty = fetchable && !isLoading && !sessionError && session && totalQuestions === 0;

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* 세션 질문: API 연동 시 로딩 / 오류 / 첫 질문 강조 */}
      <section
        className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-stroke bg-white px-6 py-10 text-center shadow-sm dark:border-strokedark dark:bg-boxdark"
        aria-live="polite"
      >
        {fetchable && isLoading && (
          <div className="flex flex-col items-center gap-4">
            <div
              className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
              role="status"
              aria-label="로딩 중"
            />
            <p className="text-sm text-gray-600 dark:text-gray-300">면접 세션과 질문을 불러오는 중입니다…</p>
          </div>
        )}
        {fetchable && !isLoading && sessionError && (
          <p className="max-w-lg text-sm text-danger">{sessionError}</p>
        )}
        {showLoadedEmpty && (
          <p className="text-sm text-gray-600 dark:text-gray-300">이 세션에 등록된 질문이 없습니다.</p>
        )}
        {!isLoading && !sessionError && centerQuestionText && (
          <>
            {session?.companyName && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {session.companyName}
                {session.jobTitle ? ` · ${session.jobTitle}` : ''}
              </p>
            )}
            <p className="max-w-3xl text-lg font-semibold leading-relaxed text-black dark:text-white md:text-xl">
              {centerQuestionText}
            </p>
            {totalQuestions > 0 && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                현재 질문 {currentOrder}
                {activeQuestion?.type === 'follow_up' ? ' · 꼬리질문' : ` / ${totalQuestions}`}
              </p>
            )}
            {!ttsSupported && (
              <p className="mt-2 text-xs text-warning">이 브라우저는 음성 질문(TTS)을 지원하지 않습니다.</p>
            )}
          </>
        )}
      </section>

      <div className="flex flex-col gap-6 lg:flex-row">
        <section className="flex-1 rounded-2xl border border-stroke bg-black/90 p-4 shadow-lg dark:border-strokedark">
          <div className="mb-4 flex items-center justify-between text-white/80">
            <div>
              <p className="text-xs uppercase tracking-wide text-primary">Session</p>
              <h2 className="text-xl font-semibold">세션 #{displaySessionId}</h2>
            </div>
            <button
              type="button"
              onClick={handleEnd}
              className="text-sm text-white/70 underline-offset-4 hover:underline"
            >
              종료
            </button>
          </div>
          <VideoCapture
            stream={stream}
            placeholder={
              <div className="p-4 text-center text-sm text-white/60">
                {error ?? '카메라에 연결하는 중입니다.'}
              </div>
            }
          />
        </section>

        <section className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <header>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">실시간 진행</p>
            <h2 className="text-xl font-bold text-black dark:text-white">AI 면접 컨트롤</h2>
          </header>

          <QuestionDisplay question={activeQuestion} />

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-stroke p-4 text-center dark:border-strokedark">
              <p className="text-xs text-gray-500">녹화 상태</p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {isSubmitting ? '처리 중…' : isAnswerRecording ? '답변 녹음 중' : '대기'}
              </p>
            </div>
            <div className="rounded-lg border border-stroke p-4 text-center dark:border-strokedark">
              <p className="text-xs text-gray-500">질문 번호</p>
              <p className="text-2xl font-bold text-black dark:text-white">
                {totalQuestions > 0 ? currentOrder : '—'}
              </p>
            </div>
          </div>

          {status === 'running' && (
            <button
              type="button"
              onClick={handleAnswerComplete}
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
            >
              {isSubmitting ? '답변 처리 중…' : '답변 완료 · 다음 질문'}
            </button>
          )}

          <SessionControls status={status} onStart={handleStart} onPause={handlePause} onEnd={handleEnd} />
        </section>
      </div>
    </div>
  );
};

export default InterviewSessionPage;
