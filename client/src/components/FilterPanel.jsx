import React, { useState } from 'react';

const styles = {
  container: {
    background: 'white',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--gray-200)',
    boxShadow: 'var(--shadow-sm)',
    marginBottom: '16px',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background 0.15s',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--gray-700)',
  },
  badge: {
    background: 'var(--primary)',
    color: 'white',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '20px',
    textAlign: 'center',
  },
  arrow: {
    fontSize: '12px',
    color: 'var(--gray-400)',
    transition: 'transform 0.2s',
  },
  body: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    padding: '0 20px 16px',
    flexWrap: 'wrap',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '160px',
    flex: '1 1 160px',
    maxWidth: '250px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--gray-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '8px 12px',
    border: '1.5px solid var(--gray-300)',
    borderRadius: 'var(--radius)',
    fontSize: '13px',
    fontFamily: 'inherit',
    background: 'white',
    width: '100%',
  },
  clearBtn: {
    padding: '8px 16px',
    border: '1.5px solid var(--gray-300)',
    borderRadius: 'var(--radius)',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--gray-600)',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
};

export default function FilterPanel({ filters, values, onChange, onReset }) {
  const [open, setOpen] = useState(false);

  const activeCount = Object.values(values).filter(v => v !== '' && v !== undefined && v !== null).length;

  const handleChange = (name, val) => {
    onChange({ ...values, [name]: val });
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.header}
        onClick={() => setOpen(!open)}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-50)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={styles.headerLeft}>
          <span>Filters</span>
          {activeCount > 0 && <span style={styles.badge}>{activeCount}</span>}
        </div>
        <span style={{ ...styles.arrow, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>&#9660;</span>
      </div>
      {open && (
        <div style={styles.body}>
          {filters.map(f => (
            <div key={f.name} style={styles.field}>
              <label style={styles.label}>{f.label}</label>
              {f.type === 'select' ? (
                <select
                  style={styles.input}
                  value={values[f.name] || ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                >
                  <option value="">All</option>
                  {(f.options || []).map(opt => (
                    <option key={opt} value={opt}>{String(opt).replace(/_/g, ' ')}</option>
                  ))}
                </select>
              ) : f.type === 'date' ? (
                <input
                  type="date"
                  style={styles.input}
                  value={values[f.name] || ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                />
              ) : f.type === 'daterange' ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="date"
                    style={{ ...styles.input, flex: 1 }}
                    value={values[`${f.name}_from`] || ''}
                    onChange={(e) => handleChange(`${f.name}_from`, e.target.value)}
                    placeholder="From"
                  />
                  <input
                    type="date"
                    style={{ ...styles.input, flex: 1 }}
                    value={values[`${f.name}_to`] || ''}
                    onChange={(e) => handleChange(`${f.name}_to`, e.target.value)}
                    placeholder="To"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  style={styles.input}
                  value={values[f.name] || ''}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  placeholder={`Filter by ${f.label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}
          {activeCount > 0 && (
            <button
              style={styles.clearBtn}
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-100)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            >
              Clear All
            </button>
          )}
        </div>
      )}
    </div>
  );
}
