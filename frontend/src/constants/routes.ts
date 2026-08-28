// 라우트 경로 상수 정의
// 라우트 경로를 문자열로 직접 사용하는 것을 방지하고 중앙에서 관리합니다

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  JOBS: '/jobs',
  JOB_DETAIL: (id: string | number) => `/jobs/${id}`,
  PROFILE: '/profile',
  APPLICATIONS: '/applications',
  INTERVIEWS: {
    SETUP: '/interviews/setup',
    SESSION: (sessionId: string | number) => `/interviews/session/${sessionId}`,
    RESULT: (sessionId: string | number) => `/interviews/result/${sessionId}`,
  },
} as const;

