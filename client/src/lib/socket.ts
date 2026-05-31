import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../../../shared/types';

const URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL, {
  autoConnect: false,
});
