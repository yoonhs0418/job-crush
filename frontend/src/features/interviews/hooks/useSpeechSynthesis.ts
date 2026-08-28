import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

/**
 * 브라우저 Web Speech API(SpeechSynthesis) 기반 질문 음성 출력(TTS) 훅.
 * 분석이 아닌 "출력 전용"이므로 클라이언트에서 처리한다(서버 분석 원칙과 무관).
 */
export const useSpeechSynthesis = () => {
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!supported || !text.trim()) return;
      // 진행 중인 발화가 있으면 취소하고 새 발화 시작
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang ?? 'ko-KR';
      utterance.rate = options?.rate ?? 1;
      utterance.pitch = options?.pitch ?? 1;
      utterance.volume = options?.volume ?? 1;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported],
  );

  useEffect(() => {
    return () => {
      if (supported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  return { speak, cancel, speaking, supported };
};
