import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import MilestoneModal from '../components/MilestoneModal';
import PageSpinner from '../components/PageSpinner';
import { BADGE_BASE, MILESTONE_STATUS_COLOR } from '../lib/badgeStyles';
import { BTN_PRIMARY, CARD, INFO_BADGE } from '../lib/ui';
import type { Milestone, Project } from '../types';

type MilestoneFilter = 'all' | 'upcoming' | 'overdue' | 'completed';
const FILTERS: MilestoneFilter[] = ['all', 'upcoming', 'overdue', 'completed'];

const milestoneStatus = (m: Milestone): 'completed' | 'overdue' | 'upcoming' =>
  m.completed ? 'completed' : (new Date(m.dueDate) < new Date() ? 'overdue' : 'upcoming');

interface MilestonesData {
  milestones: Milestone[];
  projects: Project[];
}

export default function Milestones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') as MilestoneFilter | null;
  const filter: MilestoneFilter = statusParam && FILTERS.includes(statusParam) ? statusParam : 'all';
  const [showModal, setShowModal] = useState(false);

  const { data, setData, loading } = useFetch<MilestonesData>(async () => {
    const [{ data: milestones }, { data: projects }] = await Promise.all([
      api.get('/milestones'),
      api.get('/projects'),
    ]);
    return { milestones, projects };
  }, []);
  const milestones = data?.milestones || [];
  const projects = data?.projects || [];
  const filtered = filter === 'all' ? milestones : milestones.filter(m => milestoneStatus(m) === filter);

  const handleCreated = (milestone: Milestone) => {
    setData(d => d && ({ ...d, milestones: [...d.milestones, milestone].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) }));
    setShowModal(false);
  };

  if (loading) return <PageSpinner />;

  return (
    <>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-8 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1">Milestones</h1>
            <p className="text-ink-muted">{filtered.length} milestone{filtered.length === 1 ? '' : 's'} across your projects</p>
          </div>
          <button className={BTN_PRIMARY} onClick={() => setShowModal(true)}>+ New Milestone</button>
        </div>
        <div className="mb-5 flex w-fit gap-1 rounded-sm border border-border bg-surface p-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setSearchParams(f === 'all' ? {} : { status: f })}
              className={`rounded-md px-4 py-1.5 text-[0.85rem] font-medium transition-all ${filter === f ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className={`${CARD} p-12 text-center`}>
            <h3 className="mb-2">No milestones found</h3>
            <p className="mb-5">{projects.length === 0 ? 'Create a project first to start setting milestones.' : 'Milestones set across all your projects will show up here.'}</p>
            {projects.length > 0 && <button className={BTN_PRIMARY} onClick={() => setShowModal(true)}>Create Milestone</button>}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(m => (
              <div key={m._id} className={`${CARD} flex items-center gap-3 p-3`}>
                <span className={`${BADGE_BASE} ${INFO_BADGE}`}>Milestone</span>
                <div className="flex-1">
                  <div className={`text-[0.9rem] font-medium ${m.completed ? 'text-ink-muted line-through' : 'text-ink'}`}>
                    {m.project ? <Link to={`/projects/${m.project._id}`} className="text-ink hover:underline">{m.title}</Link> : m.title}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {m.project && (
                      <span className="inline-flex items-center gap-1.5 mr-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: m.project.color }} />
                        {m.project.title}
                      </span>
                    )}
                    Due {new Date(m.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <span className={`${BADGE_BASE} ${MILESTONE_STATUS_COLOR[milestoneStatus(m)]}`}>{milestoneStatus(m)}</span>
              </div>
            ))}
          </div>
        )}
      </main>
      {showModal && <MilestoneModal projects={projects} onClose={() => setShowModal(false)} onSaved={handleCreated} />}
    </>
  );
}
