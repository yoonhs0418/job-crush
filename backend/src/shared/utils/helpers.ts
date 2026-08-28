// 공통 유틸리티 함수
// 애플리케이션 전역에서 사용되는 유틸리티 함수를 정의합니다

/**
 * 페이지네이션 계산
 */
export function calculatePagination(page: number, limit: number) {
  const skip = (page - 1) * limit;
  const take = limit;
  return { skip, take };
}

/**
 * 페이지네이션 메타데이터 생성
 */
export function createPaginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
  };
}

