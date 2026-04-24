import React from 'react';

// -- BarChart (vertical bars) --
export function BarChart({ data = [], color = 'var(--primary)', height = 200 }) {
  if (!data.length) return <div style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '20px' }}>No data</div>;
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px`, padding: '0 4px' }}>
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-600)', marginBottom: '4px' }}>
                {typeof d.value === 'number' && d.value >= 1000 ? `${(d.value / 1000).toFixed(0)}k` : d.value}
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: '48px',
                  height: `${Math.max(pct, 2)}%`,
                  background: color,
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.3s ease',
                  opacity: 0.85,
                  minHeight: '2px',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.85'; }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '6px', padding: '8px 4px 0', borderTop: '1px solid var(--gray-200)' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: 'var(--gray-500)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// -- DonutChart (SVG) --
export function DonutChart({ data = [], size = 200 }) {
  if (!data.length) return <div style={{ color: 'var(--gray-400)', textAlign: 'center', padding: '20px' }}>No data</div>;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const strokeWidth = size * 0.18;

  let cumulative = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const largeArc = pct > 0.5 ? 1 : 0;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return {
      ...d,
      pct,
      path: `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
    };
  });

  const defaultColors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--info)', 'var(--secondary)', '#f472b6', '#a78bfa'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.path}
            fill="none"
            stroke={seg.color || defaultColors[i % defaultColors.length]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: `${size * 0.11}px`, fontWeight: 800, fill: 'var(--gray-900)' }}>
          {total.toLocaleString()}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: `${size * 0.06}px`, fill: 'var(--gray-500)' }}>
          Total
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: d.color || defaultColors[i % defaultColors.length], flexShrink: 0 }} />
            <span style={{ color: 'var(--gray-600)' }}>{d.label}</span>
            <span style={{ fontWeight: 600, color: 'var(--gray-800)', marginLeft: 'auto' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- TrendLine (SVG polyline) --
export function TrendLine({ data = [], color = 'var(--primary)', height = 60, width = 200 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = 4;
  const points = data.map((v, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon points={areaPoints} fill={color} opacity="0.1" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
