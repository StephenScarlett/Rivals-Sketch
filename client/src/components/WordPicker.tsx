import type { WordOption } from '../../../shared/types';

interface WordPickerProps {
  words: WordOption[];
  onPick: (word: string) => void;
}

export default function WordPicker({ words, onPick }: WordPickerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 md:p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 md:p-8 max-w-2xl w-full shadow-2xl">
        <h2 className="text-lg md:text-2xl font-bold text-center mb-1 md:mb-2">Choose a word to draw</h2>
        <p className="text-[var(--color-text-muted)] text-center mb-4 md:mb-6 text-sm md:text-base">
          Pick one of the options below
        </p>

        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {words.map((word) => (
            <button
              key={word.word}
              onClick={() => onPick(word.word)}
              className="flex flex-col items-center gap-1.5 md:gap-3 p-2.5 md:p-5 rounded-xl bg-[var(--color-surface-light)] border border-[var(--color-border)] hover:border-purple-500 hover:bg-purple-600/10 transition group"
            >
              {word.imageUrl && (
                <img
                  src={word.imageUrl}
                  alt=""
                  className="w-10 h-10 md:w-16 md:h-16 object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="font-semibold text-sm md:text-lg group-hover:text-purple-300 transition text-center leading-tight">
                {word.word}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] hidden md:inline">
                {word.category}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  word.difficulty === 'easy'
                    ? 'bg-green-500/20 text-green-400'
                    : word.difficulty === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {word.difficulty}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
