// API 클라이언트 설정 파일
// 전역 API 베이스 URL과 Axios 인스턴스를 설정합니다
// 모든 API 호출은 이 클라이언트를 통해 이루어지며, 베이스 URL은 환경 변수로 관리됩니다

import axios, { AxiosHeaders } from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/** localStorage 키 — 로그인 성공 시 저장되는 JWT와 요청 인터셉터가 동일하게 사용 */
export const ACCESS_TOKEN_STORAGE_KEY = 'accessToken';

// 전역 API 베이스 URL 설정
// 환경 변수 VITE_API_BASE_URL이 설정되어 있으면 사용하고, 없으면 기본값 사용
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

// Axios 인스턴스 — 기본으로 Content-Type 을 두지 않음(FormData 시 boundary 가 깨지는 것 방지).
// JSON 본문은 Axios 가 객체에 대해 application/json 을 자동 설정합니다.
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

function isAuthLoginOrRegister(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? '';
  return url.includes('/auth/login') || url.includes('/auth/register');
}

// 요청 인터셉터: 저장된 JWT가 있으면 Authorization 헤더 자동 부착
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      const h = config.headers;
      if (h instanceof AxiosHeaders) {
        h.delete('Content-Type');
        h.delete('content-type');
      } else {
        delete (h as Record<string, unknown>)['Content-Type'];
        delete (h as Record<string, unknown>)['content-type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status as number;
      const cfg = error.config as InternalAxiosRequestConfig | undefined;
      const onLoginOrRegister = cfg ? isAuthLoginOrRegister(cfg) : false;

      switch (status) {
        case 401:
          // 로그인/회원가입 요청의 401은 페이지에 에러로 넘기고, 보호 API만 로그아웃 처리
          if (!onLoginOrRegister) {
            localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
            window.location.href = '/login';
          }
          break;
        case 403:
          console.error('권한이 없습니다.');
          break;
        case 404:
          console.error('리소스를 찾을 수 없습니다.');
          break;
        case 500:
          console.error('서버 에러가 발생했습니다.');
          break;
      }
    }
    return Promise.reject(error);
  },
);
