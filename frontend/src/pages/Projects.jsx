import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProjectModal from '../components/ProjectModal';
import { useFetch } from '../hooks/useFetch';
import PageSpinner from '../components/PageSpinner';
import { BADGE_BASE, PROJECT_STATUS_COLOR } from '../lib/badgeStyles';
import { AVATAR_SM, AVATAR_STACK, BTN_PRIMARY, CARD } from '../lib/ui';

const STATUSES = ['all', 'active', 'on-hold', 'completed', 'archived'];

export default function Projects() {
  const { data, setData, loading } = useFetch(() => api.get('/projects').then(r => r.data), []);
  const projects = data || [];
  const [showModal, setShowModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = STATUSES.includes(searchParams.get('status')) ? searchParams.get('status') : 'all';

  const handleCreated = (project) => { setData(prev => [project, ...(prev || [])]); setShowModal(false); };
  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  if (loading) return <PageSpinner />;

  return (
    <>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-8 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1">Projects</h1>
            <p className="text-ink-muted">{projects.length} total projects</p>
          </div>
          <button className={BTN_PRIMARY} onClick={() => setShowModal(true)}>+ New Project</button>
        </div>
        <div className="mb-5 flex w-fit gap-1 rounded-sm border border-border bg-surface p-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setSearchParams(s === 'all' ? {} : { status: s })}
              className={`rounded-md px-4 py-1.5 text-[0.85rem] font-medium transition-all ${filter === s ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <h3 className="mb-2">No projects found</h3>
            <p className="mb-5">Create a new project to get started</p>
            <button className={BTN_PRIMARY} onClick={() => setShowModal(true)}>Create Project</button>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
            {filtered.map(p => (
              <Link key={p._id} to={`/projects/${p._id}`} className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface text-ink no-underline transition-all hover:-translate-y-0.5 hover:shadow-md hover:no-underline">
                <div className="flex h-[70px] items-start p-2.5" style={{ background: p.color }}>
                  <span className={`${BADGE_BASE} ${PROJECT_STATUS_COLOR[p.status]}`}>{p.status}</span>
                </div>
                <div className="flex-1 p-4">
                  <h3 className="mb-1.5">{p.title}</h3>
                  <p className="mb-3.5 text-[0.85rem] text-ink-muted">{p.description || 'No description'}</p>
                  <div className="flex items-center justify-between">
                    <div className={`flex ${AVATAR_STACK}`}>
                      {p.members.slice(0, 4).map(m => (
                        <div key={m.user._id} className={AVATAR_SM} title={m.user.name}>
                          <span>{m.user.name[0].toUpperCase()}</span>
                        </div>
                      ))}
                      {p.members.length > 4 && <div className={`${AVATAR_SM} bg-border text-ink-muted`}>+{p.members.length - 4}</div>}
                    </div>
                    {p.deadline && <span className="text-sm text-ink-muted">Due {new Date(p.deadline).toLocaleDateString()}</span>}
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
