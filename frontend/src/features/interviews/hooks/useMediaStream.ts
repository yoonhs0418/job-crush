import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseMediaStreamOptions {
  audio?: boolean;
  video?: boolean;
}

const DEFAULT_OPTIONS: Required<UseMediaStreamOptions> = {
  audio: true,
  video: true,
};

export const useMediaStream = (options: UseMediaStreamOptions = DEFAULT_OPTIONS) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const optionsRef = useRef({ ...DEFAULT_OPTIONS, ...options });

  const stopTracks = useCallback((targetStream: MediaStream | null) => {
    targetStream?.getTracks().forEach((track) => track.stop());
  }, []);

  const requestStream = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setError('브라우저에서 미디어 장치를 지원하지 않습니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(optionsRef.current);
      setStream((prev) => {
        if (prev && prev.id !== mediaStream.id) {
          stopTracks(prev);
        }
        return mediaStream;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '미디어 장치 접근에 실패했습니다.');
      setStream(null);
    } finally {
      setIsLoading(false);
    }
  }, [stopTracks]);

  useEffect(() => {
    requestStream();
    return () => {
      stopTracks(stream);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restart = useCallback(() => {
    stopTracks(stream);
    requestStream();
  }, [requestStream, stopTracks, stream]);

  return {
    stream,
    isLoading,
    error,
    restart,
    stop: () => stopTracks(stream),
  };
};

