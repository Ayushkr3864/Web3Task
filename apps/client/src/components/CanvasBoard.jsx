import { useEffect, useMemo, useRef, useState } from "react";

const COLORS = ["#111827", "#ef4444", "#f59e0b", "#10b981", "#2563eb", "#7c3aed"];

function drawStroke(context, stroke) {
  if (!stroke.points.length) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = stroke.size;
  context.strokeStyle = stroke.tool === "eraser" ? "#f8fafc" : stroke.color;
  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);

  stroke.points.slice(1).forEach((point) => {
    context.lineTo(point.x, point.y);
  });

  context.stroke();
  context.restore();
}

export default function CanvasBoard({
  roomState,
  isDrawer,
  onSendStroke,
  onUndo,
  onClear,
}) {
  const canvasRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const [brushColor, setBrushColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(6);
  const [tool, setTool] = useState("brush");

  const roomCode = roomState.roomCode;
  const canDraw = isDrawer && roomState.round.phase === "drawing";
  const strokes = useMemo(() => roomState.strokes ?? [], [roomState.strokes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((stroke) => drawStroke(context, stroke));
  }, [strokes]);

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * canvas.width,
      y: ((event.clientY - bounds.top) / bounds.height) * canvas.height,
    };
  };

  const handlePointerDown = (event) => {
    if (!canDraw) {
      return;
    }

    const point = getCanvasPoint(event);
    currentStrokeRef.current = {
      id: crypto.randomUUID(),
      color: brushColor,
      size: brushSize,
      tool,
      points: [point],
    };
  };

  const handlePointerMove = (event) => {
    if (!canDraw || !currentStrokeRef.current) {
      return;
    }

    currentStrokeRef.current = {
      ...currentStrokeRef.current,
      points: [...currentStrokeRef.current.points, getCanvasPoint(event)],
    };

    onSendStroke(roomCode, currentStrokeRef.current);
  };

  const handlePointerUp = () => {
    if (canDraw && currentStrokeRef.current) {
      onSendStroke(roomCode, currentStrokeRef.current);
    }
    currentStrokeRef.current = null;
  };

  return (
    <div className="canvas-panel">
      <div className="canvas-toolbar">
        <div className="color-row">
          {COLORS.map((color) => (
            <button
              key={color}
              className={`color-swatch${brushColor === color ? " active" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setTool("brush");
                setBrushColor(color);
              }}
            />
          ))}
        </div>

        <div className="toolbar-controls">
          <button className={tool === "brush" ? "active-chip" : ""} onClick={() => setTool("brush")}>
            Brush
          </button>
          <button className={tool === "eraser" ? "active-chip" : ""} onClick={() => setTool("eraser")}>
            Eraser
          </button>
          <label className="range-label">
            Size
            <input type="range" min="2" max="22" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} />
          </label>
          <button onClick={() => onUndo(roomCode)} disabled={!canDraw}>
            Undo
          </button>
          <button onClick={() => onClear(roomCode)} disabled={!canDraw}>
            Clear
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className={`board${canDraw ? " board-live" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
