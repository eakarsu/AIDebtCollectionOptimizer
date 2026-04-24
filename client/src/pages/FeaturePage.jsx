import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { features } from '../config/features'
import { fetchItems, createItem, updateItem, deleteItem, aiAnalyze, bulkUpdate, bulkDelete, exportCSV } from '../services/api'
import Pagination from '../components/Pagination'
import FilterPanel from '../components/FilterPanel'
import BulkActions from '../components/BulkActions'

function formatValue(value, format) {
  if (value === null || value === undefined) return '\u2014';
  switch (format) {
    case 'currency':
      return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'percent':
      return Number(value).toFixed(1) + '%';
    case 'date':
      return value ? new Date(value).toLocaleDateString() : '\u2014';
    case 'badge':
      return value;
    case 'change':
      const num = Number(value);
      return (num >= 0 ? '+' : '') + num.toFixed(1) + '%';
    default:
      return String(value);
  }
}

function getBadgeClass(value) {
  if (!value) return 'badge-default';
  const v = String(value).toLowerCase();
  if (['active', 'pass', 'completed', 'approved', 'settled', 'accepted', 'up', 'low'].includes(v)) return 'badge-success';
  if (['warning', 'in_negotiation', 'negotiating', 'proposed', 'pending', 'medium', 'draft', 'paused', 'new', 'in_progress', 'stable'].includes(v)) return 'badge-warning';
  if (['critical', 'fail', 'delinquent', 'defaulted', 'rejected', 'overdue', 'expired', 'declined', 'failed', 'high', 'down'].includes(v)) return 'badge-danger';
  if (['disputed', 'investigating', 'under_review', 'on_hold', 'on_leave', 'training', 'action_required', 'monitoring'].includes(v)) return 'badge-info';
  return 'badge-default';
}

// Determine if a feature has debtor-linkable names
const debtorNameFields = ['debtor_name', 'name'];

