"use client";
import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { cn } from "@/lib/cn";

export interface Vec2 {
  x: number;
  y: number;
}

export interface ArrowProps {
  from?: Vec2;
  to: Vec2;
  color?: string;
  label?: string;
  dashed?: boolean;
  width?: number;
  labelOffset?: Vec2;
  showTip?: boolean;
  // Stable id for interactive (draggable) arrows.
  id?: string;
}

export interface GridLine {
  from: Vec2;
  to: Vec2;
  color?: string;
  width?: number;
  dashed?: boolean;
}

export interface PolygonProps {
  points: Vec2[];
  fill?: string;
  stroke?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  strokeDasharray?: string;
}

export interface DraggablePoint {
  id: string;
  pos: Vec2;
  color?: string;
  radius?: number;
  label?: string;
}

export interface VectorCanvasProps {
  width?: number;
  height?: number;
  worldSize?: number; // half-size of world coords (default 10, so world is -10..10)
  showGrid?: boolean;
  showAxes?: boolean;
  showOrigin?: boolean;
  gridStep?: number;
  background?: boolean;
  className?: string;
  arrows?: ArrowProps[];
  polygons?: PolygonProps[];
  gridLines?: GridLine[]; // for warping the grid under a transform
  // Mouse interaction: when set, the canvas becomes draggable; callback receives
  // the world-space coordinate of the pointer.
  onPointerMove?: (world: Vec2) => void;
  onPointerDown?: (world: Vec2) => void;
  onPointerUp?: (world: Vec2) => void;
  // Draggable elements: the canvas will translate drag into world-space and
  // call the matching callback with the id + new world coords.
  draggableArrows?: ArrowProps[];
  onArrowDrag?: (id: string, to: Vec2) => void;
  draggablePoints?: DraggablePoint[];
  onPointDrag?: (id: string, pos: Vec2) => void;
  // Optional world-coord clamp: dragging a point/arrow respects these bounds.
  clamp?: { min: Vec2; max: Vec2 };
  ariaLabel?: string;
  children?: React.ReactNode;
}

// Convert world coords to pixel coords
export function worldToPixel(
  p: Vec2,
  size: number,
  worldSize: number,
): { x: number; y: number } {
  const scale = size / (2 * worldSize);
  return {
    x: size / 2 + p.x * scale,
    y: size / 2 - p.y * scale, // flip y so up is positive
  };
}

export function pixelToWorld(
  p: { x: number; y: number },
  size: number,
  worldSize: number,
): Vec2 {
  const scale = size / (2 * worldSize);
  return {
    x: (p.x - size / 2) / scale,
    y: (size / 2 - p.y) / scale,
  };
}

function clampWorld(p: Vec2, clamp?: { min: Vec2; max: Vec2 }): Vec2 {
  if (!clamp) return p;
  return {
    x: Math.max(clamp.min.x, Math.min(clamp.max.x, p.x)),
    y: Math.max(clamp.min.y, Math.min(clamp.max.y, p.y)),
  };
}

