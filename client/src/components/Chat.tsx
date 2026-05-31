import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../../shared/types';

interface ChatProps {
  messages: ChatMessage[];
  onGuess: (message: string) => void;
  isDrawer: boolean;
  isCloseGuess: boolean;
  disabled: boolean;
  onClose?: () => void;
}

export default function Chat({
  messages,
  onGuess,
  isDrawer,
  isCloseGuess,
  disabled,
  onClose,
}: ChatProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isDrawer || disabled) return;
    onGuess(input.trim());
    setInput('');
  };

  const getMessageColor = (type: ChatMessage['type']) => {
    switch (type) {
      case 'correct':
        return 'text-green-400';
      case 'close':
        return 'text-yellow-400';
      case 'system':
        return 'text-[var(--color-text-muted)] italic';
      default:
        return 'text-[var(--color-text)]';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)]">Chat</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--color-surface-light)] text-[var(--color-text-muted)] text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`text-sm ${getMessageColor(msg.type)}`}>
            {msg.type === 'system' || msg.type === 'correct' ? (
              <span>{msg.text}</span>
            ) : (
              <>
                <span className="font-semibold">{msg.sender}: </span>
                <span>{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Close guess indicator */}
      {isCloseGuess && (
        <div className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 text-xs text-center font-medium">
          You're close!
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--color-border)] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isDrawer
              ? "You're drawing!"
              : disabled
              ? 'Waiting...'
              : 'Type your guess...'
          }
          disabled={isDrawer || disabled}
          maxLength={200}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-purple-500 disabled:opacity-50 transition text-sm"
        />
        <button
          type="submit"
          disabled={isDrawer || disabled || !input.trim()}
          className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition flex-shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}
