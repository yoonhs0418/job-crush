// 자소서 분석 기록/통계 조회 API
// 전역 API 클라이언트와 엔드포인트 상수를 사용합니다

import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/constants/api';

export interface AnalysisListItem {
  id: number;
  companyName: string;
  jobRole: string;
  resumeTitle: string;
  totalScore: number;
  createdAt: string;
}

export interface DashboardStats {
  totalAnalyses: number;
  averageScore: number;
  thisMonthAnalyses: number;
  interviewCount: number;
}

export interface AnalysisFeedbackItem {
  type: 'good' | 'bad' | 'suggestion';
  title: string;
  content: string;
}

export interface AnalysisDetailItem {
  id: number;
  question: string;
  answer: string;
  score: number;
  feedbacks: AnalysisFeedbackItem[];
}

export interface AnalysisDetail {
  companyName: string;
  jobRole: string;
  totalScore: number;
  summary: string;
  items: AnalysisDetailItem[];
  analysisResultId?: number;
  resumeId?: number;
  companyId?: number;
}

export const analysisApi = {
  list: async (): Promise<AnalysisListItem[]> => {
    const response = await apiClient.get<AnalysisListItem[]>(
      API_ENDPOINTS.ANALYSIS.LIST,
    );
    return response.data;
  },

  getById: async (id: number): Promise<AnalysisDetail> => {
    const response = await apiClient.get<AnalysisDetail>(
      API_ENDPOINTS.ANALYSIS.BY_ID(id),
    );
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>(
      API_ENDPOINTS.ANALYSIS.STATS,
    );
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.ANALYSIS.BY_ID(id));
  },
};
