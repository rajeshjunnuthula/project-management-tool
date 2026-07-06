import { useState, FormEvent } from 'react';
import api from '../services/api';
import { useForm } from '../hooks/useForm';
import { ALERT_ERROR, BTN_GHOST, BTN_PRIMARY, FORM_GROUP, FORM_INPUT, FORM_LABEL, MODAL, MODAL_BODY, MODAL_CLOSE, MODAL_FOOTER, MODAL_HEADER, MODAL_OVERLAY } from '../lib/ui';
import type { Milestone, Project } from '../types';

interface MilestoneModalProps {
  projectId?: string;
  projects?: Project[];
  milestone?: Milestone | null;
  onClose: () => void;
  onSaved: (milestone: Milestone, isNew: boolean) => void;
}

export default function MilestoneModal({ projectId, projects, milestone, onClose, onSaved }: MilestoneModalProps) {
  const isEdit = !!milestone;
  const { form, set } = useForm({
    title: milestone?.title || '',
    description: milestone?.description || '',
    dueDate: milestone?.dueDate ? milestone.dueDate.slice(0, 10) : '',
    project: projectId || milestone?.project?._id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data } = isEdit ? await api.put(`/milestones/${milestone!._id}`, form) : await api.post('/milestones', form);
      onSaved(data, !isEdit);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to save milestone'); }
    finally { setLoading(false); }
  };

  return (
    <div className={MODAL_OVERLAY} onClick={onClose}>
      <div className={MODAL} onClick={e => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className="text-[1.2rem]">{isEdit ? 'Edit Milestone' : 'New Milestone'}</h2>
          <button className={MODAL_CLOSE} onClick={onClose}>Close</button>
        </div>
        {error && <div className={`mx-6 mt-4 ${ALERT_ERROR}`}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={MODAL_BODY}>
            {!projectId && (
              <div className={FORM_GROUP}>
                <label className={FORM_LABEL}>Project *</label>
                <select value={form.project} onChange={e => set('project', e.target.value)} required className={FORM_INPUT}>
                  <option value="">Select a project</option>
                  {projects?.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
            )}
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Beta Launch" required className={FORM_INPUT} />
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does hitting this milestone mean?" rows={3} className={FORM_INPUT} />
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} required className={FORM_INPUT} />
            </div>
          </div>
          <div className={MODAL_FOOTER}>
            <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY} disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Milestone' : 'Create Milestone'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
