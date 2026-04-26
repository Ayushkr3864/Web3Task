import { useEffect, useMemo, useRef, useState } from "react";

const COLORS = [
  { name: "Blue", value: "#3498db", className: "bg-crayon-blue" },
  { name: "Red", value: "#e74c3c", className: "bg-crayon-red" },
  { name: "Yellow", value: "#f1c40f", className: "bg-crayon-yellow" },
  { name: "Green", value: "#2ecc71", className: "bg-crayon-green" },
  { name: "Orange", value: "#e67e22", className: "bg-crayon-orange" },
];

function drawStroke(context, stroke) {
  if (!stroke.points.length) {
    return;
  }

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = stroke.size;
  context.strokeStyle = stroke.tool === "eraser" ? "#fefce8" : stroke.color;
  context.beginPath();
  context.moveTo(stroke.points[0].x, stroke.points[0].y);

  stroke.points.slice(1).forEach((point) => {
    context.lineTo(point.x, point.y);
  });

  context.stroke();
  context.restore();
}

export default function CanvasBoard({ roomState, isDrawer, onSendStroke, onUndo, onClear }) {
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
    context.fillStyle = "#fefce8";
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
      color: brushColor.value,
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
    <div className="rounded-2xl border-4 border-black bg-white p-5 shadow-lg">
      <div className="mb-4 grid gap-4">
        <div className="flex flex-wrap gap-3">
          {COLORS.map((color) => (
            <button
              key={color.value}
              aria-label={color.name}
              className={`h-11 w-11 rounded-2xl border-4 border-black shadow-md ${color.className} ${
                brushColor.value === color.value ? "scale-105" : ""
              }`}
              onClick={() => {
                setTool("brush");
                setBrushColor(color);
              }}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className={`rounded-xl border-4 border-black px-4 py-3 text-xl text-gray-900 shadow-md ${
              tool === "brush" ? "bg-crayon-blue text-white" : "bg-yellow-50"
            }`}
            onClick={() => setTool("brush")}
          >
            Brush
          </button>
          <button
            className={`rounded-xl border-4 border-black px-4 py-3 text-xl text-gray-900 shadow-md ${
              tool === "eraser" ? "bg-crayon-red text-white" : "bg-yellow-50"
            }`}
            onClick={() => setTool("eraser")}
          >
            Eraser
          </button>
          <label className="flex items-center gap-3 rounded-2xl border-2 border-gray-800 bg-yellow-50 px-4 py-3 text-xl text-gray-900 shadow-md">
            <span>Size</span>
            <input
              className="w-36 accent-crayon-orange"
              type="range"
              min="2"
              max="22"
              value={brushSize}
              onChange={(event) => setBrushSize(Number(event.target.value))}
            />
          </label>
          <button
            className="rounded-xl border-4 border-black bg-crayon-yellow px-4 py-3 text-xl text-gray-900 shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onUndo(roomCode)}
            disabled={!canDraw}
          >
            Undo
          </button>
          <button
            className="rounded-xl border-4 border-black bg-crayon-orange px-4 py-3 text-xl text-gray-900 shadow-md disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onClear(roomCode)}
            disabled={!canDraw}
          >
            Clear
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className={`w-full rounded-2xl border-4 border-black bg-yellow-50 shadow-md ${canDraw ? "ring-4 ring-crayon-blue/40" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
}
