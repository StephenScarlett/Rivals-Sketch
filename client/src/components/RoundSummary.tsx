import type { RoundResult } from '../../../shared/types';

interface RoundSummaryProps {
  result: RoundResult;
}

export default function RoundSummary({ result }: RoundSummaryProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        <h2 className="text-2xl font-bold mb-1">Round Over!</h2>
        <p className="text-[var(--color-text-muted)] mb-4">
          The word was...
        </p>

        <div className="mb-4">
          {result.imageUrl && (
            <img
              src={result.imageUrl}
              alt={result.word}
              className="w-24 h-24 object-contain mx-auto mb-3 rounded-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <p className="text-3xl font-bold text-purple-400">{result.word}</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            {result.category} • drawn by {result.drawerNickname}
          </p>
        </div>

        {result.guessers.length > 0 ? (
          <div>
            <p className="text-sm text-[var(--color-text-muted)] mb-2">
              Guessed by:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {result.guessers.map((g) => (
                <span
                  key={g.nickname}
                  className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm"
                >
                  {g.nickname}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-400">Nobody guessed it!</p>
        )}

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Next round starting soon...
        </p>
      </div>
    </div>
  );
}
