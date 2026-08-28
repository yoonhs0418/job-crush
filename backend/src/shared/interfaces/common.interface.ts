// 공통 인터페이스
// 애플리케이션 전역에서 사용되는 인터페이스를 정의합니다

export interface IBaseService<T> {
  findAll(): Promise<T[]>;
  findOne(id: string): Promise<T>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