function Arrow({
  from = { x: 0, y: 0 },
  to,
  color = "var(--vector)",
  label,
  dashed = false,
  width = 2,
  labelOffset = { x: 0, y: 0 },
  showTip = true,
  size,
  worldSize,
}: ArrowProps & { size: number; worldSize: number }) {
  const a = worldToPixel(from, size, worldSize);
  const b = worldToPixel(to, size, worldSize);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return null;
  const ux = dx / len;
  const uy = dy / len;
  const tipLen = Math.max(8, width * 5);
  const tipBack = { x: b.x - ux * tipLen, y: b.y - uy * tipLen };
  const perpX = -uy;
  const perpY = ux;
  const tipHalfWidth = tipLen * 0.45;
  const tipLeft = {
    x: tipBack.x + perpX * tipHalfWidth,
    y: tipBack.y + perpY * tipHalfWidth,
  };
  const tipRight = {
    x: tipBack.x - perpX * tipHalfWidth,
    y: tipBack.y - perpY * tipHalfWidth,
  };
  const labelPos = worldToPixel(
    {
      x: (to.x + from.x) / 2 + labelOffset.x,
      y: (to.y + from.y) / 2 + labelOffset.y,
    },
    size,
    worldSize,
  );
  return (
    <g>
      <line
        x1={a.x}
        y1={a.y}
        x2={tipBack.x}
        y2={tipBack.y}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? "4 4" : undefined}
      />
      {showTip && (
        <polygon
          points={`${b.x},${b.y} ${tipLeft.x},${tipLeft.y} ${tipRight.x},${tipRight.y}`}
          fill={color}
        />
      )}
      {label && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          fill={color}
          fontSize="11"
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ pointerEvents: "none" }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Polygon({
  points,
  fill,
  stroke,
  fillOpacity = 0.2,
  strokeWidth = 1.5,
  strokeDasharray,
  size,
  worldSize,
}: PolygonProps & { size: number; worldSize: number }) {
  if (points.length < 2) return null;
  const pts = points.map((p) => worldToPixel(p, size, worldSize));
  const d = pts.map((p) => `${p.x},${p.y}`).join(" ");
  return (
    <polygon
      points={d}
      fill={fill}
      fillOpacity={fillOpacity}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
    />
  );
}

function GridLine({
  from,
  to,
  color = "var(--ink-faint)",
  width = 0.5,
  dashed = false,
  size,
  worldSize,
}: GridLine & { size: number; worldSize: number }) {
  const a = worldToPixel(from, size, worldSize);
  const b = worldToPixel(to, size, worldSize);
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dashed ? "2 4" : undefined}
      opacity={0.5}
    />
  );
}

