import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import { interviewService } from '../services/interview.service';
import type { CreateInterviewSessionPayload, InterviewSession } from '../types/interview.types';

/** 숫자 id만 백엔드 세션 조회 (preview 등 로컬 모드는 제외) */
export function isFetchableInterviewSessionId(sessionId?: string): boolean {
  return sessionId != null && sessionId !== 'preview' && /^\d+$/.test(sessionId);
}

function messageFromApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const m = (data as { message: unknown }).message;
      if (Array.isArray(m)) return m.map(String).filter(Boolean).join(' ') || err.message || fallback;
      if (typeof m === 'string' && m.length > 0) return m;
    }
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

export const useInterviewSession = (sessionId?: string) => {
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(() => isFetchableInterviewSessionId(sessionId));
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!isFetchableInterviewSessionId(sessionId)) {
      setSession(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await interviewService.getSession(sessionId);
      setSession(response);
    } catch (err) {
      setError(messageFromApiError(err, '세션 정보를 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const createSession = useCallback(async (payload: CreateInterviewSessionPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await interviewService.createSession(payload);
      setSession(response);
      return response;
    } catch (err) {
      setError(messageFromApiError(err, '세션 생성에 실패했습니다.'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    isLoading,
    error,
    refetch: fetchSession,
    createSession,
    setSession,
  };
};

