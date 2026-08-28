// 프로필 기능 관련 타입 정의
export interface Profile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  resume?: string;
}

