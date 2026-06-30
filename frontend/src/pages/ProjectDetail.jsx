import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('board');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');

  useEffect(() => { loadAll(); }, [id]);

  const loadAll = async () => {
    try {
      const [{ data: proj }, { data: taskList }] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ]);
      setProject(proj); setTasks(taskList);
    } catch { navigate('/projects'); }
    finally { setLoading(false); }
  };

  const handleTaskSaved = (task, isNew) => {
    setTasks(prev => isNew ? [...prev, task] : prev.map(t => t._id === task._id ? task : t));
    setShowTaskModal(false); setEditingTask(null);
  };

  const handleTaskDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  const handleStatusChange = async (taskId, newStatus) => {
    const { data } = await api.put(`/tasks/${taskId}`, { status: newStatus });
    setTasks(prev => prev.map(t => t._id === taskId ? data : t));
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setMemberError('');
    try {
      const { data } = await api.post(`/projects/${id}/members`, { email: memberEmail });
      setProject(data); setMemberEmail('');
    } catch (err) { setMemberError(err.response?.data?.message || 'Failed to add member'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!project) return null;

  const isOwner = project.owner._id === user._id;
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    'in-review': tasks.filter(t => t.status === 'in-review'),
    done: tasks.filter(t => t.status === 'done'),
  };

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="breadcrumb"><Link to="/projects">Projects</Link> / {project.title}</div>
            <div className="project-title-row">
              <span className="project-color-dot" style={{ background: project.color }} />
              <h1>{project.title}</h1>
              <span className={`badge badge-${project.status}`}>{project.status}</span>
            </div>
            {project.description && <p className="text-muted">{project.description}</p>}
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => { setEditingTask(null); setShowTaskModal(true); }}>+ Add Task</button>
            {isOwner && <button className="btn btn-danger" onClick={handleDeleteProject}>Delete</button>}
          </div>
        </div>

        <div className="tabs">
          {['board', 'list', 'members'].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
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
          <div className="card">
            <table className="task-table">
              <thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due Date</th><th></th></tr></thead>
              <tbody>
                {tasks.length === 0 ? <tr><td colSpan={6} className="empty-cell">No tasks yet</td></tr>
                  : tasks.map(t => (
                    <tr key={t._id}>
                      <td>{t.title}</td>
                      <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                      <td><span className={`priority-badge priority-${t.priority}`}>{t.priority}</span></td>
                      <td>{t.assignee ? t.assignee.name : '—'}</td>
                      <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                      <td className="table-actions">
                        <button className="icon-btn" onClick={() => { setEditingTask(t); setShowTaskModal(true); }}>✏️</button>
                        <button className="icon-btn" onClick={() => handleTaskDelete(t._id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="card">
            <h2 className="section-title">Team Members ({project.members.length})</h2>
            <div className="members-list">
              {project.members.map(m => (
                <div key={m.user._id} className="member-row">
                  <div className="avatar-md"><span>{m.user.name[0]}</span></div>
                  <div><div className="member-name">{m.user.name}</div><div className="text-muted text-sm">{m.user.email}</div></div>
                  <span className="member-role-badge">{m.role}</span>
                </div>
              ))}
            </div>
            {isOwner && (
              <form onSubmit={handleAddMember} className="add-member-form">
                <h3>Add Member</h3>
                {memberError && <div className="alert alert-error">{memberError}</div>}
                <div className="input-row">
                  <input type="email" placeholder="Enter email address" value={memberEmail}
                    onChange={e => setMemberEmail(e.target.value)} required />
                  <button type="submit" className="btn btn-primary">Add</button>
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
    </div>
  );
}
