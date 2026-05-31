import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [nickname, setNickname] = useState(
    () => localStorage.getItem('rivals-nickname') || ''
  );
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const navigate = useNavigate();

  const handleNicknameChange = (val: string) => {
    const sanitized = val.slice(0, 20);
    setNickname(sanitized);
    localStorage.setItem('rivals-nickname', sanitized);
  };

  const handleCreate = () => {
    if (!nickname.trim()) return;
    localStorage.setItem('rivals-nickname', nickname.trim());
    navigate('/game/new');
  };

  const handleJoin = () => {
    if (!nickname.trim() || !joinCode.trim()) return;
    localStorage.setItem('rivals-nickname', nickname.trim());
    navigate(`/game/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Title */}
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
          Rivals Sketch
        </h1>
        <p className="text-[var(--color-text-muted)] text-lg">
          Draw & guess Marvel Rivals heroes with friends
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl">
        {mode === 'menu' ? (
          <div className="space-y-4">
            {/* Nickname */}
            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-2">
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="Enter nickname..."
                maxLength={20}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              onClick={() => {
                if (nickname.trim()) setMode('create');
              }}
              disabled={!nickname.trim()}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition"
            >
              Create Game
            </button>

            <button
              onClick={() => {
                if (nickname.trim()) setMode('join');
              }}
              disabled={!nickname.trim()}
              className="w-full py-3 rounded-lg bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] border border-[var(--color-border)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-text)] font-semibold text-lg transition"
            >
              Join Game
            </button>
          </div>
        ) : mode === 'create' ? (
          <div className="space-y-4">
            <button
              onClick={() => setMode('menu')}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
            >
              ← Back
            </button>
            <p className="text-center text-[var(--color-text-muted)]">
              Creating room as <span className="text-white font-semibold">{nickname}</span>...
            </p>
            <button
              onClick={handleCreate}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg transition"
            >
              Create Room
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setMode('menu')}
              className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition"
            >
              ← Back
            </button>
            <div>
              <label className="block text-sm text-[var(--color-text-muted)] mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-character code..."
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-purple-500 transition text-center text-2xl tracking-[0.3em] font-mono"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={joinCode.length < 6}
              className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition"
            >
              Join Room
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[var(--color-text-muted)] max-w-md text-center">
        Rivals Sketch is a fan-made project. Not affiliated with or endorsed by Marvel or NetEase.
      </p>
    </div>
  );
}
