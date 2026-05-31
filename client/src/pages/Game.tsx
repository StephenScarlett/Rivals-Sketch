import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Lobby from '../components/Lobby';
import GameBoard from '../components/GameBoard';
import { useSocket } from '../hooks/useSocket';

export default function Game() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
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
    if (connected && code && !roomCode && players.length === 0) {
      const nickname = localStorage.getItem('rivals-nickname');
      if (nickname) {
        if (code === 'new') {
          createRoom(nickname);
        } else {
          joinRoom(code, nickname);
        }
      } else {
        navigate('/');
      }
    }
  }, [connected, code, roomCode, players.length, joinRoom, createRoom, navigate]);

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
      onPickWord={pickWord}
      onDraw={sendDraw}
      onGuess={sendGuess}
      onPlayAgain={playAgain}
      onLeave={handleLeave}
    />
  );
}
