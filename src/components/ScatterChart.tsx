"use client";

interface Point {
  x: number;    // timestamp
  y: number;    // value
  label: string;
}

interface ScatterChartProps {
  points: Point[];
  yLabel: string;
  color: string;
  height?: number;
  yTickFormatter?: (value: number) => string;
}

export default function ScatterChart({ points, yLabel, color, height = 140, yTickFormatter }: ScatterChartProps) {
  if (points.length === 0) return null;

  const padding = { top: 10, right: 12, bottom: 24, left: 36 };
  const width = 500;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const xMin = Math.min(...points.map((p) => p.x));
  const xMax = Math.max(...points.map((p) => p.x));
  const yMin = 0;
  const yMax = Math.max(...points.map((p) => p.y)) * 1.15;

  const xRange = xMax - xMin || 1;

  const toSvgX = (x: number) => padding.left + ((x - xMin) / xRange) * chartW;
  const toSvgY = (y: number) => padding.top + chartH - ((y - yMin) / (yMax - yMin)) * chartH;

  // Y-axis ticks
  const yTickCount = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= yTickCount; i++) {
    yTicks.push(yMin + ((yMax - yMin) / yTickCount) * i);
  }

  // X-axis: show date labels for unique days
  const dayLabels: { x: number; label: string }[] = [];
  const seenDays = new Set<string>();
  for (const p of points) {
    const d = new Date(p.x);
    const key = d.toDateString();
    if (!seenDays.has(key)) {
      seenDays.add(key);
      dayLabels.push({
        x: p.x,
        label: d.toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone: "Asia/Kolkata" }),
      });
    }
  }

  // Compute average line
  const avg = points.reduce((s, p) => s + p.y, 0) / points.length;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ height }}
    >
      {/* Grid lines */}
      {yTicks.map((v, i) => (
        <g key={`ytick-${i}`}>
          <line
            x1={padding.left}
            y1={toSvgY(v)}
            x2={width - padding.right}
            y2={toSvgY(v)}
            stroke="#e5e7eb"
            strokeWidth={0.5}
          />
          <text
            x={padding.left - 4}
            y={toSvgY(v) + 3}
            textAnchor="end"
            fontSize={9}
            fill="#9ca3af"
          >
            {yTickFormatter ? yTickFormatter(v) : v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Average line */}
      <line
        x1={padding.left}
        y1={toSvgY(avg)}
        x2={width - padding.right}
        y2={toSvgY(avg)}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      <text
        x={width - padding.right + 2}
        y={toSvgY(avg) + 3}
        fontSize={8}
        fill={color}
        opacity={0.7}
      >
        avg
      </text>

      {/* X-axis day labels */}
      {dayLabels.map((dl, i) => (
        <text
          key={`day-${i}`}
          x={toSvgX(dl.x)}
          y={height - 4}
          textAnchor="middle"
          fontSize={9}
          fill="#9ca3af"
        >
          {dl.label}
        </text>
      ))}

      {/* Connecting line */}
      {points.length > 1 && (
        <polyline
          points={points.map((p) => `${toSvgX(p.x)},${toSvgY(p.y)}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.3}
        />
      )}

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={toSvgX(p.x)}
          cy={toSvgY(p.y)}
          r={4}
          fill={color}
          opacity={0.8}
          stroke="white"
          strokeWidth={1.5}
        >
          <title>{p.label}</title>
        </circle>
      ))}
    </svg>
  );
}
