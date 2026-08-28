// JWT 설정 파일
// JWT 인증 관련 설정을 관리합니다

export const jwtConfig = () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
});

