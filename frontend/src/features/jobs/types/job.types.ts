// 채용 정보 기능 관련 타입 정의
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary?: string;
  postedAt: string;
}

export interface JobFilter {
  keyword?: string;
  location?: string;
  salary?: string;
}

