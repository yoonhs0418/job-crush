// 채용 정보 기능 API
// 전역 API 클라이언트와 엔드포인트 상수를 사용하여 API 호출을 정의합니다

import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import type { Job, JobFilter } from '../types/job.types';

export const jobApi = {
  getJobs: async (filter?: JobFilter): Promise<Job[]> => {
    // ✅ 베이스 URL은 apiClient에서 자동으로 추가됨
    // ✅ 실제 호출: http://localhost:3000/jobs?keyword=...
    const response = await apiClient.get<Job[]>(API_ENDPOINTS.JOBS.BASE, {
      params: filter,
    });
    return response.data;
  },

  getJobById: async (id: string): Promise<Job> => {
    // ✅ 실제 호출: http://localhost:3000/jobs/123
    const response = await apiClient.get<Job>(API_ENDPOINTS.JOBS.BY_ID(id));
    return response.data;
  },

  searchJobs: async (keyword: string): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>(API_ENDPOINTS.JOBS.SEARCH, {
      params: { keyword },
    });
    return response.data;
  },

  applyJob: async (jobId: string): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.JOBS.APPLY(jobId));
  },
};

