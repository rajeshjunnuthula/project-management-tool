import { useState } from 'react';
import api from '../services/api';

const STATUSES = ['todo', 'in-progress', 'in-review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export default function TaskModal({ projectId, members, task, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    assignee: task?.assignee?._id || '',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    labels: task?.labels?.join(', ') || '',
  });
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const payload = { ...form, project: projectId,
        labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
        assignee: form.assignee || null, dueDate: form.dueDate || null };
      const { data } = isEdit ? await api.put(`/tasks/${task._id}`, payload) : await api.post('/tasks', payload);
      onSaved(data, !isEdit);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save task'); }
    finally { setLoading(false); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/comments`, { content: comment });
      setComments(prev => [...prev, data]); setComment('');
    } catch (err) { setError(err.response?.data?.message || 'Failed to add comment'); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the task..." rows={3} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assignee</label>
                <select value={form.assignee} onChange={e => set('assignee', e.target.value)}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Labels (comma-separated)</label>
              <input value={form.labels} onChange={e => set('labels', e.target.value)} placeholder="frontend, bug, feature" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
        {isEdit && (
          <div className="comments-section">
            <h3>Comments ({comments.length})</h3>
            <div className="comments-list">
              {comments.map((c, i) => (
                <div key={i} className="comment">
                  <div className="avatar-xs"><span>{c.user?.name?.[0] || '?'}</span></div>
                  <div className="comment-body">
                    <span className="comment-author">{c.user?.name}</span>
                    <p>{c.content}</p>
                    <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-muted text-sm">No comments yet</p>}
            </div>
            <form onSubmit={handleAddComment} className="comment-form">
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." />
              <button type="submit" className="btn btn-primary btn-sm">Post</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
