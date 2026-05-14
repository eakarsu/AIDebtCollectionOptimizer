import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';

const navLinks = [
  { path: '/', label: 'Dashboard' },
  { path: '/reports', label: 'Reports' },
  { path: '/calculator', label: 'Calculator' },
  { path: '/ai-features', label: 'AI Features' },
  { path: '/ai-new', label: 'AI Scoring' },
  { path: '/audit', label: 'Audit' },
  { path: '/settings', label: 'Settings' },
];

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo" onClick={() => navigate('/')}>
          AI Debt Collection Optimizer
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '24px' }}>
          {navLinks.map(link => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--gray-500)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--gray-100)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                {link.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="header-right">
        <NotificationBell />
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <span>{user?.name || 'Admin'}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
