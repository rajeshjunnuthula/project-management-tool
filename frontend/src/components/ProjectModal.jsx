import { useState } from 'react';
import api from '../services/api';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function ProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', color: COLORS[0], deadline: '', memberEmails: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form,
        memberEmails: form.memberEmails ? form.memberEmails.split(',').map(e => e.trim()).filter(Boolean) : [],
        deadline: form.deadline || undefined };
      const { data } = await api.post('/projects', payload);
      onCreated(data);
    } catch (err) { setError(err.response?.data?.message || 'Failed to create project'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Project</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Project Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="My Awesome Project" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is this project about?" rows={3} />
            </div>
            <div className="form-group">
              <label>Color</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <button key={c} type="button" className={`color-swatch ${form.color === c ? 'selected' : ''}`}
                    style={{ background: c }} onClick={() => set('color', c)} />
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Invite Members (emails, comma-separated)</label>
              <input value={form.memberEmails} onChange={e => set('memberEmails', e.target.value)} placeholder="alice@example.com, bob@example.com" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
