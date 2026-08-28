// 인증 기능 API
// 전역 API 클라이언트와 엔드포인트 상수를 사용하여 API 호출을 정의합니다

import { apiClient } from '@/api/client';
import { API_ENDPOINTS } from '@/constants/api';
import type { LoginCredentials, AuthResponse, User } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // ✅ 베이스 URL은 apiClient에서 자동으로 추가됨
    // ✅ 실제 호출: http://localhost:3000/auth/login
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  register: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, credentials);
    return response.data;
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>(API_ENDPOINTS.AUTH.ME);
    return response.data;
  },
};

