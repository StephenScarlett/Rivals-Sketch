import { Server, Socket } from 'socket.io';
import {
  GameState,
  Player,
  RoomSettings,
  WordCategory,
  WordOption,
  DrawEvent,
  RoundResult,
  ScoreUpdate,
  ChatMessage,
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../shared/types';
import { getRandomWords } from './wordBank';
import {
  calculateGuesserPoints,
  calculateDrawerPoints,
  isCorrectGuess,
  isCloseGuess,
} from './scoring';

const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 12,
  totalRounds: 3,
  drawTime: 90,
  categories: [
    WordCategory.HEROES,
    WordCategory.ABILITIES,
    WordCategory.WEAPONS,
    WordCategory.MAPS,
  ],
  showHints: true,
};

const PICK_TIME = 15_000;   // 15 seconds to pick a word
const ROUND_END_TIME = 3_000; // 3 seconds between rounds
const HINT_FRACTION_1 = 0.4;  // reveal first hint at 40% elapsed
const HINT_FRACTION_2 = 0.7;  // reveal second hint at 70% elapsed

export class GameRoom {
  code: string;
  players: Map<string, Player> = new Map();
  settings: RoomSettings;
  state: GameState = GameState.LOBBY;

  // Game progress
  currentRound = 0;
  turnOrder: string[] = [];  // player IDs in turn order
  currentTurnIndex = 0;
  currentWord: WordOption | null = null;
  usedWords: Set<string> = new Set();
  roundResults: RoundResult[] = [];
  drawingStartTime = 0;
  drawEvents: DrawEvent[] = [];
  private pendingWordOptions: WordOption[] = [];

