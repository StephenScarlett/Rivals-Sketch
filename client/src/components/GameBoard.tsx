import { useRef, useEffect, useState } from 'react';
import Canvas from './Canvas';
import Chat from './Chat';
import Scoreboard from './Scoreboard';
import Timer from './Timer';
import WordPicker from './WordPicker';
import GameOver from './GameOver';
import type {
  Player,
  DrawEvent,
  WordOption,
  ChatMessage,
  RoundResult,
  GameState,
} from '../../../shared/types';

export interface RoundSnapshot {
  word: string;
  drawerNickname: string;
  dataUrl: string;
}

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
  drawerWord: string;
  drawerImageUrl: string;
  drawingRoundKey: number;
  showHints: boolean;

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
  drawerWord,
  drawerImageUrl,
  drawingRoundKey,
  showHints,
  onPickWord,
  onDraw,
  onGuess,
  onPlayAgain,
  onLeave,
}: GameBoardProps) {
  const isDrawer = currentDrawer?.id === myId;
  const isHost = players.find((p) => p.id === myId)?.isHost ?? false;
  const isDrawing = gameState === 'DRAWING';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [roundSnapshots, setRoundSnapshots] = useState<RoundSnapshot[]>([]);

  // Build the hint display with spaces between chars
  const hintDisplay = hint
    .split('')
    .map((c) => (c === '_' ? '_' : c))
    .join(' ');

  // Capture canvas snapshot when round ends
  useEffect(() => {
    if (gameState === 'ROUND_END' && canvasRef.current && roundResult) {
      try {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setRoundSnapshots((prev) => [
          ...prev,
          {
            word: roundResult.word,
            drawerNickname: roundResult.drawerNickname,
            dataUrl,
          },
        ]);
      } catch {
        // canvas tainted or unavailable
      }
    }
  }, [gameState, roundResult]);

  // Reset snapshots on new game
  useEffect(() => {
    if (gameState === 'LOBBY') {
      setRoundSnapshots([]);
    }
  }, [gameState]);

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
                    You're drawing: <strong>{drawerWord}</strong>
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
              {showHints && (
                <span className="font-mono text-xl tracking-[0.2em] text-center flex-1">
                  {hintDisplay}
                </span>
              )}
              {!showHints && <div className="flex-1" />}
              <div className="w-24" />
            </div>
            <Timer timeLeft={timeLeft} drawTime={drawTime} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-[260px_1fr_280px] gap-4 h-full" style={{ minHeight: 'calc(100vh - 140px)' }}>
          {/* Left: Scoreboard */}
          <div>
            <Scoreboard players={players} myId={myId} />
          </div>

          {/* Center: Canvas + Reference Image */}
          <div className="flex flex-col gap-3">
            {/* Reference image for drawer */}
            {isDrawer && isDrawing && drawerImageUrl && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <img
                  src={drawerImageUrl}
                  alt={drawerWord}
                  className="w-12 h-12 object-contain rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-purple-300">Reference</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Draw: {drawerWord}</p>
                </div>
              </div>
            )}
            <Canvas
              ref={canvasRef}
              isDrawer={isDrawer}
              drawEvents={drawEvents}
              onDraw={onDraw}
              roundKey={drawingRoundKey}
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
      {wordOptions.length > 0 && gameState !== 'ROUND_END' && (
        <WordPicker words={wordOptions} onPick={onPickWord} />
      )}

      {gameState === 'GAME_OVER' && finalScores && (
        <GameOver
          finalScores={finalScores}
          rounds={allRounds}
          roundSnapshots={roundSnapshots}
          myId={myId}
          onPlayAgain={onPlayAgain}
          onLeave={onLeave}
          isHost={isHost}
        />
      )}
    </div>
  );
}
