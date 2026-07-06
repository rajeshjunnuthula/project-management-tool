import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import PageSpinner from '../components/PageSpinner';
import { BADGE_BASE, PRIORITY_DOT, PROJECT_STATUS_COLOR, STATUS_PILL_BASE, TASK_STATUS_COLOR } from '../lib/badgeStyles';
import { BTN_PRIMARY, CARD } from '../lib/ui';

const STATS_ICON_BG = [
  'bg-primary-light text-primary dark:text-indigo-300',
  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading } = useFetch(async () => {
    const [{ data: projs }, { data: myTasks }, { data: tickets }, { data: milestones }] = await Promise.all([
      api.get('/projects'),
      api.get('/tasks?mine=true'),
      api.get('/tickets'),
      api.get('/milestones'),
    ]);
    return { projects: projs, myTasks, tickets, milestones };
  }, []);
  const projects = data?.projects || [];
  const myTasks = data?.myTasks || [];
  const tickets = data?.tickets || [];
  const milestones = data?.milestones || [];

  const overdueTasks = myTasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done');
  const openTickets = tickets.filter(t => t.status === 'open');
  const upcomingMilestones = milestones.filter(m => !m.completed && new Date(m.dueDate) >= new Date());
  const stats = [
    { label: 'Total Projects', value: projects.length, icon: 'TP', to: '/projects' },
    { label: 'Active', value: projects.filter(p => p.status === 'active').length, icon: 'ACT', to: '/projects?status=active' },
    { label: 'My Tasks', value: myTasks.length, icon: 'MT', to: '/my-tasks' },
    { label: 'Overdue', value: overdueTasks.length, icon: 'OD', to: '/my-tasks?filter=overdue' },
    { label: 'Open Tickets', value: openTickets.length, icon: 'OT', to: '/tickets?status=open' },
    { label: 'Milestones', value: upcomingMilestones.length, icon: 'MS', to: '/milestones?status=upcoming' },
  ];

  if (loading) return <PageSpinner />;

  return (
    <main className="mx-auto w-full max-w-[1400px] flex-1 px-8 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1">Good {getGreeting()}, {user.name.split(' ')[0]}</h1>
            <p className="text-ink-muted">Here&apos;s what&apos;s happening with your projects</p>
          </div>
          <Link to="/projects" className={BTN_PRIMARY}>+ New Project</Link>
        </div>
        <div className="mb-6 grid grid-cols-3 gap-4 max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1">
          {stats.map((s, i) => (
            <Link key={s.label} to={s.to} className="flex items-center gap-4 rounded-xl border border-border bg-surface p-5 text-ink shadow-sm no-underline transition-all hover:-translate-y-0.5 hover:shadow-md hover:no-underline">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${STATS_ICON_BG[i]}`}>{s.icon}</div>
              <div><div className="text-3xl font-semibold leading-none text-ink">{s.value}</div><div className="mt-1.5 text-[0.8rem] text-ink-muted">{s.label}</div></div>
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5">
          <section className={CARD}>
            <h2 className="mb-4 text-base font-semibold text-ink">Recent Projects</h2>
            {projects.length === 0 ? (
              <div className="p-12 text-center"><p>No projects yet. <Link to="/projects">Create your first project</Link></p></div>
            ) : projects.slice(0, 5).map(p => (
              <Link key={p._id} to={`/projects/${p._id}`} className="flex items-center gap-3 rounded-sm px-2 py-2.5 text-ink no-underline transition-colors hover:bg-canvas hover:no-underline">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
                <div className="flex-1">
                  <span className="block text-[0.9rem] font-medium">{p.title}</span>
                  <span className="text-xs text-ink-muted">{p.members.length} members</span>
                </div>
                <span className={`${BADGE_BASE} ${PROJECT_STATUS_COLOR[p.status]}`}>{p.status}</span>
              </Link>
            ))}
          </section>
          <section className={CARD}>
            <h2 className="mb-4 text-base font-semibold text-ink">My Tasks</h2>
            {myTasks.length === 0 ? (
              <div className="p-12 text-center"><p>No tasks assigned to you</p></div>
            ) : myTasks.slice(0, 6).map(t => (
              <div key={t._id} className="flex items-center gap-2.5 rounded-sm p-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[t.priority]}`} />
                <div className="flex-1">
                  <span className="text-sm text-ink">{t.title}</span>
                  {t.dueDate && <span className={`ml-1.5 text-xs text-ink-muted ${new Date(t.dueDate) < new Date() ? 'text-danger' : ''}`}>{new Date(t.dueDate).toLocaleDateString()}</span>}
                </div>
                <span className={`${STATUS_PILL_BASE} ${TASK_STATUS_COLOR[t.status]}`}>{t.status}</span>
              </div>
            ))}
          </section>
        </div>
    </main>
  );
}
