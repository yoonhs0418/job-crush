// 공통 커스텀 훅 모음
// 여러 컴포넌트에서 재사용되는 커스텀 훅들을 정의합니다

// 예시: 로컬 스토리지 훅
// import { useState, useEffect } from 'react';
// 
// export const useLocalStorage = <T>(key: string, initialValue: T) => {
//   const [storedValue, setStoredValue] = useState<T>(() => {
//     try {
//       const item = window.localStorage.getItem(key);
//       return item ? JSON.parse(item) : initialValue;
//     } catch (error) {
//       return initialValue;
//     }
//   });
// 
//   const setValue = (value: T | ((val: T) => T)) => {
//     try {
//       const valueToStore = value instanceof Function ? value(storedValue) : value;
//       setStoredValue(valueToStore);
//       window.localStorage.setItem(key, JSON.stringify(valueToStore));
//     } catch (error) {
//       console.error(error);
//     }
//   };
// 
//   return [storedValue, setValue] as const;
// };

