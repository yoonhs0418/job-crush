// 지원 현황 기능 관련 타입 정의
export interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  appliedAt: string;
}