export function VectorCanvas({
  width = 480,
  height = 480,
  worldSize = 10,
  showGrid = true,
  showAxes = true,
  showOrigin = true,
  gridStep = 1,
  background = true,
  className,
  arrows = [],
  polygons = [],
  gridLines = [],
  onPointerMove,
  onPointerDown,
  onPointerUp,
  draggableArrows,
  onArrowDrag,
  draggablePoints,
  onPointDrag,
  clamp,
  ariaLabel = "Interactive vector canvas",
  children,
}: VectorCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<Vec2 | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const grid = useMemo<GridLine[]>(() => {
    if (!showGrid) return [];
    const out: GridLine[] = [];
    for (let i = -worldSize; i <= worldSize; i += gridStep) {
      if (Math.abs(i) < 0.001) continue;
      out.push({
        from: { x: -worldSize, y: i },
        to: { x: worldSize, y: i },
      });
      out.push({
        from: { x: i, y: -worldSize },
        to: { x: i, y: worldSize },
      });
    }
    return out;
  }, [showGrid, worldSize, gridStep]);

  const eventToWorld = useCallback(
    (e: React.PointerEvent<SVGSVGElement>): Vec2 | null => {
      if (!svgRef.current) return null;
      const rect = svgRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const vbX = (px / rect.width) * width;
      const vbY = (py / rect.height) * height;
      return pixelToWorld({ x: vbX, y: vbY }, width, worldSize);
    },
    [width, height, worldSize],
  );

  const handlePointerEvent = useCallback(
    (e: React.PointerEvent<SVGSVGElement>, handler?: (w: Vec2) => void) => {
      const w = eventToWorld(e);
      if (w) handler?.(w);
    },
    [eventToWorld],
  );

  // Drag handling: pointerdown on a draggable element captures, pointermove
  // updates the world position, pointerup releases.
  const onSvgPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (onPointerDown && !onArrowDrag && !onPointDrag) {
        handlePointerEvent(e, onPointerDown);
        return;
      }
      const target = e.target as Element;
      const draggableId = target.getAttribute("data-drag-id");
      if (draggableId) {
        e.preventDefault();
        setDragId(draggableId);
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } else {
        handlePointerEvent(e, onPointerDown);
      }
    },
    [eventToWorld, onArrowDrag, onPointDrag, onPointerDown],
  );

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const w = eventToWorld(e);
      if (!w) return;
      if (dragId) {
        const cw = clampWorld(w, clamp);
        if (onArrowDrag) onArrowDrag(dragId, cw);
        if (onPointDrag) onPointDrag(dragId, cw);
        return;
      }
      if (onPointerMove) setHover(w);
      onPointerMove?.(w);
    },
    [eventToWorld, dragId, onArrowDrag, onPointDrag, onPointerMove, clamp],
  );

  const onSvgPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragId) {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
        setDragId(null);
        return;
      }
      handlePointerEvent(e, onPointerUp);
    },
    [dragId, onPointerUp, eventToWorld],
  );

  // Keyboard accessibility for draggable points/arrows: arrow keys nudge.
  const handleDragKey = useCallback(
    (id: string, isArrow: boolean, current: Vec2, e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 0.5 : 0.1;
      let next: Vec2 | null = null;
      switch (e.key) {
        case "ArrowLeft":
          next = { ...current, x: current.x - step };
          break;
        case "ArrowRight":
          next = { ...current, x: current.x + step };
          break;
        case "ArrowUp":
          next = { ...current, y: current.y + step };
          break;
        case "ArrowDown":
          next = { ...current, y: current.y - step };
          break;
      }
      if (next) {
        e.preventDefault();
        const cw = clampWorld(next, clamp);
        if (isArrow && onArrowDrag) onArrowDrag(id, cw);
        if (!isArrow && onPointDrag) onPointDrag(id, cw);
      }
    },
    [clamp, onArrowDrag, onPointDrag],
  );

  const cursor = dragId
    ? "grabbing"
    : onPointerMove || onArrowDrag || onPointDrag
      ? "crosshair"
      : "default";

  return (
    <div
      className={cn("relative inline-block select-none", className)}
      style={{ width, height, touchAction: "none" }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={cn(
          "rounded-lg border border-line touch-none",
          background && "bg-canvas",
        )}
        style={{ width, height, display: "block", cursor }}
        role="img"
        aria-label={ariaLabel}
        onPointerDown={onSvgPointerDown}
        onPointerUp={onSvgPointerUp}
        onPointerMove={onSvgPointerMove}
        onPointerLeave={() => {
          setHover(null);
          setDragId(null);
        }}
      >
        <title>{ariaLabel}</title>

        {/* Background grid */}
        {showGrid &&
          grid.map((g, i) => (
            <GridLine key={`bg-${i}`} {...g} size={width} worldSize={worldSize} />
          ))}

        {/* User-provided grid lines */}
        {gridLines.map((g, i) => (
          <GridLine key={`gl-${i}`} {...g} size={width} worldSize={worldSize} />
        ))}

        {/* Axes */}
        {showAxes && (
          <>
            <line
              x1={0}
              y1={height / 2}
              x2={width}
              y2={height / 2}
              stroke="var(--ink-dim)"
              strokeWidth={1}
            />
            <line
              x1={width / 2}
              y1={0}
              x2={width / 2}
              y2={height}
              stroke="var(--ink-dim)"
              strokeWidth={1}
            />
            <text
              x={width - 14}
              y={height / 2 - 8}
              fill="var(--ink-dim)"
              fontSize="11"
              textAnchor="end"
              fontFamily="ui-monospace, monospace"
              aria-hidden="true"
            >
              x
            </text>
            <text
              x={width / 2 + 8}
              y={14}
              fill="var(--ink-dim)"
              fontSize="11"
              fontFamily="ui-monospace, monospace"
              aria-hidden="true"
            >
              y
            </text>
          </>
        )}

        {/* Origin */}
        {showOrigin && (
          <circle
            cx={width / 2}
            cy={height / 2}
            r={3}
            fill="var(--ink-dim)"
            aria-hidden="true"
          />
        )}

        {/* Polygons */}
        {polygons.map((p, i) => (
          <Polygon key={`poly-${i}`} {...p} size={width} worldSize={worldSize} />
        ))}

        {/* Static arrows */}
        {arrows.map((a, i) => (
          <Arrow key={`arr-${i}`} {...a} size={width} worldSize={worldSize} />
        ))}

        {/* Draggable arrows */}
        {draggableArrows?.map((a, i) => {
          const id = a.id ?? `arrow-${i}`;
          const tip = worldToPixel(a.to, width, worldSize);
          return (
            <g key={`darr-${id}`}>
              <Arrow
                {...a}
                size={width}
                worldSize={worldSize}
              />
              <circle
                data-drag-id={id}
                cx={tip.x}
                cy={tip.y}
                r={10}
                fill="transparent"
                stroke="transparent"
                style={{
                  cursor: dragId === id ? "grabbing" : "grab",
                  pointerEvents: "all",
                }}
                role="slider"
                aria-label={a.label ?? `Draggable arrow ${id}`}
                aria-valuetext={`x ${a.to.x.toFixed(2)}, y ${a.to.y.toFixed(2)}`}
                tabIndex={0}
                onKeyDown={(e) => handleDragKey(id, true, a.to, e)}
              />
            </g>
          );
        })}

        {/* Draggable points */}
        {draggablePoints?.map((p, i) => {
          const px = worldToPixel(p.pos, width, worldSize);
          const r = p.radius ?? 7;
          return (
            <g key={`dp-${p.id}-${i}`}>
              {p.label && (
                <text
                  x={px.x + r + 6}
                  y={px.y - r - 4}
                  fill={p.color ?? "var(--ink)"}
                  fontSize="11"
                  fontFamily="ui-monospace, monospace"
                  style={{ pointerEvents: "none" }}
                >
                  {p.label}
                </text>
              )}
              <circle
                data-drag-id={p.id}
                cx={px.x}
                cy={px.y}
                r={r}
                fill={p.color ?? "var(--accent)"}
                stroke="var(--bg)"
                strokeWidth={2}
                style={{
                  cursor: dragId === p.id ? "grabbing" : "grab",
                  pointerEvents: "all",
                }}
                role="slider"
                aria-label={p.label ?? `Draggable point ${p.id}`}
                aria-valuetext={`x ${p.pos.x.toFixed(2)}, y ${p.pos.y.toFixed(2)}`}
                tabIndex={0}
                onKeyDown={(e) => handleDragKey(p.id, false, p.pos, e)}
              />
            </g>
          );
        })}

        {/* Hover crosshair */}
        {hover && onPointerMove && (
          <g pointerEvents="none" aria-hidden="true">
            <line
              x1={worldToPixel(hover, width, worldSize).x}
              y1={0}
              x2={worldToPixel(hover, width, worldSize).x}
              y2={height}
              stroke="var(--accent)"
              strokeWidth={0.5}
              strokeDasharray="2 3"
              opacity={0.5}
            />
            <line
              x1={0}
              y1={worldToPixel(hover, width, worldSize).y}
              x2={width}
              y2={worldToPixel(hover, width, worldSize).y}
              stroke="var(--accent)"
              strokeWidth={0.5}
              strokeDasharray="2 3"
              opacity={0.5}
            />
            <circle
              cx={worldToPixel(hover, width, worldSize).x}
              cy={worldToPixel(hover, width, worldSize).y}
              r={4}
              fill="var(--accent)"
            />
            <text
              x={worldToPixel(hover, width, worldSize).x + 8}
              y={worldToPixel(hover, width, worldSize).y - 8}
              fill="var(--accent)"
              fontSize="10"
              fontFamily="ui-monospace, monospace"
            >
              ({hover.x.toFixed(2)}, {hover.y.toFixed(2)})
            </text>
          </g>
        )}

        {children}
      </svg>
    </div>
  );
}