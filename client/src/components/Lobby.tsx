import type { Player, RoomSettings } from '../../../shared/types';
import { WordCategory } from '../../../shared/types';

const ALL_CATEGORIES = Object.values(WordCategory);

interface LobbyProps {
  roomCode: string;
  players: Player[];
  settings: RoomSettings | null;
  myId: string | null;
  onStart: () => void;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
  onLeave: () => void;
}

export default function Lobby({
  roomCode,
  players,
  settings,
  myId,
  onStart,
  onUpdateSettings,
  onLeave,
}: LobbyProps) {
  const isHost = players.find((p) => p.id === myId)?.isHost ?? false;
  const canStart = isHost && players.length >= 2;

  const copyLink = () => {
    const link = `${window.location.origin}/game/${roomCode}`;
    navigator.clipboard.writeText(link);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl">
        {/* Room Code */}
        <div className="text-center mb-6">
          <p className="text-sm text-[var(--color-text-muted)] mb-1">Room Code</p>
          <p className="text-4xl font-mono font-bold tracking-[0.3em] text-purple-400">
            {roomCode}
          </p>
          <button
            onClick={copyLink}
            className="mt-2 px-4 py-1.5 text-sm rounded-lg bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] border border-[var(--color-border)] transition"
          >
            📋 Copy Invite Link
          </button>
        </div>

        {/* Players */}
        <div className="mb-6">
          <h3 className="text-sm text-[var(--color-text-muted)] mb-3">
            Players ({players.length}{settings ? `/${settings.maxPlayers}` : ''})
          </h3>
          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)]"
              >
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                  {player.nickname[0].toUpperCase()}
                </div>
                <span className="font-medium flex-1">{player.nickname}</span>
                {player.isHost && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">
                    HOST
                  </span>
                )}
                {player.id === myId && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    (you)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        {settings && (
          <div className="mb-6 space-y-4">
            <h3 className="text-sm text-[var(--color-text-muted)]">
              Settings {!isHost && <span className="text-xs">(host can change)</span>}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[var(--color-text-muted)]">Rounds</label>
                <select
                  value={settings.totalRounds}
                  onChange={(e) =>
                    onUpdateSettings({ totalRounds: parseInt(e.target.value) })
                  }
                  disabled={!isHost}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-60"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} round{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--color-text-muted)]">Draw Time</label>
                <select
                  value={settings.drawTime}
                  onChange={(e) =>
                    onUpdateSettings({ drawTime: parseInt(e.target.value) })
                  }
                  disabled={!isHost}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)] disabled:opacity-60"
                >
                  {[30, 45, 60, 90, 120, 150, 180].map((s) => (
                    <option key={s} value={s}>
                      {s}s
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categories */}
            <div>
              <label className="text-xs text-[var(--color-text-muted)] mb-2 block">Categories</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const active = settings.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        if (!isHost) return;
                        const cats = active
                          ? settings.categories.filter((c) => c !== cat)
                          : [...settings.categories, cat];
                        if (cats.length > 0) onUpdateSettings({ categories: cats });
                      }}
                      disabled={!isHost}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
                        active
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-[var(--color-surface-light)] border-[var(--color-border)] text-[var(--color-text-muted)]'
                      } ${isHost ? 'hover:border-purple-500 cursor-pointer' : 'cursor-default'}`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Show Hints */}
            <label className={`flex items-center gap-3 ${isHost ? 'cursor-pointer' : 'cursor-default'}`}>
              <input
                type="checkbox"
                checked={settings.showHints}
                onChange={(e) => {
                  if (isHost) onUpdateSettings({ showHints: e.target.checked });
                }}
                disabled={!isHost}
                className="w-4 h-4 rounded accent-purple-600"
              />
              <span className="text-sm text-[var(--color-text)]">Show letter hints</span>
              <span className="text-xs text-[var(--color-text-muted)]">(reveals letters over time)</span>
            </label>

            {/* Use Real Names */}
            <label className={`flex items-center gap-3 ${isHost ? 'cursor-pointer' : 'cursor-default'}`}>
              <input
                type="checkbox"
                checked={settings.useRealNames}
                onChange={(e) => {
                  if (isHost) onUpdateSettings({ useRealNames: e.target.checked });
                }}
                disabled={!isHost}
                className="w-4 h-4 rounded accent-purple-600"
              />
              <span className="text-sm text-[var(--color-text)]">Accept real names as answers</span>
              <span className="text-xs text-[var(--color-text-muted)]">(e.g. guessing Bruce Banner for Hulk)</span>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isHost ? (
            <button
              onClick={onStart}
              disabled={!canStart}
              className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition"
            >
              {players.length < 2 ? 'Need at least 2 players' : 'Start Game'}
            </button>
          ) : (
            <p className="text-center text-[var(--color-text-muted)]">
              Waiting for host to start...
            </p>
          )}
          <button
            onClick={onLeave}
            className="w-full py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition text-sm"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
