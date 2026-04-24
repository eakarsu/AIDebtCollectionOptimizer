import React, { useState, useEffect } from 'react';
import { updateProfile, changePassword } from '../services/api';

const s = {
  page: { padding: '32px', maxWidth: '800px', margin: '0 auto' },
  section: {
    background: 'white', borderRadius: 'var(--radius-lg)', padding: '28px',
    boxShadow: 'var(--shadow)', border: '1px solid var(--gray-200)', marginBottom: '24px',
  },
  sectionTitle: { fontSize: '18px', fontWeight: 700, color: 'var(--gray-800)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--gray-200)' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 600, color: 'var(--gray-700)' },
  input: {
    padding: '10px 14px', border: '1.5px solid var(--gray-300)',
    borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'inherit',
    transition: 'all 0.2s', background: 'white', width: '100%',
  },
  select: {
    padding: '10px 14px', border: '1.5px solid var(--gray-300)',
    borderRadius: 'var(--radius)', fontSize: '14px', fontFamily: 'inherit',
    background: 'white', width: '100%', cursor: 'pointer',
  },
  actions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' },
  error: { color: 'var(--danger)', fontSize: '13px', marginTop: '-8px' },
};

export default function Settings({ showToast, user }) {
  // Profile
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Preferences
  const [itemsPerPage, setItemsPerPage] = useState(() => localStorage.getItem('pref_items_per_page') || '25');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('pref_sort_order') || 'desc');
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('pref_date_format') || 'MM/DD/YYYY');

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
    }
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const result = await updateProfile({ name: profileName, email: profileEmail });
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Profile updated successfully!');
      }
    } catch {
      showToast('Failed to update profile', 'error');
    }
    setProfileSaving(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }
    setPwSaving(true);
    try {
      const result = await changePassword({ old_password: oldPw, new_password: newPw });
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('Password changed successfully!');
        setOldPw('');
        setNewPw('');
        setConfirmPw('');
      }
    } catch {
      showToast('Failed to change password', 'error');
    }
    setPwSaving(false);
  };

  const handlePrefSave = () => {
    localStorage.setItem('pref_items_per_page', itemsPerPage);
    localStorage.setItem('pref_sort_order', sortOrder);
    localStorage.setItem('pref_date_format', dateFormat);
    showToast('Preferences saved!');
  };

  return (
    <div style={s.page}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '8px' }}>Settings</h1>
      <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px' }}>Manage your profile and preferences</p>

      {/* Profile */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Profile</h2>
        <form style={s.form} onSubmit={handleProfileSave}>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Full Name</label>
              <input style={s.input} value={profileName} onChange={e => setProfileName(e.target.value)} required />
            </div>
            <div style={s.field}>
              <label style={s.label}>Email Address</label>
              <input style={s.input} type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required />
            </div>
          </div>
          <div style={s.actions}>
            <button className="btn btn-primary" type="submit" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Change Password</h2>
        <form style={s.form} onSubmit={handlePasswordChange}>
          <div style={s.field}>
            <label style={s.label}>Current Password</label>
            <input style={s.input} type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} required />
          </div>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>New Password</label>
              <input style={s.input} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Confirm New Password</label>
              <input style={s.input} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required />
            </div>
          </div>
          {pwError && <div style={s.error}>{pwError}</div>}
          <div style={s.actions}>
            <button className="btn btn-primary" type="submit" disabled={pwSaving}>
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Preferences */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Preferences</h2>
        <div style={s.form}>
          <div style={s.row}>
            <div style={s.field}>
              <label style={s.label}>Items Per Page</label>
              <select style={s.select} value={itemsPerPage} onChange={e => setItemsPerPage(e.target.value)}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div style={s.field}>
              <label style={s.label}>Default Sort Order</label>
              <select style={s.select} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          <div style={s.field}>
            <label style={s.label}>Date Format</label>
            <select style={s.select} value={dateFormat} onChange={e => setDateFormat(e.target.value)}>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          <div style={s.actions}>
            <button className="btn btn-primary" type="button" onClick={handlePrefSave}>
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
