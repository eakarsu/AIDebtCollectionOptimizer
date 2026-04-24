import React, { useState } from 'react';

const styles = {
  bar: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'var(--gray-900)',
    color: 'white',
    padding: '14px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 900,
    boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
    animation: 'slideUp 0.2s ease',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  count: {
    fontSize: '14px',
    fontWeight: 600,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  btn: {
    padding: '8px 16px',
    borderRadius: 'var(--radius)',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
  },
  statusDropdown: {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    marginBottom: '8px',
    background: 'white',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--gray-200)',
    padding: '4px 0',
    minWidth: '180px',
    zIndex: 910,
  },
  statusItem: {
    padding: '8px 16px',
    fontSize: '13px',
    color: 'var(--gray-700)',
    cursor: 'pointer',
    display: 'block',
    width: '100%',
    border: 'none',
    background: 'none',
    textAlign: 'left',
    fontFamily: 'inherit',
    textTransform: 'capitalize',
  },
};

export default function BulkActions({ selectedIds, onBulkUpdate, onBulkDelete, onExport, statusOptions }) {
  const [showStatus, setShowStatus] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!selectedIds || selectedIds.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div style={styles.bar}>
        <div style={styles.left}>
          <span style={styles.count}>{selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected</span>
        </div>
        <div style={styles.actions}>
          {statusOptions && statusOptions.length > 0 && (
            <div style={{ position: 'relative' }}>
              <button
                style={{ ...styles.btn, background: 'var(--info)', color: 'white' }}
                onClick={() => { setShowStatus(!showStatus); setShowConfirmDelete(false); }}
              >
                Update Status
              </button>
              {showStatus && (
                <div style={styles.statusDropdown}>
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      style={styles.statusItem}
                      onClick={() => {
                        onBulkUpdate(selectedIds, { status });
                        setShowStatus(false);
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-50)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    >
                      {status.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {onExport && (
            <button
              style={{ ...styles.btn, background: 'var(--success)', color: 'white' }}
              onClick={() => onExport(selectedIds)}
            >
              Export Selected
            </button>
          )}
          {onBulkDelete && (
            <div style={{ position: 'relative' }}>
              <button
                style={{ ...styles.btn, background: 'var(--danger)', color: 'white' }}
                onClick={() => { setShowConfirmDelete(!showConfirmDelete); setShowStatus(false); }}
              >
                Delete Selected
              </button>
              {showConfirmDelete && (
                <div style={{ ...styles.statusDropdown, padding: '16px', textAlign: 'center', minWidth: '220px' }}>
                  <p style={{ fontSize: '13px', color: 'var(--gray-700)', marginBottom: '12px' }}>
                    Delete {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''}?
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      style={{ ...styles.btn, background: 'var(--gray-100)', color: 'var(--gray-700)', fontSize: '12px' }}
                      onClick={() => setShowConfirmDelete(false)}
                    >
                      Cancel
                    </button>
                    <button
                      style={{ ...styles.btn, background: 'var(--danger)', color: 'white', fontSize: '12px' }}
                      onClick={() => {
                        onBulkDelete(selectedIds);
                        setShowConfirmDelete(false);
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
