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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="px-6 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Rivals Sketch
          </h1>

          {/* Always show round info and who's drawing when in-game */}
          {(isDrawing || gameState === 'PICKING_WORD' || gameState === 'ROUND_END') && (
            <>
              <div className="h-5 w-px bg-[var(--color-border)]" />
              <div className="text-sm text-[var(--color-text-muted)]">
                Round {round}/{totalRounds}
              </div>
              <div className="h-5 w-px bg-[var(--color-border)]" />
              <div className="flex items-center gap-2">
                {isDrawer ? (
                  <span className="text-sm px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium">
                    🖌️ You're drawing{isDrawing ? `: ${drawerWord}` : ''}
                  </span>
                ) : currentDrawer ? (
                  <span className="text-sm px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium">
                    🖌️ {currentDrawer.nickname} is drawing
                  </span>
                ) : null}
              </div>
            </>
          )}

          <div className="flex-1" />
        </div>
      </div>

      {/* Word hint + Timer */}
      {isDrawing && (
        <div className="px-6 py-2 bg-[var(--color-surface-light)] border-b border-[var(--color-border)] flex-shrink-0">
          <div className="space-y-2">
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

      {/* Main content — full width, no max-w constraint */}
      <div className="flex-1 px-4 py-3 min-h-0">
        <div className="grid grid-cols-[220px_1fr_300px] gap-4 h-full">
          {/* Left: Scoreboard */}
          <div className="min-h-0 overflow-y-auto">
            <Scoreboard players={players} myId={myId} />
          </div>

          {/* Center: Canvas + Reference Image */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* Reference image for drawer — larger and more prominent */}
            {isDrawer && isDrawing && drawerImageUrl && (
              <div className="flex items-center gap-4 px-5 py-3 rounded-xl bg-[var(--color-surface)] border border-purple-500/30 flex-shrink-0">
                <img
                  src={drawerImageUrl}
                  alt={drawerWord}
                  className="w-24 h-24 object-contain rounded-lg bg-[var(--color-surface-light)] p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div>
                  <p className="text-base font-semibold text-purple-300">Reference Image</p>
                  <p className="text-sm text-[var(--color-text-muted)]">Draw: <strong className="text-[var(--color-text)]">{drawerWord}</strong></p>
                </div>
              </div>
            )}
            <div className="flex-1 min-h-0">
              <Canvas
                ref={canvasRef}
                isDrawer={isDrawer}
                drawEvents={drawEvents}
                onDraw={onDraw}
                roundKey={drawingRoundKey}
              />
            </div>
          </div>

          {/* Right: Chat */}
          <div className="min-h-0">
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
