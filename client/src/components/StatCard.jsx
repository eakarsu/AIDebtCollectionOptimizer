import React from 'react';

const styles = {
  card: {
    background: 'white',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: 'var(--shadow)',
    border: '1px solid var(--gray-200)',
    transition: 'all 0.2s ease',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
  },
  topRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  icon: {
    width: '44px',
    height: '44px',
    borderRadius: 'var(--radius)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  value: {
    fontSize: '28px',
    fontWeight: 800,
    color: 'var(--gray-900)',
    lineHeight: 1.1,
  },
  title: {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--gray-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px',
  },
  subtitle: {
    fontSize: '12px',
    color: 'var(--gray-400)',
    marginTop: '2px',
  },
  change: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    fontWeight: 600,
    marginTop: '10px',
    padding: '2px 8px',
    borderRadius: '10px',
  },
};

const changeStyles = {
  positive: { color: 'var(--success)', background: 'var(--success-light)' },
  negative: { color: 'var(--danger)', background: 'var(--danger-light)' },
  neutral: { color: 'var(--gray-500)', background: 'var(--gray-100)' },
};

const colorMap = {
  blue: { bg: '#e8eefb', text: 'var(--primary)' },
  green: { bg: 'var(--success-light)', text: 'var(--success)' },
  red: { bg: 'var(--danger-light)', text: 'var(--danger)' },
  orange: { bg: 'var(--warning-light)', text: 'var(--warning)' },
  purple: { bg: '#ede9fe', text: 'var(--secondary)' },
  cyan: { bg: 'var(--info-light)', text: 'var(--info)' },
};

export default function StatCard({ title, value, change, changeType = 'neutral', icon, color = 'blue', subtitle }) {
  const colorDef = colorMap[color] || colorMap.blue;
  const changeDef = changeStyles[changeType] || changeStyles.neutral;

  return (
    <div
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      <div style={styles.topRow}>
        <div>
          <div style={styles.value}>{value}</div>
          <div style={styles.title}>{title}</div>
          {subtitle && <div style={styles.subtitle}>{subtitle}</div>}
        </div>
        {icon && (
          <div style={{ ...styles.icon, background: colorDef.bg, color: colorDef.text }}>
            {icon}
          </div>
        )}
      </div>
      {change !== undefined && change !== null && (
        <div style={{ ...styles.change, ...changeDef }}>
          {changeType === 'positive' ? '\u2191' : changeType === 'negative' ? '\u2193' : '\u2192'} {change}
        </div>
      )}
    </div>
  );
}
