// API 관련 타입 정의
// API 엔드포인트와 관련된 타입들을 정의합니다

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

