// 유틸리티 함수 모음
// 프로젝트 전체에서 사용되는 유틸리티 함수들을 정의합니다

/**
 * 날짜 포맷팅 함수
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ko-KR');
};

/**
 * 숫자 포맷팅 함수 (천 단위 구분)
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ko-KR');
};

