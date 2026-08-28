import { useCallback, useRef, useState } from 'react';

/** 지원되는 mimeType 중 사용 가능한 첫 번째를 고른다(브라우저별 차이 흡수). */
const pickMimeType = (candidates: string[]): string | undefined => {
  if (typeof MediaRecorder === 'undefined') return undefined;
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

const ANSWER_MEDIA_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

/**
 * 면접 녹화 훅 (답변 세그먼트 단위).
 * - "답변 완료" 단위로 영상+오디오를 잘라 서버로 보낸다.
 *   (STT는 오디오 트랙에서, 표정/시선/심박은 영상에서 분석)
 * - 통영상은 더 이상 녹화하지 않는다(질문마다 증분 업로드 방식).
 * 분석은 서버에서 수행하므로, 여기서는 수집(녹화)만 담당한다.
 */
export const useMediaRecorder = (stream: MediaStream | null) => {
  const supported = typeof MediaRecorder !== 'undefined';

  const answerRecorderRef = useRef<MediaRecorder | null>(null);
  const answerChunksRef = useRef<Blob[]>([]);

  const [isAnswerRecording, setIsAnswerRecording] = useState(false);

  const startAnswer = useCallback(() => {
    if (!supported || !stream || answerRecorderRef.current) return;
    // 답변 구간은 영상+오디오 전체 스트림을 녹화한다.
    const mimeType = pickMimeType(ANSWER_MEDIA_TYPES);
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined,
    );
    answerChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) answerChunksRef.current.push(event.data);
    };
    recorder.start(1000); // 1초 단위로 청크 수집
    answerRecorderRef.current = recorder;
    setIsAnswerRecording(true);
  }, [stream, supported]);

  const stopAnswer = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = answerRecorderRef.current;
      if (!recorder) {
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || 'video/webm';
        const blob = answerChunksRef.current.length
          ? new Blob(answerChunksRef.current, { type })
          : null;
        answerRecorderRef.current = null;
        answerChunksRef.current = [];
        setIsAnswerRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return {
    supported,
    isAnswerRecording,
    startAnswer,
    stopAnswer,
  };
};
