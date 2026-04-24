import React from 'react';

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'white',
    borderTop: '1px solid var(--gray-200)',
    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
    flexWrap: 'wrap',
    gap: '12px',
  },
  info: {
    fontSize: '13px',
    color: 'var(--gray-500)',
  },
  buttons: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  btn: {
    minWidth: '36px',
    height: '36px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid var(--gray-300)',
    borderRadius: 'var(--radius)',
    background: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--gray-700)',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    padding: '0 8px',
  },
  btnActive: {
    background: 'var(--primary)',
    color: 'white',
    borderColor: 'var(--primary)',
  },
  btnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  ellipsis: {
    minWidth: '36px',
    height: '36px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    color: 'var(--gray-400)',
  },
  sizeSelect: {
    padding: '6px 10px',
    border: '1.5px solid var(--gray-300)',
    borderRadius: 'var(--radius)',
    fontSize: '13px',
    fontFamily: 'inherit',
    background: 'white',
    color: 'var(--gray-700)',
    cursor: 'pointer',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
};

export default function Pagination({ page, totalPages, onPageChange, limit, onLimitChange, total }) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      if (page <= 3) { start = 2; end = 4; }
      if (page >= totalPages - 2) { start = totalPages - 3; end = totalPages - 1; }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div style={styles.container}>
      <div style={styles.info}>
        Showing {from}-{to} of {total} results
      </div>
      <div style={styles.right}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--gray-500)' }}>
          <span>Per page:</span>
          <select
            style={styles.sizeSelect}
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div style={styles.buttons}>
          <button
            style={{ ...styles.btn, ...(page <= 1 ? styles.btnDisabled : {}) }}
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            title="First"
          >
            &#171;
          </button>
          <button
            style={{ ...styles.btn, ...(page <= 1 ? styles.btnDisabled : {}) }}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            title="Previous"
          >
            &#8249;
          </button>
          {getPageNumbers().map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} style={styles.ellipsis}>...</span>
            ) : (
              <button
                key={p}
                style={{ ...styles.btn, ...(p === page ? styles.btnActive : {}) }}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            style={{ ...styles.btn, ...(page >= totalPages ? styles.btnDisabled : {}) }}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            title="Next"
          >
            &#8250;
          </button>
          <button
            style={{ ...styles.btn, ...(page >= totalPages ? styles.btnDisabled : {}) }}
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages}
            title="Last"
          >
            &#187;
          </button>
        </div>
      </div>
    </div>
  );
}
