type SessionControlsProps = {
  status: 'idle' | 'running' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onEnd: () => void;
};

const SessionControls = ({ status, onStart, onPause, onEnd }: SessionControlsProps) => {
  const isRunning = status === 'running';
  const isPaused = status === 'paused';

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onStart}
        disabled={isRunning}
        className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/40"
      >
        {isPaused ? '면접 재개' : '면접 시작'}
      </button>
      <button
        type="button"
        onClick={onPause}
        disabled={!isRunning}
        className="flex-1 rounded-lg border border-stroke px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 dark:border-strokedark dark:text-white"
      >
        일시정지
      </button>
      <button
        type="button"
        onClick={onEnd}
        className="flex-1 rounded-lg border border-danger px-4 py-3 text-sm font-semibold text-danger transition hover:bg-danger/10"
      >
        종료
      </button>
    </div>
  );
};

export default SessionControls;

