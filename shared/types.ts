// ============================================================
// Rivals Sketch — Shared Types (client + server)
// ============================================================

export enum GameState {
  LOBBY = 'LOBBY',
  PICKING_WORD = 'PICKING_WORD',
  DRAWING = 'DRAWING',
  ROUND_END = 'ROUND_END',
  GAME_OVER = 'GAME_OVER',
}

export enum WordCategory {
  HEROES = 'Heroes',
  ABILITIES = 'Abilities',
  MAPS = 'Maps',
  SKINS = 'Skins',
  TEAM_UPS = 'Team-Ups',
  WEAPONS = 'Weapons & Items',
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

// ---- Player & Room ----

export interface Player {
  id: string;          // socket id
  nickname: string;
  score: number;
  hasGuessed: boolean; // true once they guess correctly this round
  isHost: boolean;
  isDrawing: boolean;
  isConnected: boolean;
}

export interface RoomSettings {
  maxPlayers: number;    // 2-12
  totalRounds: number;   // 1-5
  drawTime: number;      // seconds: 60, 90, 120
  categories: WordCategory[];
}

export interface RoomInfo {
  code: string;
  players: Player[];
  settings: RoomSettings;
  state: GameState;
  currentRound: number;
  currentDrawerIndex: number;
  hostId: string;
}

// ---- Word / Prompt ----

export interface WordOption {
  word: string;
  category: WordCategory;
  difficulty: Difficulty;
  imageUrl?: string;     // reference image for the drawer
}

// ---- Drawing ----

export interface DrawStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: 'brush' | 'eraser';
}

export interface DrawEvent {
  type: 'stroke' | 'fill' | 'clear' | 'undo';
  stroke?: DrawStroke;
  fillColor?: string;
  fillPoint?: { x: number; y: number };
}

// ---- Chat ----

export interface ChatMessage {
  id: string;
  sender: string;       // nickname or 'system'
  text: string;
  type: 'guess' | 'correct' | 'close' | 'system' | 'chat';
  timestamp: number;
}

// ---- Scoring ----

export interface ScoreUpdate {
  playerId: string;
  points: number;
  totalScore: number;
}

// ---- Round Summary ----

export interface RoundResult {
  word: string;
  category: WordCategory;
  imageUrl?: string;
  drawerId: string;
  drawerNickname: string;
  guessers: { nickname: string; points: number; timeMs: number }[];
}

// ---- Socket.io Event Payloads ----

export interface ServerToClientEvents {
  'room-created': (data: { roomCode: string }) => void;
  'player-joined': (data: { players: Player[] }) => void;
  'player-left': (data: { players: Player[]; leftPlayer: string }) => void;
  'settings-updated': (data: { settings: RoomSettings }) => void;
  'game-started': (data: { state: GameState }) => void;
  'pick-words': (data: { words: WordOption[] }) => void;
  'drawing-start': (data: {
    drawer: Player;
    wordLength: number;
    category: WordCategory;
    round: number;
    totalRounds: number;
    drawTime: number;
  }) => void;
  'draw': (data: DrawEvent) => void;
  'correct-guess': (data: { player: string; scores: ScoreUpdate[] }) => void;
  'close-guess': () => void;
  'hint': (data: { revealed: string }) => void;
  'timer': (data: { timeLeft: number }) => void;
  'round-end': (data: RoundResult) => void;
  'game-over': (data: { finalScores: Player[]; rounds: RoundResult[] }) => void;
  'chat-message': (data: ChatMessage) => void;
  'host-changed': (data: { hostId: string }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'create-room': (data: { nickname: string; settings?: Partial<RoomSettings> }) => void;
  'join-room': (data: { roomCode: string; nickname: string }) => void;
  'update-settings': (data: { settings: Partial<RoomSettings> }) => void;
  'start-game': () => void;
  'pick-word': (data: { word: string }) => void;
  'draw': (data: DrawEvent) => void;
  'guess': (data: { message: string }) => void;
  'chat': (data: { message: string }) => void;
  'leave-room': () => void;
  'play-again': () => void;
}
