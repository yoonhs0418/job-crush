// 애플리케이션 기본 설정 파일
// 앱 전역 설정을 관리합니다

export const appConfig = () => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
});

