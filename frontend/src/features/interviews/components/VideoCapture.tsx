import { useEffect, useRef } from 'react';

type VideoCaptureProps = {
  stream: MediaStream | null;
  mirror?: boolean;
  placeholder?: React.ReactNode;
};

const VideoCapture = ({ stream, mirror = true, placeholder }: VideoCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      videoElement.srcObject = stream;
      const playSafe = async () => {
        try {
          await videoElement.play();
        } catch {
          // autoplay might be blocked; ignore
        }
      };
      playSafe();
    } else {
      videoElement.srcObject = null;
    }
  }, [stream]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-stroke bg-black dark:border-strokedark">
      <video
        ref={videoRef}
        className={`h-full w-full object-cover ${mirror ? 'scale-x-[-1]' : ''}`}
        muted
        playsInline
      />
      {!stream && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
          {placeholder ?? '카메라 접근 권한을 허용해주세요.'}
        </div>
      )}
    </div>
  );
};

export default VideoCapture;

