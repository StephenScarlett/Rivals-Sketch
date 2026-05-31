import { useEffect, useState, useCallback } from 'react';
import { socket } from '../lib/socket';
import type {
  Player,
  RoomSettings,
  GameState,
  WordOption,
  DrawEvent,
  RoundResult,
  ChatMessage,
  ScoreUpdate,
} from '../../../shared/types';

export interface GameData {
  connected: boolean;
  roomCode: string | null;
  players: Player[];
  settings: RoomSettings | null;
  gameState: GameState | null;
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
  error: string | null;
  isCloseGuess: boolean;
  myId: string | null;
}

export function useSocket() {
  const [data, setData] = useState<GameData>({
    connected: false,
    roomCode: null,
    players: [],
    settings: null,
    gameState: null,
    currentDrawer: null,
    wordOptions: [],
    wordLength: 0,
    category: '',
    round: 0,
    totalRounds: 0,
    drawTime: 0,
    timeLeft: 0,
    hint: '',
    messages: [],
    drawEvents: [],
    roundResult: null,
    finalScores: null,
    allRounds: [],
    error: null,
    isCloseGuess: false,
    myId: null,
  });

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setData((d) => ({ ...d, connected: true, myId: socket.id ?? null }));
    });

    socket.on('disconnect', () => {
      setData((d) => ({ ...d, connected: false }));
    });

    socket.on('room-created', ({ roomCode }) => {
      setData((d) => ({ ...d, roomCode }));
    });

    socket.on('player-joined', ({ players }) => {
      setData((d) => ({ ...d, players }));
    });

    socket.on('player-left', ({ players, leftPlayer }) => {
      setData((d) => ({
        ...d,
        players,
        messages: [
          ...d.messages,
          {
            id: Date.now().toString(),
            sender: 'system',
            text: `${leftPlayer} left the game`,
            type: 'system',
            timestamp: Date.now(),
          },
        ],
      }));
    });

    socket.on('settings-updated', ({ settings }) => {
      setData((d) => ({ ...d, settings }));
    });

    socket.on('game-started', ({ state }) => {
      setData((d) => ({
        ...d,
        gameState: state,
        messages: [],
        roundResult: null,
        finalScores: null,
        allRounds: [],
      }));
    });

    socket.on('pick-words', ({ words }) => {
      setData((d) => ({ ...d, wordOptions: words }));
    });

    socket.on('drawing-start', ({ drawer, wordLength, category, round, totalRounds, drawTime }) => {
      setData((d) => ({
        ...d,
        gameState: 'DRAWING' as GameState,
        currentDrawer: drawer,
        wordLength,
        category,
        round,
        totalRounds,
        drawTime,
        timeLeft: drawTime,
        hint: '_'.repeat(wordLength),
        wordOptions: [],
        drawEvents: [],
        roundResult: null,
        isCloseGuess: false,
      }));
    });

    socket.on('draw', (event) => {
      setData((d) => ({
        ...d,
        drawEvents: [...d.drawEvents, event],
      }));
    });

    socket.on('correct-guess', ({ scores }) => {
      setData((d) => {
        const updatedPlayers = d.players.map((p) => {
          const update = scores.find((s: ScoreUpdate) => s.playerId === p.id);
          if (update) {
            return { ...p, score: update.totalScore, hasGuessed: true };
          }
          return p;
        });
        return { ...d, players: updatedPlayers };
      });
    });

    socket.on('close-guess', () => {
      setData((d) => ({ ...d, isCloseGuess: true }));
      setTimeout(() => {
        setData((d) => ({ ...d, isCloseGuess: false }));
      }, 2000);
    });

    socket.on('hint', ({ revealed }) => {
      setData((d) => ({ ...d, hint: revealed }));
    });

    socket.on('timer', ({ timeLeft }) => {
      setData((d) => ({ ...d, timeLeft }));
    });

    socket.on('round-end', (result) => {
      setData((d) => ({
        ...d,
        gameState: 'ROUND_END' as GameState,
        roundResult: result,
        allRounds: [...d.allRounds, result],
      }));
    });

    socket.on('game-over', ({ finalScores, rounds }) => {
      setData((d) => ({
        ...d,
        gameState: 'GAME_OVER' as GameState,
        finalScores,
        allRounds: rounds,
      }));
    });

    socket.on('chat-message', (msg) => {
      setData((d) => ({
        ...d,
        messages: [...d.messages, msg],
      }));
    });

    socket.on('host-changed', ({ hostId }) => {
      setData((d) => ({
        ...d,
        players: d.players.map((p) => ({ ...p, isHost: p.id === hostId })),
      }));
    });

    socket.on('error', ({ message }) => {
      setData((d) => ({ ...d, error: message }));
      setTimeout(() => setData((d) => ({ ...d, error: null })), 4000);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  // Actions
  const createRoom = useCallback((nickname: string) => {
    socket.emit('create-room', { nickname });
  }, []);

  const joinRoom = useCallback((roomCode: string, nickname: string) => {
    socket.emit('join-room', { roomCode, nickname });
  }, []);

  const startGame = useCallback(() => {
    socket.emit('start-game');
  }, []);

  const pickWord = useCallback((word: string) => {
    socket.emit('pick-word', { word });
  }, []);

  const sendDraw = useCallback((event: DrawEvent) => {
    socket.emit('draw', event);
  }, []);

  const sendGuess = useCallback((message: string) => {
    socket.emit('guess', { message });
  }, []);

  const sendChat = useCallback((message: string) => {
    socket.emit('chat', { message });
  }, []);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    socket.emit('update-settings', { settings });
  }, []);

  const leaveRoom = useCallback(() => {
    socket.emit('leave-room');
    setData((d) => ({
      ...d,
      roomCode: null,
      players: [],
      gameState: null,
      messages: [],
    }));
  }, []);

  const playAgain = useCallback(() => {
    socket.emit('play-again');
  }, []);

  return {
    ...data,
    createRoom,
    joinRoom,
    startGame,
    pickWord,
    sendDraw,
    sendGuess,
    sendChat,
    updateSettings,
    leaveRoom,
    playAgain,
  };
}