export default function FeaturePage({ showToast }) {
  const { featureKey } = useParams();
  const navigate = useNavigate();
  const feature = features.find(f => f.key === featureKey);

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(() => {
    const saved = localStorage.getItem('pref_items_per_page');
    return saved ? Number(saved) : 25;
  });

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Filters
  const [filterValues, setFilterValues] = useState({});

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Generate filter definitions from feature config
  const filterDefs = useMemo(() => {
    if (!feature) return [];
    return feature.fields
      .filter(f => f.type === 'select' || f.type === 'date')
      .slice(0, 5) // limit to 5 filters
      .map(f => ({
        name: f.key,
        label: f.label,
        type: f.type === 'select' ? 'select' : 'date',
        options: f.options || [],
      }));
  }, [feature]);

  // Get status options for bulk actions
  const statusOptions = useMemo(() => {
    if (!feature) return [];
    const statusField = feature.fields.find(f => f.key === 'status');
    return statusField?.options || [];
  }, [feature]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchItems(feature.endpoint, search);
      if (Array.isArray(data)) setItems(data);
    } catch (err) {
      showToast('Failed to load data', 'error');
    }
    setLoading(false);
  }, [feature?.endpoint, search]);

  useEffect(() => {
    if (feature) {
      loadItems();
      setSelectedIds([]);
      setFilterValues({});
      setPage(1);
    }
  }, [feature, loadItems]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filterValues]);

  if (!feature) {
    return <div className="feature-page"><h1>Feature not found</h1></div>;
  }

  // Apply client-side filtering
  const filteredItems = useMemo(() => {
    let result = items;
    Object.entries(filterValues).forEach(([key, val]) => {
      if (!val) return;
      // Strip date range suffixes
      const baseKey = key.replace(/_from$|_to$/, '');
      result = result.filter(item => {
        const itemVal = item[baseKey] || item[key];
        if (!itemVal) return false;
        if (key.endsWith('_from')) return new Date(itemVal) >= new Date(val);
        if (key.endsWith('_to')) return new Date(itemVal) <= new Date(val);
        return String(itemVal).toLowerCase().includes(String(val).toLowerCase());
      });
    });
    return result;
  }, [items, filterValues]);

  // Pagination
  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

  const handleSearch = (e) => {
    e.preventDefault();
    loadItems();
  };

  // Check if this is a debtor-related feature (has debtor_id or debtor_name field)
  const isDebtorLinked = feature.key === 'debtors' || feature.fields.some(f => f.key === 'debtor_name');

  const openNew = () => {
    setEditItem(null);
    const initial = {};
    feature.fields.forEach(f => { initial[f.key] = ''; });
    setFormData(initial);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const data = {};
    feature.fields.forEach(f => {
      let val = item[f.key];
      if (f.type === 'date' && val) {
        val = val.substring(0, 10);
      }
      data[f.key] = val ?? '';
    });
    setFormData(data);
    setShowForm(true);
    setSelectedItem(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await updateItem(feature.endpoint, editItem.id, formData);
        showToast('Updated successfully!');
      } else {
        await createItem(feature.endpoint, formData);
        showToast('Created successfully!');
      }
      setShowForm(false);
      loadItems();
    } catch (err) {
      showToast('Operation failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem(feature.endpoint, id);
      showToast('Deleted successfully!');
      setConfirmDelete(null);
      setSelectedItem(null);
      loadItems();
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  // Bulk operations
  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pageIds = paginatedItems.map(i => i.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleBulkUpdate = async (ids, updates) => {
    try {
      await bulkUpdate(feature.endpoint, ids, updates);
      showToast(`Updated ${ids.length} items`);
      setSelectedIds([]);
      loadItems();
    } catch {
      showToast('Bulk update failed', 'error');
    }
  };

  const handleBulkDelete = async (ids) => {
    try {
      await bulkDelete(feature.endpoint, ids);
      showToast(`Deleted ${ids.length} items`);
      setSelectedIds([]);
      loadItems();
    } catch {
      showToast('Bulk delete failed', 'error');
    }
  };

  const handleExport = () => {
    exportCSV(feature.endpoint, filterValues);
  };

  const handleAiAnalyze = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const context = selectedItem ? JSON.stringify(selectedItem, null, 2) : `Total items: ${items.length}`;
      const result = await aiAnalyze(aiPrompt, context, featureKey);
      setAiResult(result);
    } catch (err) {
      setAiResult({ success: false, error: 'Failed to connect to AI service' });
    }
    setAiLoading(false);
  };

  const handleQuickAi = async (item) => {
    setAiLoading(true);
    setAiResult(null);
    setAiPrompt(feature.aiPrompt);
    try {
      const context = JSON.stringify(item, null, 2);
      const result = await aiAnalyze(feature.aiPrompt, context, featureKey);
      setAiResult(result);
    } catch (err) {
      setAiResult({ success: false, error: 'Failed to connect to AI service' });
    }
    setAiLoading(false);
  };

  const renderAiContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;
      if (trimmed.startsWith('# ')) return <h3 key={i} style={{ fontSize: '18px', fontWeight: 700, color: 'var(--gray-900)', marginTop: '16px', marginBottom: '8px' }}>{trimmed.slice(2)}</h3>;
      if (trimmed.startsWith('## ')) return <h4 key={i} style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gray-800)', marginTop: '12px', marginBottom: '6px' }}>{trimmed.slice(3)}</h4>;
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', paddingLeft: '8px' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>&bull;</span>
            <span>{formatAiText(trimmed.slice(2))}</span>
          </div>
        );
      }
      if (/^\d+[.)]\s/.test(trimmed)) {
        const num = trimmed.match(/^(\d+)[.)]\s/)[1];
        const text = trimmed.replace(/^\d+[.)]\s/, '');
        return (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '8px', paddingLeft: '4px' }}>
            <span style={{ background: 'var(--primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>{num}</span>
            <span style={{ paddingTop: '2px' }}>{formatAiText(text)}</span>
          </div>
        );
      }
      if (trimmed.includes(':') && trimmed.indexOf(':') < 40 && !trimmed.startsWith('http')) {
        const [label, ...rest] = trimmed.split(':');
        const val = rest.join(':').trim();
        if (val) {
          return (
            <div key={i} style={{ marginBottom: '6px' }}>
              <strong style={{ color: 'var(--gray-900)' }}>{label}:</strong> {formatAiText(val)}
            </div>
          );
        }
      }
      return <p key={i} style={{ marginBottom: '8px' }}>{formatAiText(trimmed)}</p>;
    });
  };

  const formatAiText = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  // Get debtor link for a row if applicable
  const getDebtorLink = (item) => {
    if (feature.key === 'debtors') return `/debtor/${item.id}`;
    if (item.debtor_id) return `/debtor/${item.debtor_id}`;
    return null;
  };

  const allPageSelected = paginatedItems.length > 0 && paginatedItems.every(i => selectedIds.includes(i.id));

  return (
    <div className="feature-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="back-btn" onClick={() => navigate('/')}>&larr;</button>
          <div>
            <h1 className="page-title">{feature.icon} {feature.title}</h1>
            <p className="page-subtitle">{feature.description}</p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleExport}>Export CSV</button>
          <button className="btn btn-primary" onClick={openNew}>+ New Item</button>
        </div>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="search-input"
          placeholder={`Search ${feature.title.toLowerCase()}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn btn-secondary" type="submit">Search</button>
      </form>

      {/* Filter Panel */}
      {filterDefs.length > 0 && (
        <FilterPanel
          filters={filterDefs}
          values={filterValues}
          onChange={setFilterValues}
          onReset={() => setFilterValues({})}
        />
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '40px', padding: '14px 12px' }}>
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={handleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </th>
              {feature.columns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={feature.columns.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>Loading...</td></tr>
            ) : paginatedItems.length === 0 ? (
              <tr><td colSpan={feature.columns.length + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-400)' }}>No items found</td></tr>
            ) : (
              paginatedItems.map(item => {
                const debtorLink = getDebtorLink(item);
                return (
                  <tr key={item.id} onClick={() => setSelectedItem(item)}>
                    <td style={{ padding: '14px 12px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => handleToggleSelect(item.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    {feature.columns.map(col => (
                      <td key={col.key}>
                        {/* Link debtor names to profile */}
                        {debtorLink && (col.key === 'name' || col.key === 'debtor_name') ? (
                          <span
                            onClick={(e) => { e.stopPropagation(); navigate(debtorLink); }}
                            style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
                            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                          >
                            {item[col.key] || '\u2014'}
                          </span>
                        ) : col.format === 'badge' ? (
                          <span className={`badge ${getBadgeClass(item[col.key])}`}>
                            {String(item[col.key] || '').replace(/_/g, ' ')}
                          </span>
                        ) : col.format === 'change' ? (
                          <span style={{ color: Number(item[col.key]) >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                            {formatValue(item[col.key], col.format)}
                          </span>
                        ) : (
                          formatValue(item[col.key], col.format)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          limit={limit}
          onLimitChange={(v) => { setLimit(v); setPage(1); }}
          total={total}
        />
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedIds={selectedIds}
        onBulkUpdate={handleBulkUpdate}
        onBulkDelete={handleBulkDelete}
        onExport={() => exportCSV(feature.endpoint, { ids: selectedIds.join(',') })}
        statusOptions={statusOptions}
      />

      {/* AI Section */}
      <div className="ai-section">
        <div className="ai-header">
          <h3>AI Analysis &mdash; {feature.title}</h3>
          <span style={{ fontSize: '12px', opacity: 0.8 }}>Powered by OpenRouter</span>
        </div>
        <div className="ai-body">
          <form className="ai-prompt-form" onSubmit={handleAiAnalyze}>
            <input
              placeholder={`Ask AI about ${feature.title.toLowerCase()}... (e.g., "${feature.aiPrompt}")`}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" disabled={aiLoading}>
              {aiLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </form>

          {aiLoading && (
            <div className="ai-loading">
              <div className="spinner"></div>
              AI is analyzing your request...
            </div>
          )}

          {aiResult && !aiLoading && (
            <div>
              {aiResult.success || aiResult.mock ? (
                <div className="ai-result">
                  <div className="ai-result-content">
                    {renderAiContent(aiResult.content || aiResult.result)}
                  </div>
                  <div className="ai-meta">
                    {aiResult.model && (
                      <div className="ai-meta-item">Model: <span>{aiResult.model}</span></div>
                    )}
                    {aiResult.mock && (
                      <div className="ai-meta-item">Mode: <span>Demo (set API key for live AI)</span></div>
                    )}
                    {aiResult.usage && (
                      <>
                        <div className="ai-meta-item">Tokens: <span>{aiResult.usage.total_tokens}</span></div>
                        <div className="ai-meta-item">Prompt: <span>{aiResult.usage.prompt_tokens}</span></div>
                        <div className="ai-meta-item">Response: <span>{aiResult.usage.completion_tokens}</span></div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="ai-error">
                  {aiResult.error || 'An error occurred during analysis'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{feature.icon} Item Details</h2>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {feature.fields.map(field => (
                  <div key={field.key} className={`detail-item ${field.fullWidth ? 'full-width' : ''}`}>
                    <span className="detail-label">{field.label}</span>
                    <span className="detail-value">
                      {field.type === 'date' && selectedItem[field.key]
                        ? new Date(selectedItem[field.key]).toLocaleDateString()
                        : selectedItem[field.key] ?? '\u2014'}
                    </span>
                  </div>
                ))}
                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : '\u2014'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Updated</span>
                  <span className="detail-value">{selectedItem.updated_at ? new Date(selectedItem.updated_at).toLocaleString() : '\u2014'}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {getDebtorLink(selectedItem) && (
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(getDebtorLink(selectedItem))}>
                  View Profile
                </button>
              )}
              <button className="btn btn-info btn-sm" onClick={() => handleQuickAi(selectedItem)}>
                AI Analyze
              </button>
              <button className="btn btn-warning btn-sm" onClick={() => openEdit(selectedItem)}>
                Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(selectedItem.id)}>
                Delete
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedItem(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal form-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit' : 'New'} {feature.title.replace(/s$/, '')}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  {feature.fields.map(field => (
                    <div key={field.key} className={`form-group ${field.fullWidth ? 'full-width' : ''}`}>
                      <label>{field.label}{field.required ? ' *' : ''}</label>
                      {field.type === 'select' ? (
                        <select
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          required={field.required}
                        >
                          <option value="">Select...</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.key] || ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          required={field.required}
                          step={field.type === 'number' ? '0.01' : undefined}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" type="submit">
                  {editItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this item? This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
