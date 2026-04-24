import React, { useState, useEffect, useRef } from 'react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, fetchUnreadCount } from '../services/api';

const typeColors = {
  info: 'var(--info)',
  warning: 'var(--warning)',
  error: 'var(--danger)',
  success: 'var(--success)',
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
  return `${days}d ago`;
}

const styles = {
  wrapper: {
    position: 'relative',
  },
  bellBtn: {
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius)',
    border: '1.5px solid var(--gray-300)',
    background: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    position: 'relative',
    transition: 'all 0.2s',
  },
  badge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: 'var(--danger)',
    color: 'white',
    fontSize: '10px',
    fontWeight: 700,
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    width: '360px',
    background: 'white',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid var(--gray-200)',
    zIndex: 200,
    maxHeight: '440px',
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownHeader: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--gray-200)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--gray-800)',
  },
  list: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '340px',
  },
  item: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--gray-100)',
    cursor: 'pointer',
    display: 'flex',
    gap: '10px',
    transition: 'background 0.15s',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginTop: '6px',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--gray-800)',
    marginBottom: '2px',
  },
  itemMessage: {
    fontSize: '12px',
    color: 'var(--gray-500)',
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemTime: {
    fontSize: '11px',
    color: 'var(--gray-400)',
    marginTop: '4px',
  },
  footer: {
    padding: '10px 16px',
    borderTop: '1px solid var(--gray-200)',
    textAlign: 'center',
  },
  markAllBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: '4px 8px',
    borderRadius: 'var(--radius)',
    transition: 'background 0.15s',
  },
  empty: {
    padding: '32px 16px',
    textAlign: 'center',
    color: 'var(--gray-400)',
    fontSize: '13px',
  },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const loadUnreadCount = async () => {
    try {
      const data = await fetchUnreadCount();
      if (data && typeof data.count === 'number') {
        setUnreadCount(data.count);
      }
    } catch {}
  };

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  return (
    <div style={styles.wrapper} ref={ref}>
      <button
        style={styles.bellBtn}
        onClick={() => setOpen(!open)}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-50)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
      >
        &#128276;
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>
      {open && (
        <div style={styles.dropdown}>
          <div style={styles.dropdownHeader}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 500 }}>
                {unreadCount} unread
              </span>
            )}
          </div>
          <div style={styles.list}>
            {notifications.length === 0 ? (
              <div style={styles.empty}>No notifications</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    ...styles.item,
                    background: n.read ? 'transparent' : 'var(--gray-50)',
                  }}
                  onClick={() => !n.read && handleMarkRead(n.id)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-100)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'var(--gray-50)'; }}
                >
                  <div style={{ ...styles.dot, background: typeColors[n.type] || typeColors.info }} />
                  <div style={styles.itemContent}>
                    <div style={styles.itemTitle}>{n.title}</div>
                    <div style={styles.itemMessage}>{n.message}</div>
                    <div style={styles.itemTime}>{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && unreadCount > 0 && (
            <div style={styles.footer}>
              <button
                style={styles.markAllBtn}
                onClick={handleMarkAllRead}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
