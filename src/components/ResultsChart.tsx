import React, { useState } from 'react';
import { TickStep } from '../types';

interface ResultsChartProps {
  history: TickStep[];
  duration: number;
}

export const ResultsChart: React.FC<ResultsChartProps> = ({ history, duration }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!history || history.length < 2) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-sub)' }}>
        Not enough test data to display timeline graph.
      </div>
    );
  }

  const width = 800;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 30, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute maximum WPM for Y-scale
  const maxWpm = Math.max(
    60,
    Math.ceil(Math.max(...history.map(h => Math.max(h.wpm, h.rawWpm))) / 20) * 20 + 20
  );

  const pointsCount = history.length;

  const getX = (index: number) => {
    return padding.left + (index / (pointsCount - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(maxWpm, val));
    return padding.top + chartHeight - (clamped / maxWpm) * chartHeight;
  };

  // Build SVG path strings
  let wpmPath = '';
  let rawPath = '';
  let areaPath = '';

  history.forEach((point, i) => {
    const x = getX(i);
    const yWpm = getY(point.wpm);
    const yRaw = getY(point.rawWpm);

    if (i === 0) {
      wpmPath += `M ${x} ${yWpm}`;
      rawPath += `M ${x} ${yRaw}`;
      areaPath += `M ${x} ${padding.top + chartHeight} L ${x} ${yWpm}`;
    } else {
      // Smooth bezier curves
      const prevX = getX(i - 1);
      const prevYWpm = getY(history[i - 1].wpm);
      const prevYRaw = getY(history[i - 1].rawWpm);
      const cpX = (prevX + x) / 2;

      wpmPath += ` C ${cpX} ${prevYWpm}, ${cpX} ${yWpm}, ${x} ${yWpm}`;
      rawPath += ` C ${cpX} ${prevYRaw}, ${cpX} ${yRaw}, ${x} ${yRaw}`;
      areaPath += ` C ${cpX} ${prevYWpm}, ${cpX} ${yWpm}, ${x} ${yWpm}`;
    }
  });

  areaPath += ` L ${getX(pointsCount - 1)} ${padding.top + chartHeight} Z`;

  // Grid lines
  const yTicks = [0, Math.round(maxWpm / 2), maxWpm];

  const activePoint = hoverIndex !== null ? history[hoverIndex] : null;

  return (
    <div className="results-chart-container">
      <div className="chart-header">
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-main)' }}>
          Velocity & Keystroke Consistency
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-dot wpm" />
            <span>WPM</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot raw" />
            <span>Raw WPM</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot error" />
            <span>Errors</span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="svg-chart"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Grid Lines */}
        {yTicks.map(tick => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="var(--color-surface-border)"
                strokeDasharray="4,4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="var(--color-sub)"
                fontSize="11"
                textAnchor="end"
                fontFamily="var(--font-mono)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#wpmGradient)" />

        {/* Raw WPM Line */}
        <path
          d={rawPath}
          fill="none"
          stroke="var(--color-sub)"
          strokeWidth="2"
          strokeDasharray="5,3"
          opacity="0.65"
        />

        {/* WPM Line */}
        <path
          d={wpmPath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Error Markers */}
        {history.map((pt, idx) => {
          if (pt.errors > 0) {
            const x = getX(idx);
            const y = getY(pt.wpm);
            return (
              <g key={`err_${idx}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="5.5"
                  fill="var(--color-error)"
                  stroke="var(--color-bg)"
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={y - 9}
                  fill="var(--color-error)"
                  fontSize="10"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                >
                  ✕{pt.errors}
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* Hover interactive vertical line and detector hitboxes */}
        {history.map((pt, idx) => {
          const x = getX(idx);
          const colWidth = chartWidth / (pointsCount - 1);
          return (
            <rect
              key={`hitbox_${idx}`}
              x={x - colWidth / 2}
              y={padding.top}
              width={colWidth}
              height={chartHeight}
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoverIndex(idx)}
            />
          );
        })}

        {hoverIndex !== null && activePoint && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={padding.top + chartHeight}
              stroke="var(--color-main)"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              opacity="0.75"
            />
            <circle
              cx={getX(hoverIndex)}
              cy={getY(activePoint.wpm)}
              r="6"
              fill="var(--color-accent)"
              stroke="var(--color-bg)"
              strokeWidth="2.5"
            />
            <circle
              cx={getX(hoverIndex)}
              cy={getY(activePoint.rawWpm)}
              r="4.5"
              fill="var(--color-sub)"
              stroke="var(--color-bg)"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>

      {/* Hover Info Tooltip */}
      {hoverIndex !== null && activePoint && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '18px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-surface-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.4rem 0.75rem',
            fontSize: '0.82rem',
            display: 'flex',
            gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div>
            <span style={{ color: 'var(--color-sub)' }}>Second: </span>
            <strong style={{ color: 'var(--color-main)' }}>{activePoint.second}s</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-sub)' }}>WPM: </span>
            <strong style={{ color: 'var(--color-accent)' }}>{activePoint.wpm}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-sub)' }}>Raw: </span>
            <strong style={{ color: 'var(--color-sub)' }}>{activePoint.rawWpm}</strong>
          </div>
          {activePoint.errors > 0 && (
            <div>
              <span style={{ color: 'var(--color-sub)' }}>Errors: </span>
              <strong style={{ color: 'var(--color-error)' }}>{activePoint.errors}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
