import { useState, FormEvent } from 'react';
import api from '../services/api';
import { useForm } from '../hooks/useForm';
import { ALERT_ERROR, BTN_GHOST, BTN_PRIMARY, FORM_GROUP, FORM_INPUT, FORM_LABEL, FORM_ROW, MODAL, MODAL_BODY, MODAL_CLOSE, MODAL_FOOTER, MODAL_HEADER, MODAL_OVERLAY } from '../lib/ui';
import type { Member, Priority, Project, Ticket, TicketStatus, TicketType } from '../types';

const TYPES: TicketType[] = ['bug', 'feature', 'question', 'other'];
const STATUSES: TicketStatus[] = ['open', 'in-progress', 'resolved', 'closed'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

interface TicketModalProps {
  projectId?: string;
  members?: Member[];
  projects?: Project[];
  ticket?: Ticket | null;
  onClose: () => void;
  onSaved: (ticket: Ticket, isNew: boolean) => void;
}

export default function TicketModal({ projectId, members, projects, ticket, onClose, onSaved }: TicketModalProps) {
  const isEdit = !!ticket;
  const { form, set } = useForm({
    title: ticket?.title || '',
    description: ticket?.description || '',
    project: projectId || ticket?.project?._id || '',
    type: ticket?.type || 'bug',
    status: ticket?.status || 'open',
    priority: ticket?.priority || 'medium',
    assignee: ticket?.assignee?._id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const memberList = projectId ? members || [] : (projects?.find(p => p._id === form.project)?.members || []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, assignee: form.assignee || null };
      const { data } = isEdit ? await api.put(`/tickets/${ticket!._id}`, payload) : await api.post('/tickets', payload);
      onSaved(data, !isEdit);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to save ticket'); }
    finally { setLoading(false); }
  };

  return (
    <div className={MODAL_OVERLAY} onClick={onClose}>
      <div className={MODAL} onClick={e => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className="text-[1.2rem]">{isEdit ? 'Edit Ticket' : 'New Ticket'}</h2>
          <button className={MODAL_CLOSE} onClick={onClose}>Close</button>
        </div>
        {error && <div className={`mx-6 mt-4 ${ALERT_ERROR}`}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={MODAL_BODY}>
            {!projectId && (
              <div className={FORM_GROUP}>
                <label className={FORM_LABEL}>Project *</label>
                <select value={form.project} onChange={e => { set('project', e.target.value); set('assignee', ''); }} required className={FORM_INPUT}>
                  <option value="">Select a project</option>
                  {projects?.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
                </select>
              </div>
            )}
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Brief summary of the issue or request" required className={FORM_INPUT} />
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Steps to reproduce, context, etc." rows={3} className={FORM_INPUT} />
            </div>
            <div className={FORM_ROW}>
              <div className={FORM_GROUP}>
                <label className={FORM_LABEL}>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value as TicketType)} className={FORM_INPUT}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className={FORM_GROUP}>
                <label className={FORM_LABEL}>Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value as Priority)} className={FORM_INPUT}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className={FORM_ROW}>
              <div className={FORM_GROUP}>
                <label className={FORM_LABEL}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value as TicketStatus)} className={FORM_INPUT}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={FORM_GROUP}>
                <label className={FORM_LABEL}>Assignee</label>
                <select value={form.assignee} onChange={e => set('assignee', e.target.value)} className={FORM_INPUT} disabled={!projectId && !form.project}>
                  <option value="">Unassigned</option>
                  {memberList.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className={MODAL_FOOTER}>
            <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY} disabled={loading}>{loading ? 'Saving...' : isEdit ? 'Update Ticket' : 'Create Ticket'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
