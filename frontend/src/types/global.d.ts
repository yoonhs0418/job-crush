// 전역 타입 정의 파일
// 프로젝트 전체에서 사용되는 공통 타입을 정의합니다

// 예시: API 응답 타입
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// 예시: 에러 응답 타입
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

