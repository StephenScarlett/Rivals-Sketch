import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Game from './pages/Game';
import { useSocket } from './hooks/useSocket';

export default function App() {
  const { roomCode, createRoom, joinRoom } = useSocket();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/'
          element={
            <Home
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              roomCode={roomCode}
            />
          }
        />
        <Route path='/game/:code' element={<Game />} />
      </Routes>
    </BrowserRouter>
  );
}
