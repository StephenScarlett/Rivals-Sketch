import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Lobby from '../components/Lobby';
import GameBoard from '../components/GameBoard';
import { useSocket } from '../hooks/useSocket';

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [needsNickname, setNeedsNickname] = useState(false);
  const [pendingNickname, setPendingNickname] = useState('');
  const {
    connected,
    roomCode,
    players,
    settings,
    gameState,
    currentDrawer,
    wordOptions,
    wordLength,
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
    error,
    isCloseGuess,
    myId,
    drawerWord,
    drawerImageUrl,
    drawerAliases,
    drawingRoundKey,
    showHints,
    showConfetti,
    joinRoom,
    createRoom,
    startGame,
    pickWord,
    sendDraw,
    sendGuess,
    updateSettings,
    leaveRoom,
    playAgain,
  } = useSocket();

  // Auto-create or auto-join room from URL
  useEffect(() => {
    if (connected && code && !roomCode && players.length === 0 && !needsNickname) {
      const nickname = localStorage.getItem('rivals-nickname');
      if (nickname) {
        if (code === 'new') {
          createRoom(nickname);
        } else {
          joinRoom(code, nickname);
        }
      } else {
        setNeedsNickname(true);
      }
    }
  }, [connected, code, roomCode, players.length, joinRoom, createRoom, needsNickname]);

  // Once room is created, update the URL from /game/new to /game/CODE
  useEffect(() => {
    if (code === 'new' && roomCode) {
      navigate(`/game/${roomCode}`, { replace: true });
    }
  }, [code, roomCode, navigate]);

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  const handleNicknameSubmit = () => {
    if (!pendingNickname.trim() || !code) return;
    const nick = pendingNickname.trim();
    localStorage.setItem('rivals-nickname', nick);
    setNeedsNickname(false);
    if (code === 'new') {
      createRoom(nick);
    } else {
      joinRoom(code, nick);
    }
  };

  // Show error toast
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center max-w-sm">
          <p className="text-red-400 font-semibold mb-2">Error</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 rounded-lg bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] transition text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (needsNickname) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl text-center">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-red-400 to-yellow-400 bg-clip-text text-transparent">
            Rivals Sketch
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mb-6">Enter a nickname to join the game</p>
          <input
            type="text"
            value={pendingNickname}
            onChange={(e) => setPendingNickname(e.target.value.slice(0, 20))}
            onKeyDown={(e) => e.key === 'Enter' && handleNicknameSubmit()}
            placeholder="Enter nickname..."
            maxLength={20}
            autoFocus
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-light)] border border-[var(--color-border)] text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-purple-500 transition mb-4"
          />
          <button
            onClick={handleNicknameSubmit}
            disabled={!pendingNickname.trim()}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-lg transition"
          >
            Join Game
          </button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Connecting...</p>
      </div>
    );
  }

  // Lobby state
  if (!gameState || gameState === 'LOBBY') {
    if (!roomCode && !code) {
      navigate('/');
      return null;
    }

    return (
      <Lobby
        roomCode={roomCode || code || ''}
        players={players}
        settings={settings}
        myId={myId}
        onStart={startGame}
        onUpdateSettings={updateSettings}
        onLeave={handleLeave}
      />
    );
  }

  // Game states
  return (
    <GameBoard
      gameState={gameState}
      players={players}
      myId={myId}
      currentDrawer={currentDrawer}
      wordOptions={wordOptions}
      wordLength={wordLength}
      category={category}
      round={round}
      totalRounds={totalRounds}
      drawTime={drawTime}
      timeLeft={timeLeft}
      hint={hint}
      messages={messages}
      drawEvents={drawEvents}
      roundResult={roundResult}
      finalScores={finalScores}
      allRounds={allRounds}
      isCloseGuess={isCloseGuess}
      drawerWord={drawerWord}
      drawerImageUrl={drawerImageUrl}
      drawerAliases={drawerAliases}
      drawingRoundKey={drawingRoundKey}
      showHints={showHints}
      showConfetti={showConfetti}
      onPickWord={pickWord}
      onDraw={sendDraw}
      onGuess={sendGuess}
      onPlayAgain={playAgain}
      onLeave={handleLeave}
    />
  );
}
