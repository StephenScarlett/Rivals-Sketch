import type { Player } from '../../../shared/types';

interface ScoreboardProps {
  players: Player[];
  myId: string | null;
}

export default function Scoreboard({ players, myId }: ScoreboardProps) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)]">Scoreboard</h3>
      </div>
      <div className="p-2 space-y-1">
        {sorted.map((player, i) => (
          <div
            key={player.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              player.isDrawing
                ? 'bg-yellow-500/20 border border-yellow-500/30'
                : 'bg-[var(--color-surface-light)]'
            }`}
          >
            <span className="text-[var(--color-text-muted)] w-5 text-center font-mono text-xs">
              {i + 1}
            </span>
            <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold flex-shrink-0 text-gray-900">
              {player.nickname[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`block ${player.id === myId ? 'text-yellow-300' : ''}`}>
                {player.nickname}
                {player.id === myId && ' (you)'}
              </span>
              {player.isDrawing && (
                <span className="text-xs text-yellow-400 font-medium">🖌️ Drawing</span>
              )}
            </div>
            {player.hasGuessed && !player.isDrawing && (
              <span className="text-green-400 text-sm">✓</span>
            )}
            <span className="font-mono font-semibold text-yellow-400 text-right">
              {player.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
