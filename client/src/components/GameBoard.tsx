import Canvas from './Canvas';
import Chat from './Chat';
import Scoreboard from './Scoreboard';
import Timer from './Timer';
import WordPicker from './WordPicker';
import RoundSummary from './RoundSummary';
import GameOver from './GameOver';
import type {
  Player,
  DrawEvent,
  WordOption,
  ChatMessage,
  RoundResult,
  GameState,
} from '../../../shared/types';

interface GameBoardProps {
  // State
  gameState: GameState;
  players: Player[];
  myId: string | null;
  currentDrawer: Player | null;
  wordOptions: WordOption[];
  wordLength: number;
  category: string;
  round: number;
  totalRounds: number;
  drawTime: number;
  timeLeft: number;
  hint: string;
  messages: ChatMessage[];
  drawEvents: DrawEvent[];
  roundResult: RoundResult | null;
  finalScores: Player[] | null;
  allRounds: RoundResult[];
  isCloseGuess: boolean;

  // Actions
  onPickWord: (word: string) => void;
  onDraw: (event: DrawEvent) => void;
  onGuess: (message: string) => void;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function GameBoard({
  gameState,
  players,
  myId,
  currentDrawer,
  wordOptions,
  wordLength: _wordLength,
  category,
  round,
  totalRounds,
  drawTime,
  timeLeft,
  hint,
  messages,
  drawEvents,
  roundResult,
  finalScores,
  allRounds,
  isCloseGuess,
  onPickWord,
  onDraw,
  onGuess,
  onPlayAgain,
  onLeave,
}: GameBoardProps) {
  const isDrawer = currentDrawer?.id === myId;
  const isHost = players.find((p) => p.id === myId)?.isHost ?? false;
  const isDrawing = gameState === 'DRAWING';

  // Build the hint display with spaces between chars
  const hintDisplay = hint
    .split('')
    .map((c) => (c === '_' ? '_' : c))
    .join(' ');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="px-4 py-3 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Rivals Sketch
          </h1>
          <div className="flex-1" />

          {isDrawing && (
            <>
              <div className="text-sm text-[var(--color-text-muted)]">
                Round {round}/{totalRounds}
              </div>
              <div className="text-sm">
                {isDrawer ? (
                  <span className="text-purple-300">
                    You're drawing: <strong>{currentDrawer?.nickname}</strong>
                  </span>
                ) : (
                  <span className="text-[var(--color-text-muted)]">
                    <strong className="text-purple-300">{currentDrawer?.nickname}</strong> is drawing
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Word hint + Timer */}
      {isDrawing && (
        <div className="px-4 py-2 bg-[var(--color-surface-light)] border-b border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">{category}</span>
              <span className="font-mono text-xl tracking-[0.2em] text-center flex-1">
                {hintDisplay}
              </span>
              <div className="w-24" />
            </div>
            <Timer timeLeft={timeLeft} drawTime={drawTime} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-[200px_1fr_280px] gap-4 h-full" style={{ minHeight: 'calc(100vh - 140px)' }}>
          {/* Left: Scoreboard */}
          <div>
            <Scoreboard players={players} myId={myId} />
          </div>

          {/* Center: Canvas */}
          <div>
            <Canvas
              isDrawer={isDrawer}
              drawEvents={drawEvents}
              onDraw={onDraw}
            />
          </div>

          {/* Right: Chat */}
          <div style={{ height: 'calc(100vh - 160px)' }}>
            <Chat
              messages={messages}
              onGuess={onGuess}
              isDrawer={isDrawer}
              isCloseGuess={isCloseGuess}
              disabled={!isDrawing}
            />
          </div>
        </div>
      </div>

      {/* Overlays */}
      {wordOptions.length > 0 && (
        <WordPicker words={wordOptions} onPick={onPickWord} />
      )}

      {gameState === 'ROUND_END' && roundResult && (
        <RoundSummary result={roundResult} />
      )}

      {gameState === 'GAME_OVER' && finalScores && (
        <GameOver
          finalScores={finalScores}
          rounds={allRounds}
          myId={myId}
          onPlayAgain={onPlayAgain}
          onLeave={onLeave}
          isHost={isHost}
        />
      )}
    </div>
  );
}
