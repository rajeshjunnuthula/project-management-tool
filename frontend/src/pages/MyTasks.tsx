import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import PageSpinner from '../components/PageSpinner';
import { BADGE_BASE, PRIORITY_BADGE_BASE, PRIORITY_COLOR, TASK_STATUS_COLOR } from '../lib/badgeStyles';
import { CARD } from '../lib/ui';
import type { ProjectRef, Task } from '../types';

export default function MyTasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get('filter') === 'overdue' ? 'overdue' : 'all';

  const { data, loading } = useFetch<Task[]>(() => api.get('/tasks?mine=true').then(r => r.data), []);
  const tasks = data || [];
  const isOverdue = (t: Task) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done';
  const filtered = filter === 'overdue' ? tasks.filter(isOverdue) : tasks;

  if (loading) return <PageSpinner />;

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-8 py-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="mb-1">My Tasks</h1>
          <p className="text-ink-muted">{filtered.length} {filter === 'overdue' ? 'overdue' : 'total'} task{filtered.length === 1 ? '' : 's'} assigned to you</p>
        </div>
      </div>
      <div className="mb-5 flex w-fit gap-1 rounded-sm border border-border bg-surface p-1">
        {['all', 'overdue'].map(f => (
          <button key={f} onClick={() => setSearchParams(f === 'all' ? {} : { filter: f })}
            className={`rounded-md px-4 py-1.5 text-[0.85rem] font-medium transition-all ${filter === f ? 'bg-primary text-white' : 'text-ink-muted hover:text-ink'}`}>
            {f === 'all' ? 'All' : 'Overdue'}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className={`${CARD} p-12 text-center`}>
          <h3 className="mb-2">{filter === 'overdue' ? 'Nothing overdue' : 'No tasks assigned to you'}</h3>
          <p>{filter === 'overdue' ? "You're all caught up." : 'Tasks assigned to you across all projects will show up here.'}</p>
        </div>
      ) : (
        <div className={CARD}>
          <table className="w-full border-collapse text-sm [&_tr:last-child>td]:border-b-0">
            <thead><tr>
              <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Task</th>
              <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Project</th>
              <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Status</th>
              <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Priority</th>
              <th className="border-b border-border px-3 py-2.5 text-left text-[0.78rem] font-semibold uppercase tracking-wide text-ink-muted">Due Date</th>
            </tr></thead>
            <tbody>
              {filtered.map(t => {
                const project = t.project as ProjectRef;
                return (
                  <tr key={t._id} className="group">
                    <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas">
                      {project ? <Link to={`/projects/${project._id}`} className="text-ink hover:underline">{t.title}</Link> : t.title}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas">
                      {project && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: project.color }} />
                          {project.title}
                        </span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas"><span className={`${BADGE_BASE} ${TASK_STATUS_COLOR[t.status]}`}>{t.status}</span></td>
                    <td className="border-b border-border px-3 py-3 text-ink group-hover:bg-canvas"><span className={`${PRIORITY_BADGE_BASE} ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span></td>
                    <td className={`border-b border-border px-3 py-3 group-hover:bg-canvas ${isOverdue(t) ? 'text-danger' : 'text-ink'}`}>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
