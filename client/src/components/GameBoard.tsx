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
  drawerAliases: string[];
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
  drawerAliases,
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
      {/* Top bar — compact branding + timer/drawer info combined */}
      <div className="px-6 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex-shrink-0">
            Rivals Sketch
          </h1>

          {(isDrawing || gameState === 'PICKING_WORD' || gameState === 'ROUND_END') && (
            <>
              <div className="h-5 w-px bg-[var(--color-border)]" />
              <span className="text-sm text-[var(--color-text-muted)] flex-shrink-0">
                Round {round}/{totalRounds}
              </span>
              <div className="h-5 w-px bg-[var(--color-border)]" />
              {/* Who is drawing */}
              {isDrawer ? (
                <span className="text-sm px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium flex-shrink-0">
                  🖌️ You're drawing{isDrawing ? `: ${drawerWord}` : ''}
                </span>
              ) : currentDrawer ? (
                <span className="text-sm px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium flex-shrink-0">
                  🖌️ {currentDrawer.nickname} is drawing
                </span>
              ) : null}

              {/* Hints display */}
              {isDrawing && showHints && (
                <>
                  <div className="flex-1" />
                  <span className="font-mono text-lg tracking-[0.2em] text-center text-[var(--color-text)] flex-shrink-0">
                    {hintDisplay}
                  </span>
                </>
              )}

              {/* Category tag */}
              {isDrawing && (
                <span className="text-xs text-[var(--color-text-muted)] ml-auto flex-shrink-0">{category}</span>
              )}
            </>
          )}

          {!(isDrawing || gameState === 'PICKING_WORD' || gameState === 'ROUND_END') && (
            <div className="flex-1" />
          )}
        </div>

        {/* Timer bar integrated into header */}
        {isDrawing && (
          <div className="mt-2">
            <Timer timeLeft={timeLeft} drawTime={drawTime} />
          </div>
        )}
      </div>

      {/* Main content — full width */}
      <div className="flex-1 px-4 py-3 min-h-0">
        <div className="grid grid-cols-[240px_1fr_300px] gap-4 h-full">
          {/* Left: Scoreboard + Reference Image */}
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
            <Scoreboard players={players} myId={myId} />

            {/* Reference image for drawer — placed under scoreboard to fill space */}
            {isDrawer && isDrawing && drawerImageUrl && (
              <div className="rounded-xl bg-[var(--color-surface)] border border-purple-500/30 overflow-hidden flex-shrink-0">
                <img
                  src={drawerImageUrl}
                  alt={drawerWord}
                  className="w-full object-contain bg-[var(--color-surface-light)]"
                  style={{ maxHeight: '200px' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-purple-300">Draw: {drawerWord}</p>
                  {drawerAliases.length > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Also accepts: {drawerAliases.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Center: Canvas */}
          <div className="flex flex-col min-h-0">
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
