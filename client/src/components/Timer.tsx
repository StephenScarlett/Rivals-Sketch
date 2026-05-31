interface TimerProps {
  timeLeft: number;
  drawTime: number;
}

export default function Timer({ timeLeft, drawTime }: TimerProps) {
  const fraction = timeLeft / drawTime;
  const isLow = timeLeft <= 10;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-full h-2 rounded-full bg-[var(--color-surface-light)] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${
            isLow ? 'bg-red-500 animate-pulse' : fraction > 0.5 ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span
        className={`font-mono font-bold text-lg min-w-[3ch] text-right ${
          isLow ? 'text-red-400' : 'text-[var(--color-text)]'
        }`}
      >
        {timeLeft}
      </span>
    </div>
  );
}
