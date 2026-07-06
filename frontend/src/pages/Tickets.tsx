import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import TicketModal from '../components/TicketModal';
import PageSpinner from '../components/PageSpinner';
import { BADGE_BASE, PRIORITY_BADGE_BASE, PRIORITY_COLOR, TICKET_STATUS_COLOR, TICKET_TYPE_LABEL } from '../lib/badgeStyles';
import { BTN_PRIMARY, CARD, NEUTRAL_BADGE } from '../lib/ui';
import type { Project, Ticket, TicketStatus } from '../types';

const FILTERS: ('all' | TicketStatus)[] = ['all', 'open', 'in-progress', 'resolved', 'closed'];

interface TicketsData {
  tickets: Ticket[];
  projects: Project[];
}

export default function Tickets() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') as TicketStatus | null;
  const filter: 'all' | TicketStatus = statusParam && FILTERS.includes(statusParam) ? statusParam : 'all';
  const [showModal, setShowModal] = useState(false);

  const { data, setData, loading } = useFetch<TicketsData>(async () => {
    const [{ data: tickets }, { data: projects }] = await Promise.all([
      api.get('/tickets'),
      api.get('/projects'),
    ]);
    return { tickets, projects };
  }, []);
  const tickets = data?.tickets || [];
  const projects = data?.projects || [];
  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const handleCreated = (ticket: Ticket) => {
    setData(d => d && ({ ...d, tickets: [ticket, ...d.tickets] }));
    setShowModal(false);
  };

  if (loading) return <PageSpinner />;

  return (
    <>
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-8 py-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="mb-1">Tickets</h1>
            <p className="text-ink-muted">{filtered.length} ticket{filtered.length === 1 ? '' : 's'} across your projects</p>
          </div>
          <button className={BTN_PRIMARY} onClick={() => setShowModal(true)}>+ New Ticket</button>
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
            <h3 className="mb-2">No tickets found</h3>
            <p className="mb-5">{projects.length === 0 ? 'Create a project first to start filing tickets.' : 'Tickets reported across all your projects will show up here.'}</p>
            {projects.length > 0 && <button className={BTN_PRIMARY} onClick={() => setShowModal(true)}>Create Ticket</button>}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(t => (
              <div key={t._id} className={`${CARD} flex items-center gap-3 p-3`}>
                <span className={`${BADGE_BASE} ${NEUTRAL_BADGE}`}>{TICKET_TYPE_LABEL[t.type]}</span>
                <div className="flex-1">
                  <div className="text-[0.9rem] font-medium text-ink">
                    {t.project ? <Link to={`/projects/${t.project._id}`} className="text-ink hover:underline">{t.title}</Link> : t.title}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {t.project && (
                      <span className="inline-flex items-center gap-1.5 mr-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.project.color }} />
                        {t.project.title}
                      </span>
                    )}
                    Reported by {t.reporter?.name || 'Unknown'} · {t.assignee ? `Assigned to ${t.assignee.name}` : 'Unassigned'}
                  </div>
                </div>
                <span className={`${PRIORITY_BADGE_BASE} ${PRIORITY_COLOR[t.priority]}`}>{t.priority}</span>
                <span className={`${BADGE_BASE} ${TICKET_STATUS_COLOR[t.status]}`}>{t.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
      {showModal && <TicketModal projects={projects} onClose={() => setShowModal(false)} onSaved={handleCreated} />}
    </>
  );
}
