import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', urgent: '#7c3aed' };
const STATUS_COLOR = { todo: '#94a3b8', 'in-progress': '#3b82f6', 'in-review': '#f59e0b', done: '#22c55e' };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: projs } = await api.get('/projects');
        setProjects(projs);
        const results = await Promise.all(projs.slice(0, 5).map(p => api.get(`/tasks?project=${p._id}`)));
        setTasks(results.flatMap(r => r.data));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const myTasks = tasks.filter(t => t.assignee?._id === user._id);
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
  const stats = [
    { label: 'Total Projects', value: projects.length, icon: '📁', color: '#6366f1' },
    { label: 'Active', value: projects.filter(p => p.status === 'active').length, icon: '🚀', color: '#22c55e' },
    { label: 'My Tasks', value: myTasks.length, icon: '✅', color: '#3b82f6' },
    { label: 'Overdue', value: overdueTasks.length, icon: '⚠️', color: '#ef4444' },
  ];

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Good {getGreeting()}, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-muted">Here&apos;s what&apos;s happening with your projects</p>
          </div>
          <Link to="/projects" className="btn btn-primary">+ New Project</Link>
        </div>
        <div className="stats-grid">
          {stats.map(s => (
            <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="stat-icon">{s.icon}</div>
              <div><div className="stat-value">{s.value}</div><div className="stat-label">{s.label}</div></div>
            </div>
          ))}
        </div>
        <div className="dashboard-grid">
          <section className="card">
            <h2 className="section-title">Recent Projects</h2>
            {projects.length === 0 ? (
              <div className="empty-state"><p>No projects yet. <Link to="/projects">Create your first project</Link></p></div>
            ) : projects.slice(0, 5).map(p => (
              <Link key={p._id} to={`/projects/${p._id}`} className="project-row">
                <span className="project-dot" style={{ background: p.color }} />
                <div className="project-row-info">
                  <span className="project-row-title">{p.title}</span>
                  <span className="project-row-meta">{p.members.length} members</span>
                </div>
                <span className={`badge badge-${p.status}`}>{p.status}</span>
              </Link>
            ))}
          </section>
          <section className="card">
            <h2 className="section-title">My Tasks</h2>
            {myTasks.length === 0 ? (
              <div className="empty-state"><p>No tasks assigned to you</p></div>
            ) : myTasks.slice(0, 6).map(t => (
              <div key={t._id} className="task-row">
                <span className="priority-dot" style={{ background: PRIORITY_COLOR[t.priority] }} />
                <div className="task-row-info">
                  <span className="task-row-title">{t.title}</span>
                  {t.dueDate && <span className={`task-due ${new Date(t.dueDate) < new Date() ? 'overdue' : ''}`}>{new Date(t.dueDate).toLocaleDateString()}</span>}
                </div>
                <span className="status-badge" style={{ background: STATUS_COLOR[t.status] + '22', color: STATUS_COLOR[t.status] }}>{t.status}</span>
              </div>
            ))}
          </section>
        </div>
    </main>
  );
}
