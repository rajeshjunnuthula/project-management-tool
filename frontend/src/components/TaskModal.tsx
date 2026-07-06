import { useState, FormEvent } from 'react';
import api from '../services/api';
import { useForm } from '../hooks/useForm';
import { ALERT_ERROR, AVATAR_XS, BTN_GHOST, BTN_PRIMARY, BTN_SM, FORM_GROUP, FORM_INPUT, FORM_LABEL, FORM_ROW, MODAL, MODAL_BODY, MODAL_CLOSE, MODAL_FOOTER, MODAL_HEADER, MODAL_OVERLAY } from '../lib/ui';
import type { Comment, Member, Task, TaskStatus, Priority } from '../types';

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'in-review', 'done'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];

interface TaskModalProps {
  projectId: string;
  members: Member[];
  task: Task | null;
  onClose: () => void;
  onSaved: (task: Task, isNew: boolean) => void;
}

export default function TaskModal({ projectId, members, task, onClose, onSaved }: TaskModalProps) {
  const isEdit = !!task;
  const { form, set } = useForm({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    labels: task?.labels?.join(', ') || '',
  });
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(task?.comments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, project: projectId,
        labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        assignee: form.assignee || null, dueDate: form.dueDate || null };
      const { data } = isEdit ? await api.put(`/tasks/${task!._id}`, payload) : await api.post('/tasks', payload);
      onSaved(data, !isEdit);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to save task'); }
    finally { setLoading(false); }
  };

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${task!._id}/comments`, { content: comment });
      setComments(prev => [...prev, data]); setComment('');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to add comment'); }
  };

  return (
    <div className={MODAL_OVERLAY} onClick={onClose}>
      <div className={MODAL} onClick={e => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className="text-[1.2rem]">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className={MODAL_CLOSE} onClick={onClose}>Close</button>
        </div>
        {error && <div className={`mx-6 mt-4 ${ALERT_ERROR}`}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={MODAL_BODY}>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" required className={FORM_INPUT} />
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the task..." rows={3} className={FORM_INPUT} />
            </div>
            <div className={FORM_ROW}>
              <div className={FORM_GROUP}>
                <label className={FORM_LABEL}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value as TaskStatus)} className={FORM_INPUT}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
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
                <label className={FORM_LABEL}>Assignee</label>
                <select value={form.assignee} onChange={e => set('assignee', e.target.value)} className={FORM_INPUT}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                </select>
              </div>
              <div className={FORM_GROUP}>
                <label className={FORM_LABEL}>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} className={FORM_INPUT} />
              </div>
            </div>
            <div className={FORM_GROUP}>
              <label className={FORM_LABEL}>Labels (comma-separated)</label>
              <input value={form.labels} onChange={e => set('labels', e.target.value)} placeholder="frontend, bug, feature" className={FORM_INPUT} />
            </div>
          </div>
          <div className={MODAL_FOOTER}>
            <button type="button" className={BTN_GHOST} onClick={onClose}>Cancel</button>
            <button type="submit" className={BTN_PRIMARY} disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
        {isEdit && (
          <div className="mt-1 border-t border-border px-6 pb-6">
            <h3 className="mb-3 pt-4">Comments ({comments.length})</h3>
            <div className="mb-4 flex max-h-[200px] flex-col gap-3 overflow-y-auto">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className={AVATAR_XS}><span>{c.user?.name?.[0] || '?'}</span></div>
                  <div className="flex-1">
                    <span className="mr-1.5 text-[0.8rem] font-semibold">{c.user?.name}</span>
                    <p className="text-[0.85rem] text-ink">{c.content}</p>
                    <span className="text-[0.72rem] text-ink-muted">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-ink-muted">No comments yet</p>}
            </div>
            <form onSubmit={handleAddComment} className="flex gap-2.5">
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className={`flex-1 ${FORM_INPUT}`} />
              <button type="submit" className={`${BTN_PRIMARY} ${BTN_SM}`}>Post</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
