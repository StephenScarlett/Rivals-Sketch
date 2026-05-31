import { useRef, useEffect, useState, useCallback } from 'react';
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
  const [mobilePanel, setMobilePanel] = useState<'none' | 'scoreboard' | 'chat'>('none');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const togglePanel = useCallback((panel: 'scoreboard' | 'chat') => {
    setMobilePanel((prev) => (prev === panel ? 'none' : panel));
  }, []);

  // Close mobile panels when game state changes
  useEffect(() => {
    setMobilePanel('none');
  }, [gameState]);

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
      <div className="px-3 md:px-6 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="text-base md:text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex-shrink-0 hover:opacity-80 transition-opacity"
            title="Back to main menu"
          >
            ← Rivals Sketch
          </button>

          {(isDrawing || gameState === 'PICKING_WORD' || gameState === 'ROUND_END') && (
            <>
              <div className="h-5 w-px bg-[var(--color-border)]" />
              <span className="text-xs md:text-sm text-[var(--color-text-muted)] flex-shrink-0">
                R{round}/{totalRounds}
              </span>
              <div className="h-5 w-px bg-[var(--color-border)] hidden md:block" />
              {/* Who is drawing */}
              {isDrawer ? (
                <span className="hidden md:inline text-sm px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium flex-shrink-0">
                  🖌️ You're drawing{isDrawing ? `: ${drawerWord}` : ''}
                </span>
              ) : currentDrawer ? (
                <span className="text-xs md:text-sm px-2 md:px-3 py-1 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium flex-shrink-0 truncate max-w-[140px] md:max-w-none">
                  🖌️ {currentDrawer.nickname}
                </span>
              ) : null}

              {/* Hints display — desktop only */}
              {isDrawing && showHints && (
                <>
                  <div className="flex-1 hidden md:block" />
                  <span className="hidden md:inline font-mono text-lg tracking-[0.2em] text-center text-[var(--color-text)] flex-shrink-0">
                    {hintDisplay}
                  </span>
                </>
              )}

              {/* Category tag — desktop only */}
              {isDrawing && (
                <span className="hidden md:inline text-xs text-[var(--color-text-muted)] ml-auto flex-shrink-0">{category}</span>
              )}
            </>
          )}

          {!(isDrawing || gameState === 'PICKING_WORD' || gameState === 'ROUND_END') && (
            <div className="flex-1" />
          )}
        </div>

        {/* Hint row on mobile — below the main bar */}
        {isDrawing && showHints && hint && (
          <div className="md:hidden mt-1 text-center">
            <span className="font-mono text-sm tracking-[0.15em] text-[var(--color-text)]">
              {hintDisplay}
            </span>
          </div>
        )}

        {/* Drawer word on mobile */}
        {isDrawer && isDrawing && (
          <div className="md:hidden mt-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-300 font-medium">
              Drawing: {drawerWord}
            </span>
          </div>
        )}

        {/* Timer bar integrated into header */}
        {isDrawing && (
          <div className="mt-1 md:mt-2">
            <Timer timeLeft={timeLeft} drawTime={drawTime} />
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 px-2 py-2 md:px-4 md:py-3 min-h-0 relative">
        {/* Desktop: 3-column grid */}
        <div className="hidden md:grid grid-cols-[240px_1fr_300px] gap-4 h-full">
          {/* Left: Scoreboard + Reference Image */}
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
            <Scoreboard players={players} myId={myId} />

            {/* Reference image for drawer */}
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

        {/* Mobile: Full-width canvas */}
        <div className="md:hidden flex flex-col h-full">
          {/* Reference image banner for drawer on mobile */}
          {isDrawer && isDrawing && drawerImageUrl && (
            <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-[var(--color-surface)] border border-purple-500/30 flex-shrink-0">
              <img
                src={drawerImageUrl}
                alt={drawerWord}
                className="w-10 h-10 object-contain rounded-lg bg-[var(--color-surface-light)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="min-w-0">
                {drawerAliases.length > 0 && (
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    Also accepts: {drawerAliases.join(', ')}
                  </p>
                )}
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

        {/* Mobile: Scoreboard slide-over */}
        {mobilePanel === 'scoreboard' && (
          <div className="md:hidden absolute inset-0 z-40 flex">
            <div className="w-72 max-w-[80%] bg-[var(--color-bg)] border-r border-[var(--color-border)] shadow-2xl overflow-y-auto p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--color-text-muted)]">Scoreboard</h3>
                <button
                  onClick={() => setMobilePanel('none')}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-surface-light)] text-[var(--color-text-muted)]"
                >
                  ✕
                </button>
              </div>
              <Scoreboard players={players} myId={myId} />
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMobilePanel('none')} />
          </div>
        )}

        {/* Mobile: Chat slide-over — half screen with close button */}
        {mobilePanel === 'chat' && (
          <div className="md:hidden absolute inset-0 z-40 flex flex-col">
            <div className="flex-1 bg-black/40" onClick={() => setMobilePanel('none')} />
            <div className="h-[55%] min-h-[250px] max-h-[70%] bg-[var(--color-bg)] border-t border-[var(--color-border)] shadow-2xl rounded-t-xl">
              <Chat
                messages={messages}
                onGuess={onGuess}
                isDrawer={isDrawer}
                isCloseGuess={isCloseGuess}
                disabled={!isDrawing}
                onClose={() => setMobilePanel('none')}
              />
            </div>
          </div>
        )}

        {/* Mobile: Floating toggle buttons — hidden when panel is open */}
        {mobilePanel === 'none' && (
          <div className="md:hidden fixed bottom-4 left-3 right-3 z-30 flex justify-between pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <button
              onClick={() => togglePanel('scoreboard')}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-2.5 rounded-full shadow-lg border text-sm font-medium transition bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
            >
              👥 <span className="text-xs">{players.length}</span>
            </button>
            <button
              onClick={() => togglePanel('chat')}
              className="pointer-events-auto flex items-center gap-1.5 px-4 py-2.5 rounded-full shadow-lg border text-sm font-medium transition bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]"
            >
              💬 <span className="text-xs">{messages.length}</span>
            </button>
          </div>
        )}
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

      {/* Leave confirmation modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <h2 className="text-lg font-bold mb-2">Leave game?</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              You'll be taken back to the main menu. You may be able to rejoin if the game is still going.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] transition text-sm font-medium"
              >
                Stay
              </button>
              <button
                onClick={onLeave}
                className="flex-1 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 transition text-sm font-medium"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
