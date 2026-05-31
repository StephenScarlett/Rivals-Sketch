import type { Player, RoundResult } from '../../../shared/types';
import type { RoundSnapshot } from './GameBoard';

interface GameOverProps {
  finalScores: Player[];
  rounds: RoundResult[];
  roundSnapshots: RoundSnapshot[];
  myId: string | null;
  onPlayAgain: () => void;
  onLeave: () => void;
  isHost: boolean;
}

export default function GameOver({
  finalScores,
  rounds: _rounds,
  roundSnapshots,
  myId,
  onPlayAgain,
  onLeave,
  isHost,
}: GameOverProps) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 max-w-2xl w-full shadow-2xl my-8">
        <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Game Over!
        </h2>

        {/* Final Rankings */}
        <div className="space-y-2 mb-6">
          {finalScores.map((player, i) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                i === 0
                  ? 'bg-yellow-500/10 border border-yellow-500/30'
                  : 'bg-[var(--color-surface-light)] border border-[var(--color-border)]'
              }`}
            >
              <span className="text-2xl w-8 text-center">
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>
              <span
                className={`flex-1 font-semibold text-lg ${
                  player.id === myId ? 'text-purple-300' : ''
                }`}
              >
                {player.nickname}
                {player.id === myId && ' (you)'}
              </span>
              <span className="font-mono font-bold text-xl text-yellow-400">
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {/* Drawing Recap */}
        {roundSnapshots.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm text-[var(--color-text-muted)] mb-3">Drawing Recap</h3>
            <div className="grid grid-cols-2 gap-3">
              {roundSnapshots.map((snap, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden bg-[var(--color-surface-light)] border border-[var(--color-border)]"
                >
                  <img
                    src={snap.dataUrl}
                    alt={snap.word}
                    className="w-full aspect-[4/3] object-contain bg-white"
                  />
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-purple-300">{snap.word}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      drawn by {snap.drawerNickname}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isHost && (
            <button
              onClick={onPlayAgain}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg transition"
            >
              Play Again
            </button>
          )}
          <button
            onClick={onLeave}
            className="w-full py-2 rounded-lg bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] border border-[var(--color-border)] transition"
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
