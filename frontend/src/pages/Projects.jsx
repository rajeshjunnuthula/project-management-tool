import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ProjectModal from '../components/ProjectModal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try { const { data } = await api.get('/projects'); setProjects(data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreated = (project) => { setProjects(prev => [project, ...prev]); setShowModal(false); };
  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <>
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Projects</h1>
            <p className="text-muted">{projects.length} total projects</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
        </div>
        <div className="filter-tabs">
          {['all', 'active', 'on-hold', 'completed', 'archived'].map(s => (
            <button key={s} className={`filter-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state card">
            <div className="empty-icon">📁</div>
            <h3>No projects found</h3>
            <p>Create a new project to get started</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
          </div>
        ) : (
          <div className="projects-grid">
            {filtered.map(p => (
              <Link key={p._id} to={`/projects/${p._id}`} className="project-card">
                <div className="project-card-header" style={{ background: p.color }}>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>
                <div className="project-card-body">
                  <h3>{p.title}</h3>
                  <p className="text-muted">{p.description || 'No description'}</p>
                  <div className="project-card-footer">
                    <div className="member-avatars">
                      {p.members.slice(0, 4).map(m => (
                        <div key={m.user._id} className="avatar-sm" title={m.user.name}>
                          <span>{m.user.name[0].toUpperCase()}</span>
                        </div>
                      ))}
                      {p.members.length > 4 && <div className="avatar-sm avatar-more">+{p.members.length - 4}</div>}
                    </div>
                    {p.deadline && <span className="text-muted text-sm">Due {new Date(p.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      {showModal && <ProjectModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
    </>
  );
}
