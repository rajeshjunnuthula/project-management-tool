import { useState } from 'react';
import api from '../services/api';
import { useForm } from '../hooks/useForm';
import { ALERT_ERROR, BTN_GHOST, BTN_PRIMARY, FORM_GROUP, FORM_INPUT, FORM_LABEL, MODAL, MODAL_BODY, MODAL_CLOSE, MODAL_FOOTER, MODAL_HEADER, MODAL_OVERLAY } from '../lib/ui';

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

export default function ProjectModal({ onClose, onCreated }) {
  const { form, set } = useForm({ title: '', description: '', color: COLORS[0], deadline: '', memberEmails: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className={MODAL_OVERLAY} onClick={onClose}>
      <div className={MODAL} onClick={e => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className="text-[1.2rem]">New Project</h2>
          <button className={MODAL_CLOSE} onClick={onClose}>Close</button>
        </div>
        {error && <div className={`mx-6 mt-4 ${ALERT_ERROR}`}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={MODAL_BODY}>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Project Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="My Awesome Project" required className={FORM_INPUT} />
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is this project about?" rows={3} className={FORM_INPUT} />
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Color</label>
              <div className="flex flex-wrap gap-2.5">
                {COLORS.map(c => (
                  <button key={c} type="button"
                    className={`h-8 w-8 rounded-full border-[3px] transition-transform hover:scale-115 ${form.color === c ? 'scale-110 border-ink' : 'border-transparent'}`}
                    style={{ background: c }} onClick={() => set('color', c)} />
                ))}
              </div>
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Deadline</label>
              <input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} className={FORM_INPUT} />
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Invite Members (emails, comma-separated)</label>
              <input value={form.memberEmails} onChange={e => set('memberEmails', e.target.value)} placeholder="alice@example.com, bob@example.com" className={FORM_INPUT} />
            </div>
          </div>
          <div className={MODAL_FOOTER}>
            <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY} disabled={loading}>{loading ? 'Creating...' : 'Create Project'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
