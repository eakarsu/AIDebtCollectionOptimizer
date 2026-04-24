import React from 'react';

const typeConfig = {
  payment: { icon: '$', color: 'var(--success)', bg: 'var(--success-light)' },
  communication: { icon: '\u2709', color: 'var(--info)', bg: 'var(--info-light)' },
  dispute: { icon: '\u2696', color: 'var(--warning)', bg: 'var(--warning-light)' },
  status_change: { icon: '\u21C4', color: 'var(--secondary)', bg: '#ede9fe' },
  note: { icon: '\u270E', color: 'var(--gray-600)', bg: 'var(--gray-100)' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const styles = {
  container: {
    position: 'relative',
    paddingLeft: '36px',
  },
  line: {
    position: 'absolute',
    left: '15px',
    top: '24px',
    bottom: '0',
    width: '2px',
    background: 'var(--gray-200)',
  },
  item: {
    position: 'relative',
    paddingBottom: '24px',
  },
  dot: {
    position: 'absolute',
    left: '-36px',
    top: '2px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    zIndex: 1,
  },
  content: {
    background: 'white',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--gray-200)',
    padding: '14px 16px',
    transition: 'box-shadow 0.2s',
  },
  description: {
    fontSize: '14px',
    color: 'var(--gray-800)',
    fontWeight: 500,
    marginBottom: '6px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: 'var(--gray-400)',
  },
  performer: {
    fontWeight: 600,
    color: 'var(--gray-600)',
  },
  typeBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
    textTransform: 'capitalize',
  },
  empty: {
    textAlign: 'center',
    padding: '32px',
    color: 'var(--gray-400)',
    fontSize: '14px',
  },
};

export default function ActivityTimeline({ activities }) {
  if (!activities || activities.length === 0) {
    return <div style={styles.empty}>No activity yet</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.line} />
      {activities.map((activity, i) => {
        const config = typeConfig[activity.type] || typeConfig.note;
        return (
          <div key={i} style={styles.item}>
            <div style={{ ...styles.dot, background: config.bg, color: config.color }}>
              {config.icon}
            </div>
            <div
              style={styles.content}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={styles.description}>{activity.description}</div>
              <div style={styles.meta}>
                <span
                  style={{
                    ...styles.typeBadge,
                    background: config.bg,
                    color: config.color,
                  }}
                >
                  {(activity.type || '').replace(/_/g, ' ')}
                </span>
                {activity.performed_by && (
                  <span style={styles.performer}>{activity.performed_by}</span>
                )}
                <span>{timeAgo(activity.created_at)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