  // Timers
  private pickTimer: ReturnType<typeof setTimeout> | null = null;
  private drawTimer: ReturnType<typeof setInterval> | null = null;
  private roundEndTimer: ReturnType<typeof setTimeout> | null = null;
  private timeLeft = 0;
  private hintsRevealed = 0;

  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    code: string,
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    settings?: Partial<RoomSettings>
  ) {
    this.code = code;
    this.io = io;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  // ---- Room access helpers ----

  private get room() {
    return this.io.to(this.code);
  }

  private toSocket(socketId: string) {
    return this.io.to(socketId);
  }

  getPlayersArray(): Player[] {
    return Array.from(this.players.values());
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  // ---- Player management ----

  addPlayer(socket: Socket, nickname: string): Player {
    const isFirst = this.players.size === 0;
    const player: Player = {
      id: socket.id,
      nickname,
      score: 0,
      hasGuessed: false,
      isHost: isFirst,
      isDrawing: false,
      isConnected: true,
    };
    this.players.set(socket.id, player);
    socket.join(this.code);
    return player;
  }

  removePlayer(socketId: string): Player | undefined {
    const player = this.players.get(socketId);
    if (!player) return undefined;

    this.players.delete(socketId);

    // If host left, transfer host
    if (player.isHost && this.players.size > 0) {
      const newHost = this.players.values().next().value!;
      newHost.isHost = true;
      this.room.emit('host-changed', { hostId: newHost.id });
    }

    // If drawer left mid-game, skip to next turn
    if (player.isDrawing && this.state === GameState.DRAWING) {
      this.clearTimers();
      this.endRound();
    }

    return player;
  }

  updateSettings(settings: Partial<RoomSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  // ---- Game flow ----

  startGame(): void {
    if (this.players.size < 2) return;

    // Reset all state
    this.currentRound = 1;
    this.roundResults = [];
    this.usedWords.clear();
    this.turnOrder = Array.from(this.players.keys());
    this.currentTurnIndex = 0;

    // Reset scores
    for (const p of this.players.values()) {
      p.score = 0;
      p.hasGuessed = false;
      p.isDrawing = false;
    }

    this.state = GameState.PICKING_WORD;
    this.room.emit('game-started', { state: this.state });
    this.startPickPhase();
  }

  private startPickPhase(): void {
    const drawerId = this.turnOrder[this.currentTurnIndex];
    const drawer = this.players.get(drawerId);
    if (!drawer) {
      this.nextTurn();
      return;
    }

    // Set drawer flag
    for (const p of this.players.values()) {
      p.isDrawing = p.id === drawerId;
      p.hasGuessed = false;
    }

    this.state = GameState.PICKING_WORD;
    this.drawEvents = [];

    // Send 3 word options to the drawer
    const words = getRandomWords(3, this.settings.categories, this.usedWords);
    this.pendingWordOptions = words;
    this.toSocket(drawerId).emit('pick-words', { words });

    // Auto-pick after timeout
    this.pickTimer = setTimeout(() => {
      if (this.state === GameState.PICKING_WORD) {
        this.pickWord(drawerId, words[0].word);
      }
    }, PICK_TIME);
  }

  pickWord(socketId: string, word: string): void {
    if (this.state !== GameState.PICKING_WORD) return;

    const drawerId = this.turnOrder[this.currentTurnIndex];
    if (socketId !== drawerId) return;

    this.clearTimer('pick');

    // Look up the word from the options we sent to the drawer
    const picked = this.pendingWordOptions.find((w) => w.word === word) || {
      word,
      category: WordCategory.HEROES,
      difficulty: 'medium' as any,
    };

    this.currentWord = picked;
    this.pendingWordOptions = [];
    this.usedWords.add(word);
    this.startDrawPhase();
  }

  private startDrawPhase(): void {
    const drawerId = this.turnOrder[this.currentTurnIndex];
    const drawer = this.players.get(drawerId);
    if (!drawer || !this.currentWord) return;

    this.state = GameState.DRAWING;
    this.drawingStartTime = Date.now();
    this.timeLeft = this.settings.drawTime;
    this.hintsRevealed = 0;

    // Broadcast round start (word length, not the word itself)
    this.room.emit('drawing-start', {
      drawer: { ...drawer },
      wordLength: this.currentWord.word.length,
      category: this.currentWord.category,
      round: this.currentRound,
      totalRounds: this.settings.totalRounds,
      drawTime: this.settings.drawTime,
      imageUrl: this.currentWord.imageUrl,
    });

    // Start countdown timer
    this.drawTimer = setInterval(() => {
      this.timeLeft--;
      this.room.emit('timer', { timeLeft: this.timeLeft });

      // Progressive hints
      const elapsed = this.settings.drawTime - this.timeLeft;
      const fraction = elapsed / this.settings.drawTime;

      if (this.settings.showHints) {
        if (this.hintsRevealed === 0 && fraction >= HINT_FRACTION_1) {
          this.hintsRevealed = 1;
          this.sendHint();
        } else if (this.hintsRevealed === 1 && fraction >= HINT_FRACTION_2) {
          this.hintsRevealed = 2;
          this.sendHint();
        }
      }

      if (this.timeLeft <= 0) {
        this.clearTimers();
        this.endRound();
      }
    }, 1000);
  }

  private sendHint(): void {
    if (!this.currentWord) return;

    const word = this.currentWord.word;
    const indices: number[] = [];

    // Collect letter indices (skip spaces and special chars)
    for (let i = 0; i < word.length; i++) {
      if (/[a-zA-Z0-9]/.test(word[i])) {
        indices.push(i);
      }
    }

    // Reveal some letters
    const revealCount = Math.ceil(indices.length * (this.hintsRevealed * 0.2));
    const shuffled = indices.sort(() => Math.random() - 0.5);
    const revealIndices = new Set(shuffled.slice(0, revealCount));

    let revealed = '';
    for (let i = 0; i < word.length; i++) {
      if (word[i] === ' ') {
        revealed += ' ';
      } else if (!/[a-zA-Z0-9]/.test(word[i])) {
        revealed += word[i]; // show special chars
      } else if (revealIndices.has(i)) {
        revealed += word[i];
      } else {
        revealed += '_';
      }
    }

    this.room.emit('hint', { revealed });
  }

  handleDraw(socketId: string, event: DrawEvent): void {
    if (this.state !== GameState.DRAWING) return;
    const drawerId = this.turnOrder[this.currentTurnIndex];
    if (socketId !== drawerId) return;

    this.drawEvents.push(event);
    // Broadcast to everyone else in the room
    this.io.to(this.code).except(socketId).emit('draw', event);
  }

  handleGuess(socketId: string, message: string): void {
    if (this.state !== GameState.DRAWING) return;
    if (!this.currentWord) return;

    const player = this.players.get(socketId);
    if (!player) return;
    if (player.isDrawing) return;  // drawer can't guess
    if (player.hasGuessed) return; // already guessed correctly

    const trimmed = message.trim();
    if (!trimmed) return;

    // Check for correct guess
    if (isCorrectGuess(trimmed, this.currentWord.word)) {
      player.hasGuessed = true;

      const elapsedMs = Date.now() - this.drawingStartTime;
      const totalMs = this.settings.drawTime * 1000;
      const points = calculateGuesserPoints(elapsedMs, totalMs);
      player.score += points;

      const drawerId = this.turnOrder[this.currentTurnIndex];
      const drawer = this.players.get(drawerId);
      if (drawer) {
        drawer.score += calculateDrawerPoints(1);
      }

      const scores: ScoreUpdate[] = [
        { playerId: player.id, points, totalScore: player.score },
      ];
      if (drawer) {
        scores.push({
          playerId: drawer.id,
          points: calculateDrawerPoints(1),
          totalScore: drawer.score,
        });
      }

      this.room.emit('correct-guess', { player: player.nickname, scores });

      // System message
      this.room.emit('chat-message', {
        id: Date.now().toString(),
        sender: 'system',
        text: `${player.nickname} guessed correctly!`,
        type: 'correct',
        timestamp: Date.now(),
      });

      // Check if everyone has guessed
      const nonDrawers = this.getPlayersArray().filter((p) => !p.isDrawing);
      const allGuessed = nonDrawers.every((p) => p.hasGuessed);
      if (allGuessed) {
        this.clearTimers();
        this.endRound();
      }

      return;
    }

    // Check for close guess
    if (isCloseGuess(trimmed, this.currentWord.word)) {
      this.toSocket(socketId).emit('close-guess');
      // Still show the message to others as a normal chat
    }

    // Broadcast as a regular chat message
    this.room.emit('chat-message', {
      id: Date.now().toString() + socketId,
      sender: player.nickname,
      text: trimmed,
      type: 'guess',
      timestamp: Date.now(),
    });
  }

  private endRound(): void {
    this.state = GameState.ROUND_END;
    this.clearTimers();

    const drawerId = this.turnOrder[this.currentTurnIndex];
    const drawer = this.players.get(drawerId);

    const result: RoundResult = {
      word: this.currentWord?.word || '???',
      category: this.currentWord?.category || WordCategory.HEROES,
      imageUrl: this.currentWord?.imageUrl,
      drawerId,
      drawerNickname: drawer?.nickname || 'Unknown',
      guessers: this.getPlayersArray()
        .filter((p) => p.hasGuessed)
        .map((p) => ({
          nickname: p.nickname,
          points: 0, // simplified — the points were already added
          timeMs: 0,
        })),
    };

    this.roundResults.push(result);
    this.room.emit('round-end', result);

    // Move to next turn after delay
    this.roundEndTimer = setTimeout(() => {
      this.nextTurn();
    }, ROUND_END_TIME);
  }

  private nextTurn(): void {
    this.currentTurnIndex++;

    // If we've gone through all players, advance the round
    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.currentTurnIndex = 0;
      this.currentRound++;

      if (this.currentRound > this.settings.totalRounds) {
        this.endGame();
        return;
      }
    }

    // Skip disconnected players
    const drawerId = this.turnOrder[this.currentTurnIndex];
    if (!this.players.has(drawerId)) {
      if (this.players.size < 2) {
        this.endGame();
        return;
      }
      this.nextTurn();
      return;
    }

    this.startPickPhase();
  }

  private endGame(): void {
    this.state = GameState.GAME_OVER;
    this.clearTimers();

    const finalScores = this.getPlayersArray().sort((a, b) => b.score - a.score);

    this.room.emit('game-over', {
      finalScores,
      rounds: this.roundResults,
    });
  }

  playAgain(): void {
    this.state = GameState.LOBBY;
    this.currentRound = 0;
    this.roundResults = [];
    this.usedWords.clear();
    this.drawEvents = [];
    this.currentWord = null;

    for (const p of this.players.values()) {
      p.score = 0;
      p.hasGuessed = false;
      p.isDrawing = false;
    }

    this.room.emit('game-started', { state: GameState.LOBBY });
  }

  // ---- Timer cleanup ----

  private clearTimer(which: 'pick' | 'draw' | 'roundEnd'): void {
    if (which === 'pick' && this.pickTimer) {
      clearTimeout(this.pickTimer);
      this.pickTimer = null;
    }
    if (which === 'draw' && this.drawTimer) {
      clearInterval(this.drawTimer);
      this.drawTimer = null;
    }
    if (which === 'roundEnd' && this.roundEndTimer) {
      clearTimeout(this.roundEndTimer);
      this.roundEndTimer = null;
    }
  }

  clearTimers(): void {
    this.clearTimer('pick');
    this.clearTimer('draw');
    this.clearTimer('roundEnd');
  }

  destroy(): void {
    this.clearTimers();
    this.players.clear();
  }
}
