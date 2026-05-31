import { Server, Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
} from '../../shared/types';
import { GameRoom } from './gameRoom';

const ROOM_CODE_LENGTH = 6;
const ROOM_CLEANUP_INTERVAL = 60_000; // check every minute
const EMPTY_ROOM_TTL = 300_000;       // delete after 5 min empty

export class GameManager {
  private rooms = new Map<string, GameRoom>();
  private socketToRoom = new Map<string, string>(); // socketId → roomCode
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  init(): void {
    this.io.on('connection', (socket) => {
      console.log(`[GameManager] Client connected: ${socket.id}`);
      this.registerHandlers(socket);

      socket.on('disconnect', () => {
        console.log(`[GameManager] Client disconnected: ${socket.id}`);
        this.handleDisconnect(socket);
      });
    });

    // Periodic room cleanup
    setInterval(() => this.cleanupRooms(), ROOM_CLEANUP_INTERVAL);
  }

  private registerHandlers(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
  ): void {
    socket.on('create-room', ({ nickname, settings }) => {
      const code = this.generateRoomCode();
      const room = new GameRoom(code, this.io, settings);
      this.rooms.set(code, room);

      const player = room.addPlayer(socket, nickname);
      this.socketToRoom.set(socket.id, code);

      socket.emit('room-created', { roomCode: code });
      this.io.to(code).emit('player-joined', { players: room.getPlayersArray() });

      console.log(`[GameManager] Room ${code} created by ${nickname}`);
    });

    socket.on('join-room', ({ roomCode, nickname }) => {
      const code = roomCode.toUpperCase();
      const room = this.rooms.get(code);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.state !== GameState.LOBBY) {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      if (room.getPlayerCount() >= room.settings.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }

      room.addPlayer(socket, nickname);
      this.socketToRoom.set(socket.id, code);

      this.io.to(code).emit('player-joined', { players: room.getPlayersArray() });

      console.log(`[GameManager] ${nickname} joined room ${code}`);
    });

    socket.on('update-settings', ({ settings }) => {
      const room = this.getRoom(socket);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player?.isHost) return;

      room.updateSettings(settings);
      this.io.to(room.code).emit('settings-updated', { settings: room.settings });
    });

    socket.on('start-game', () => {
      const room = this.getRoom(socket);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player?.isHost) return;

      if (room.getPlayerCount() < 2) {
        socket.emit('error', { message: 'Need at least 2 players' });
        return;
      }

      room.startGame();
    });

    socket.on('pick-word', ({ word }) => {
      const room = this.getRoom(socket);
      if (!room) return;
      room.pickWord(socket.id, word);
    });

    socket.on('draw', (event) => {
      const room = this.getRoom(socket);
      if (!room) return;
      room.handleDraw(socket.id, event);
    });

    socket.on('guess', ({ message }) => {
      const room = this.getRoom(socket);
      if (!room) return;
      room.handleGuess(socket.id, message);
    });

    socket.on('chat', ({ message }) => {
      const room = this.getRoom(socket);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      this.io.to(room.code).emit('chat-message', {
        id: Date.now().toString() + socket.id,
        sender: player.nickname,
        text: message.trim().slice(0, 200),
        type: 'chat',
        timestamp: Date.now(),
      });
    });

    socket.on('leave-room', () => {
      this.handleDisconnect(socket);
    });

    socket.on('play-again', () => {
      const room = this.getRoom(socket);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player?.isHost) return;

      room.playAgain();
    });
  }

  private handleDisconnect(socket: Socket): void {
    const code = this.socketToRoom.get(socket.id);
    if (!code) return;

    const room = this.rooms.get(code);
    if (!room) return;

    const leftPlayer = room.removePlayer(socket.id);
    this.socketToRoom.delete(socket.id);
    socket.leave(code);

    if (room.getPlayerCount() === 0) {
      // Room will be cleaned up by interval
      return;
    }

    this.io.to(code).emit('player-left', {
      players: room.getPlayersArray(),
      leftPlayer: leftPlayer?.nickname || 'Unknown',
    });
  }

  private getRoom(socket: Socket): GameRoom | null {
    const code = this.socketToRoom.get(socket.id);
    if (!code) {
      socket.emit('error', { message: 'Not in a room' });
      return null;
    }
    const room = this.rooms.get(code);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return null;
    }
    return room;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 for clarity
    let code: string;
    do {
      code = '';
      for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  private cleanupRooms(): void {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (room.getPlayerCount() === 0) {
        room.destroy();
        this.rooms.delete(code);
        console.log(`[GameManager] Cleaned up empty room ${code}`);
      }
    }
  }
}
