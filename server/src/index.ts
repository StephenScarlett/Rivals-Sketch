import dotenv from 'dotenv';
import path from 'path';

// In dev, .env is in server/; in prod build, __dirname is server/dist/server/src/
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // prod build
dotenv.config({ path: path.resolve(__dirname, '../.env') });       // dev (ts-node)

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './gameManager';
import { loadWordBank } from './wordBank';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors({ origin: IS_PROD ? true : CLIENT_URL }));

// Serve static client build in production
if (IS_PROD) {
  const clientDist = path.join(__dirname, '../../../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: IS_PROD ? true : CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

async function start() {
  // Load word bank (from API or fallback)
  await loadWordBank();
  console.log('[Rivals Sketch] Word bank loaded');

  // Initialize game manager
  const gameManager = new GameManager(io);
  gameManager.init();

  httpServer.listen(PORT, () => {
    console.log(`[Rivals Sketch] Server running on port ${PORT}`);
  });
}

start().catch(console.error);
