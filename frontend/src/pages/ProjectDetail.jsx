import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import TicketModal from '../components/TicketModal';
import MilestoneModal from '../components/MilestoneModal';
import PageSpinner from '../components/PageSpinner';
import { BADGE_BASE, MILESTONE_STATUS_COLOR, PRIORITY_BADGE_BASE, PRIORITY_COLOR, PROJECT_STATUS_COLOR, TASK_STATUS_COLOR, TICKET_STATUS_COLOR, TICKET_TYPE_LABEL } from '../lib/badgeStyles';
import { ALERT_ERROR, AVATAR_MD, BTN_DANGER, BTN_PRIMARY, CARD, FORM_INPUT } from '../lib/ui';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [activeTab, setActiveTab] = useState('board');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);

  const { data: detail, setData: setDetail, loading } = useFetch(async () => {
    const [{ data: proj }, { data: taskList }, { data: ticketList }, { data: milestoneList }] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project=${id}`),
      api.get(`/tickets?project=${id}`),
      api.get(`/milestones?project=${id}`),
    ]);
    return { project: proj, tasks: taskList, tickets: ticketList, milestones: milestoneList };
  }, [id], () => navigate('/projects'));

  const project = detail?.project ?? null;
  const tasks = detail?.tasks ?? [];
  const tickets = detail?.tickets ?? [];
  const milestones = detail?.milestones ?? [];

  const handleTaskSaved = (task, isNew) => {
    setDetail(d => ({ ...d, tasks: isNew ? [...d.tasks, task] : d.tasks.map(t => t._id === task._id ? task : t) }));
    setShowTaskModal(false); setEditingTask(null);
  };

  const handleTaskDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setDetail(d => ({ ...d, tasks: d.tasks.filter(t => t._id !== taskId) }));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
    setDetail(d => ({ ...d, tasks: d.tasks.map(t => t._id === taskId ? data : t) }));
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setMemberError('');
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: memberEmail });
      setDetail(d => ({ ...d, project: data })); setMemberEmail('');
    } catch (err) { setMemberError(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setFileError('');
    if (file.size > MAX_FILE_SIZE) { setFileError('File exceeds the 10MB limit'); return; }
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await api.post(`/projects/${id}/files`, formData);
      setDetail(d => ({ ...d, project: { ...d.project, files: [...d.project.files, data] } }));
    } catch (err) { setFileError(err.response?.data?.message || 'Failed to upload file'); }
    finally { setUploading(false); }
  };

  const handleFileDownload = async (file) => {
    const res = await api.get(`/projects/${id}/files/${file._id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = file.originalName;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileDelete = async (fileId) => {
    if (!confirm('Delete this file?')) return;
    await api.delete(`/projects/${id}/files/${fileId}`);
    setDetail(d => ({ ...d, project: { ...d.project, files: d.project.files.filter(f => f._id !== fileId) } }));
  };

  const handleTicketSaved = (ticket, isNew) => {
    setDetail(d => ({ ...d, tickets: isNew ? [ticket, ...d.tickets] : d.tickets.map(t => t._id === ticket._id ? ticket : t) }));
    setShowTicketModal(false); setEditingTicket(null);
  };

  const handleTicketDelete = async (ticketId) => {
    if (!confirm('Delete this ticket?')) return;
    await api.delete(`/tickets/${ticketId}`);
    setDetail(d => ({ ...d, tickets: d.tickets.filter(t => t._id !== ticketId) }));
  };

  const handleMilestoneSaved = (milestone, isNew) => {
    setDetail(d => ({
      ...d,
      milestones: (isNew ? [...d.milestones, milestone] : d.milestones.map(m => m._id === milestone._id ? milestone : m))
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
    }));
    setShowMilestoneModal(false); setEditingMilestone(null);
  };

  const handleMilestoneDelete = async (milestoneId) => {
    if (!confirm('Delete this milestone?')) return;
    await api.delete(`/milestones/${milestoneId}`);
    setDetail(d => ({ ...d, milestones: d.milestones.filter(m => m._id !== milestoneId) }));
  };

  const handleMilestoneToggle = async (milestone) => {
    const { data } = await api.put(`/milestones/${milestone._id}`, { completed: !milestone.completed });
    setDetail(d => ({ ...d, milestones: d.milestones.map(m => m._id === milestone._id ? data : m) }));
  };

  const milestoneStatus = (m) => m.completed ? 'completed' : (new Date(m.dueDate) < new Date() ? 'overdue' : 'upcoming');

  if (loading) return <PageSpinner />;
  if (!project) return null;

  const isOwner = project.owner._id === user._id;
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'in-review': tasks.filter(t => t.status === 'in-review'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-8 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-1.5 text-[0.8rem] text-ink-muted"><Link to="/projects">Projects</Link> / {project.title}</div>
            <div className="mb-1 flex items-center gap-2.5">
              <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: project.color }} />
              <h1>{project.title}</h1>
              <span className={`${BADGE_BASE} ${PROJECT_STATUS_COLOR[project.status]}`}>{project.status}</span>
            </div>
            {project.description && <p className="text-ink-muted">{project.description}</p>}
          </div>
          <div className="flex items-center gap-2.5">
            <button className={BTN_PRIMARY} onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>+ Add Task</button>
            {isOwner && <button className={BTN_DANGER} onClick={handleDeleteProject}>Delete</button>}
          </div>
        </div>

        <div className="mb-5 flex gap-0 border-b-2 border-border">
          {['board', 'list', 'tickets', 'milestones', 'files', 'members'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`-mb-0.5 border-b-2 px-5 py-2 text-[0.9rem] font-medium transition-all ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'board' && (
          <KanbanBoard tasksByStatus={tasksByStatus} members={project.members}
            onStatusChange={handleStatusChange}
            onEdit={task => { setEditingTask(task); setShowTaskModal(true); }}
            onDelete={handleTaskDelete} />
        )}

        {activeTab === 'list' && (
          <div className={CARD}>
            <table className="w-full border-collapse text-sm [&_tr:last-child>td]:border-b-0">
              <thead><tr>
                <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Title</th>
                <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Status</th>
                <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Priority</th>
                <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Assignee</th>
                <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Due Date</th>
                <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted"></th>
              </tr></thead>
              <tbody>
                {tasks.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-ink-muted">No tasks yet</td></tr>
                  : tasks.map(t => (
                    <tr key={t._id} className="group">
                      <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas">{t.title}</td>
                      <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas"><span className={`${BADGE_BASE} ${TASK_STATUS_COLOR[t.status]}`}>{t.status}</span></td>
                      <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas"><span className={`${PRIORITY_BADGE_BASE} ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span></td>
                      <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas">{t.assignee ? t.assignee.name : '—'}</td>
                      <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas">
                        <div className="flex justify-end gap-1">
                          <button className="rounded px-2 py-1 text-xs font-medium hover:bg-canvas" onClick={() => { setEditingTask(t); setShowTaskModal(true); }}>Edit</button>
                          <button className="rounded px-2 py-1 text-xs font-medium hover:bg-canvas" onClick={() => handleTaskDelete(t._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className={CARD}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Tickets ({tickets.length})</h2>
              <button className={BTN_PRIMARY} onClick={() => { setEditingTicket(null); setShowTicketModal(true); }}>+ New Ticket</button>
            </div>
            {tickets.length === 0 ? (
              <div className="p-12 text-center"><p className="text-ink-muted">No tickets yet</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                {tickets.map(t => (
                  <div key={t._id} className="flex items-center gap-3 rounded-sm border border-border p-3">
                    <span className={`${BADGE_BASE} bg-slate-100 text-slate-600`}>{TICKET_TYPE_LABEL[t.type]}</span>
                    <div className="flex-1">
                      <div className="text-[0.9rem] font-medium text-ink">{t.title}</div>
                      <div className="text-xs text-ink-muted">Reported by {t.reporter?.name || 'Unknown'} · {t.assignee ? `Assigned to ${t.assignee.name}` : 'Unassigned'}</div>
                    </div>
                    <span className={`${PRIORITY_BADGE_BASE} ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                    <span className={`${BADGE_BASE} ${TICKET_STATUS_COLOR[t.status]}`}>{t.status}</span>
                    <button className="rounded px-2 py-1 text-xs font-medium hover:bg-canvas" onClick={() => { setEditingTicket(t); setShowTicketModal(true); }}>Edit</button>
                    <button className="rounded px-2 py-1 text-xs font-medium hover:bg-canvas" onClick={() => handleTicketDelete(t._id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'milestones' && (
          <div className={CARD}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Milestones ({milestones.length})</h2>
              <button className={BTN_PRIMARY} onClick={() => { setEditingMilestone(null); setShowMilestoneModal(true); }}>+ New Milestone</button>
            </div>
            {milestones.length === 0 ? (
              <div className="p-12 text-center"><p className="text-ink-muted">No milestones yet</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                {milestones.map(m => (
                  <div key={m._id} className="flex items-center gap-3 rounded-sm border border-border p-3">
                    <input type="checkbox" checked={m.completed} onChange={() => handleMilestoneToggle(m)} className="h-4 w-4 accent-primary" />
                    <div className="flex-1">
                      <div className={`text-[0.9rem] font-medium ${m.completed ? 'text-ink-muted line-through' : 'text-ink'}`}>{m.title}</div>
                      <div className="text-xs text-ink-muted">Due {new Date(m.dueDate).toLocaleDateString()}</div>
                    </div>
                    <span className={`${BADGE_BASE} ${MILESTONE_STATUS_COLOR[milestoneStatus(m)]}`}>{milestoneStatus(m)}</span>
                    <button className="rounded px-2 py-1 text-xs font-medium hover:bg-canvas" onClick={() => { setEditingMilestone(m); setShowMilestoneModal(true); }}>Edit</button>
                    <button className="rounded px-2 py-1 text-xs font-medium hover:bg-canvas" onClick={() => handleMilestoneDelete(m._id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className={CARD}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Files ({project.files.length})</h2>
              <label className={`${BTN_PRIMARY} cursor-pointer`}>
                {uploading ? 'Uploading...' : '+ Upload File'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
            {fileError && <div className={ALERT_ERROR}>{fileError}</div>}
            <p className="mb-4 text-xs text-ink-muted">Max file size: 10MB</p>
            {project.files.length === 0 ? (
              <div className="p-12 text-center"><p className="text-ink-muted">No files uploaded yet</p></div>
            ) : (
              <div className="flex flex-col gap-2">
                {project.files.map(f => (
                  <div key={f._id} className="flex items-center gap-3 rounded-sm border border-border p-3">
                    <span className={`${BADGE_BASE} bg-slate-100 text-slate-600`}>File</span>
                    <div className="flex-1">
                      <div className="text-[0.9rem] font-medium text-ink">{f.originalName}</div>
                      <div className="text-xs text-ink-muted">{formatBytes(f.size)} · Uploaded by {f.uploadedBy?.name || 'Unknown'} on {new Date(f.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button className="rounded px-2 py-1 text-xs font-medium hover:bg-canvas" onClick={() => handleFileDownload(f)}>Download</button>
                    <button className="rounded px-2 py-1 text-xs font-medium hover:bg-canvas" onClick={() => handleFileDelete(f._id)}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div className={CARD}>
            <h2 className="mb-4 text-base font-semibold text-ink">Team Members ({project.members.length})</h2>
            <div className="mb-6 flex flex-col gap-3">
              {project.members.map(m => (
                <div key={m.user._id} className="flex items-center gap-3.5 border-b border-border py-2.5 last:border-b-0">
                  <div className={AVATAR_MD}><span>{m.user.name[0]}</span></div>
                  <div><div className="text-[0.9rem] font-medium">{m.user.name}</div><div className="text-sm text-ink-muted">{m.user.email}</div></div>
                  <span className="ml-auto rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">{m.role}</span>
                </div>
              ))}
            </div>
            {isOwner && (
              <form onSubmit={handleAddMember} className="border-t border-border pt-5">
                <h3 className="mb-3">Add Member</h3>
                {memberError && <div className={ALERT_ERROR}>{memberError}</div>}
                <div className="flex gap-2.5">
                  <input type="email" placeholder="Enter email address" value={memberEmail} className={`flex-1 ${FORM_INPUT}`}
                    onChange={e => setMemberEmail(e.target.value)} required />
                  <button type="submit" className={BTN_PRIMARY}>Add</button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
      {showTaskModal && (
        <TaskModal projectId={id} members={project.members} task={editingTask}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSaved={handleTaskSaved} />
      )}
      {showTicketModal && (
        <TicketModal projectId={id} members={project.members} ticket={editingTicket}
          onClose={() => { setShowTicketModal(false); setEditingTicket(null); }}
          onSaved={handleTicketSaved} />
      )}
      {showMilestoneModal && (
        <MilestoneModal projectId={id} milestone={editingMilestone}
          onClose={() => { setShowMilestoneModal(false); setEditingMilestone(null); }}
          onSaved={handleMilestoneSaved} />
      )}
    </>
  );
}
