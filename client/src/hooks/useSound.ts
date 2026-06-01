import { useCallback, useEffect, useRef, useState } from 'react';

// All sounds are synthesized via Web Audio API — no external files needed.

let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

// Unlock audio on first user interaction — required by mobile browsers
function unlockAudio() {
  if (audioUnlocked) return;
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  // Play a silent buffer to fully unlock on iOS
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  audioUnlocked = true;
}

// Resume audio context on each sound play
function ensureResumed() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15,
  delay = 0,
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// --- Sound effects ---

/** Correct guess — ascending two-note chime */
function playCorrect() {
  ensureResumed();
  playTone(523, 0.15, 'sine', 0.18, 0);     // C5
  playTone(784, 0.25, 'sine', 0.18, 0.12);   // G5
}

/** Your own correct guess — triumphant three-note */
function playMyCorrect() {
  ensureResumed();
  playTone(523, 0.12, 'sine', 0.2, 0);      // C5
  playTone(659, 0.12, 'sine', 0.2, 0.1);    // E5
  playTone(784, 0.3, 'sine', 0.2, 0.2);     // G5
}

/** Timer tick — short blip for last 10 seconds */
function playTick() {
  ensureResumed();
  playTone(880, 0.08, 'square', 0.06);
}

/** Timer urgent — faster ticks for last 5 seconds */
function playTickUrgent() {
  ensureResumed();
  playTone(1100, 0.06, 'square', 0.08);
}

/** Round start — quick ascending sweep */
function playRoundStart() {
  ensureResumed();
  playTone(392, 0.1, 'sine', 0.15, 0);     // G4
  playTone(523, 0.1, 'sine', 0.15, 0.08);  // C5
  playTone(659, 0.15, 'sine', 0.15, 0.16); // E5
}

/** Game over — descending fanfare */
function playGameOver() {
  ensureResumed();
  playTone(784, 0.15, 'sine', 0.18, 0);     // G5
  playTone(659, 0.15, 'sine', 0.18, 0.15);  // E5
  playTone(523, 0.15, 'sine', 0.18, 0.3);   // C5
  playTone(784, 0.4, 'sine', 0.2, 0.5);     // G5
}

/** Join sound — soft pop */
function playJoin() {
  ensureResumed();
  playTone(600, 0.1, 'sine', 0.1);
}

export type SoundName = 'correct' | 'myCorrect' | 'tick' | 'tickUrgent' | 'roundStart' | 'gameOver' | 'join';

const SOUND_MAP: Record<SoundName, () => void> = {
  correct: playCorrect,
  myCorrect: playMyCorrect,
  tick: playTick,
  tickUrgent: playTickUrgent,
  roundStart: playRoundStart,
  gameOver: playGameOver,
  join: playJoin,
};

const MUTE_KEY = 'rivals-sound-muted';

export function useSound() {
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_KEY) === 'true');
  const mutedRef = useRef(muted);

  // Unlock audio on first user interaction (mobile requirement)
  useEffect(() => {
    const handler = () => unlockAudio();
    document.addEventListener('touchstart', handler, { once: true });
    document.addEventListener('click', handler, { once: true });
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('click', handler);
    };
  }, []);

  useEffect(() => {
    mutedRef.current = muted;
    localStorage.setItem(MUTE_KEY, String(muted));
  }, [muted]);

  const play = useCallback((name: SoundName) => {
    if (mutedRef.current) return;
    try {
      SOUND_MAP[name]();
    } catch {
      // Audio not available
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  return { muted, play, toggleMute };
}
