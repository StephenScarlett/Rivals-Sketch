import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../../shared/types';

interface ChatProps {
  messages: ChatMessage[];
  onGuess: (message: string) => void;
  isDrawer: boolean;
  isCloseGuess: boolean;
  disabled: boolean;
}

export default function Chat({
  messages,
  onGuess,
  isDrawer,
  isCloseGuess,
  disabled,
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
      <div className="px-4 py-2.5 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-muted)]">Chat</h3>
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
      <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--color-border)]">
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
          className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-purple-500 disabled:opacity-50 transition text-sm"
        />
      </form>
    </div>
  );
}
