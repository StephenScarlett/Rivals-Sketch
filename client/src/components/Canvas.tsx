import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import type { DrawEvent, DrawStroke } from '../../../shared/types';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
  '#92400e', '#065f46', '#1e3a5f', '#581c87', '#be185d',
];

const BRUSH_SIZES = [3, 6, 10, 16, 24];

interface CanvasProps {
  isDrawer: boolean;
  drawEvents: DrawEvent[];
  onDraw: (event: DrawEvent) => void;
  roundKey: number;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(function Canvas(
  { isDrawer, drawEvents, onDraw, roundKey },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<{ x: number; y: number }[]>([]);
  const strokeHistoryRef = useRef<DrawEvent[]>([]);

  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'fill'>('brush');

  useImperativeHandle(ref, () => canvasRef.current!);

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext('2d') ?? null;
  }, []);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [getCtx]);

  // Draw a single stroke on the canvas
  const drawStroke = useCallback(
    (stroke: DrawStroke) => {
      const ctx = getCtx();
      if (!ctx || stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    },
    [getCtx]
  );

  // Flood fill
  const floodFill = useCallback(
    (startX: number, startY: number, fillColor: string) => {
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!canvas || !ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const sx = Math.round(startX);
      const sy = Math.round(startY);
      if (sx < 0 || sx >= w || sy < 0 || sy >= h) return;

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      const startIdx = (sy * w + sx) * 4;
      const tR = data[startIdx], tG = data[startIdx + 1], tB = data[startIdx + 2], tA = data[startIdx + 3];

      // Parse fill color to RGB
      const tmp = document.createElement('canvas');
      tmp.width = tmp.height = 1;
      const tc = tmp.getContext('2d')!;
      tc.fillStyle = fillColor;
      tc.fillRect(0, 0, 1, 1);
      const fd = tc.getImageData(0, 0, 1, 1).data;
      const [fR, fG, fB] = [fd[0], fd[1], fd[2]];

      if (tR === fR && tG === fG && tB === fB && tA === 255) return;

      const tolerance = 32;
      const match = (i: number) =>
        Math.abs(data[i] - tR) <= tolerance &&
        Math.abs(data[i + 1] - tG) <= tolerance &&
        Math.abs(data[i + 2] - tB) <= tolerance &&
        Math.abs(data[i + 3] - tA) <= tolerance;

      const visited = new Uint8Array(w * h);
      const stack: number[] = [sx, sy];

      while (stack.length > 0) {
        const cy = stack.pop()!;
        const cx = stack.pop()!;
        if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
        const pi = cy * w + cx;
        if (visited[pi]) continue;
        const i = pi * 4;
        if (!match(i)) continue;

        visited[pi] = 1;
        data[i] = fR;
        data[i + 1] = fG;
        data[i + 2] = fB;
        data[i + 3] = 255;

        stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
      }

      ctx.putImageData(imageData, 0, 0);
    },
    [getCtx]
  );

  // Replay all strokes from history
  const replayAll = useCallback(() => {
    clearCanvas();
    for (const event of strokeHistoryRef.current) {
      if (event.type === 'stroke' && event.stroke) {
        drawStroke(event.stroke);
      } else if (event.type === 'fill' && event.fillColor && event.fillPoint) {
        floodFill(event.fillPoint.x, event.fillPoint.y, event.fillColor);
      } else if (event.type === 'clear') {
        clearCanvas();
      }
    }
  }, [clearCanvas, drawStroke, floodFill]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 800;
    canvas.height = 600;
    clearCanvas();
  }, [clearCanvas]);

  // Clear canvas on new round
  useEffect(() => {
    if (roundKey > 0) {
      clearCanvas();
      strokeHistoryRef.current = [];
    }
  }, [roundKey, clearCanvas]);

  // Process incoming draw events (from other players)
  useEffect(() => {
    if (isDrawer) return;

    for (const event of drawEvents) {
      if (event.type === 'stroke' && event.stroke) {
        drawStroke(event.stroke);
        strokeHistoryRef.current.push(event);
      } else if (event.type === 'fill' && event.fillColor && event.fillPoint) {
        floodFill(event.fillPoint.x, event.fillPoint.y, event.fillColor);
        strokeHistoryRef.current.push(event);
      } else if (event.type === 'clear') {
        clearCanvas();
        strokeHistoryRef.current = [];
      } else if (event.type === 'undo') {
        strokeHistoryRef.current.pop();
        replayAll();
      }
    }
  }, [drawEvents, isDrawer, drawStroke, clearCanvas, replayAll, floodFill]);

  // Get mouse position relative to canvas
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();

    if (tool === 'fill') {
      const pos = getPos(e);
      floodFill(pos.x, pos.y, color);
      const event: DrawEvent = {
        type: 'fill',
        fillColor: color,
        fillPoint: pos,
      };
      strokeHistoryRef.current.push(event);
      onDraw(event);
      return;
    }

    isDrawingRef.current = true;
    const pos = getPos(e);
    currentStrokeRef.current = [pos];

    const ctx = getCtx();
    if (ctx) {
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer || !isDrawingRef.current) return;
    e.preventDefault();
    const pos = getPos(e);
    currentStrokeRef.current.push(pos);

    const ctx = getCtx();
    if (ctx) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentStrokeRef.current.length > 0) {
      const event: DrawEvent = {
        type: 'stroke',
        stroke: {
          points: currentStrokeRef.current,
          color,
          width: brushSize,
          tool: tool === 'eraser' ? 'eraser' : 'brush',
        },
      };
      strokeHistoryRef.current.push(event);
      onDraw(event);
      currentStrokeRef.current = [];
    }
  };

  const handleClear = () => {
    clearCanvas();
    strokeHistoryRef.current = [];
    onDraw({ type: 'clear' });
  };

  const handleUndo = () => {
    if (strokeHistoryRef.current.length === 0) return;
    strokeHistoryRef.current.pop();
    replayAll();
    onDraw({ type: 'undo' });
  };

  // Keyboard shortcut for undo
  useEffect(() => {
    if (!isDrawer) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // Scroll to change brush size
  useEffect(() => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      setBrushSize((prev) => {
        const idx = BRUSH_SIZES.indexOf(prev);
        if (e.deltaY < 0 && idx < BRUSH_SIZES.length - 1) return BRUSH_SIZES[idx + 1];
        if (e.deltaY > 0 && idx > 0) return BRUSH_SIZES[idx - 1];
        return prev;
      });
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border-2 border-[var(--color-border)] bg-white">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none"
          style={{ aspectRatio: '4/3' }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />
        {!isDrawer && (
          <div className="absolute inset-0 cursor-default" />
        )}
      </div>

      {/* Toolbar (drawer only) */}
      {isDrawer && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          {/* Colors */}
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool('brush');
                }}
                className={`w-7 h-7 rounded-full border-2 transition ${
                  color === c && tool === 'brush'
                    ? 'border-purple-400 scale-110'
                    : 'border-[var(--color-border)]'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-8 bg-[var(--color-border)]" />

          {/* Brush sizes */}
          <div className="flex gap-1.5 items-center">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition ${
                  brushSize === size
                    ? 'bg-purple-600'
                    : 'bg-[var(--color-surface-light)] hover:bg-[var(--color-border)]'
                }`}
              >
                <div
                  className="rounded-full bg-current"
                  style={{ width: Math.min(size, 20), height: Math.min(size, 20) }}
                />
              </button>
            ))}
          </div>

          <div className="w-px h-8 bg-[var(--color-border)]" />

          {/* Tools */}
          <button
            onClick={() => setTool('brush')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tool === 'brush'
                ? 'bg-purple-600 text-white'
                : 'bg-[var(--color-surface-light)] hover:bg-[var(--color-border)]'
            }`}
          >
            🖌️ Brush
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tool === 'eraser'
                ? 'bg-purple-600 text-white'
                : 'bg-[var(--color-surface-light)] hover:bg-[var(--color-border)]'
            }`}
          >
            🧹 Eraser
          </button>
          <button
            onClick={() => setTool('fill')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              tool === 'fill'
                ? 'bg-purple-600 text-white'
                : 'bg-[var(--color-surface-light)] hover:bg-[var(--color-border)]'
            }`}
          >
            🪣 Fill
          </button>
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--color-surface-light)] hover:bg-[var(--color-border)] transition"
          >
            ↩ Undo
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
          >
            🗑️ Clear
          </button>
        </div>
      )}
    </div>
  );
});

export default Canvas;
