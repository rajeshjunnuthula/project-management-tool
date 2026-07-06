import { PRIORITY_DOT } from '../lib/badgeStyles';
import { AVATAR_XS } from '../lib/ui';

export default function TaskCard({ task, isDragging, onDragStart, onDragEnd, onEdit, onDelete }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  return (
    <div className={`group cursor-grab select-none rounded-sm border border-border bg-surface p-3 transition-shadow hover:shadow-md ${isDragging ? 'cursor-grabbing opacity-50' : ''}`}
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="mb-2 flex items-center justify-between">
        <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority]}`} title={`Priority: ${task.priority}`} />
        <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="rounded px-1.5 py-0.5 text-xs font-medium opacity-70 hover:bg-canvas hover:opacity-100" onClick={e => { e.stopPropagation(); onEdit(); }}>Edit</button>
          <button className="rounded px-1.5 py-0.5 text-xs font-medium opacity-70 hover:bg-canvas hover:opacity-100" onClick={e => { e.stopPropagation(); onDelete(); }}>Delete</button>
        </div>
      </div>
      <p className="mb-1 text-sm font-medium leading-snug text-ink">{task.title}</p>
      {task.description && <p className="mb-2 text-[0.78rem] text-ink-muted">{task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}</p>}
      {task.labels?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">{task.labels.map(l => <span key={l} className="rounded-full bg-primary-light px-2 py-px text-[0.7rem] font-medium text-primary">{l}</span>)}</div>
      )}
      <div className="flex items-center justify-between">
        {task.assignee
          ? <div className={AVATAR_XS} title={task.assignee.name}><span>{task.assignee.name[0]}</span></div>
          : <span className="text-xs text-ink-muted">Unassigned</span>}
        {task.dueDate && <span className={`text-[0.72rem] text-ink-muted ${isOverdue ? 'text-danger' : ''}`}>Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
      </div>
      {task.comments?.length > 0 && <div className="mt-1.5 text-[0.72rem] text-ink-muted">{task.comments.length} comment{task.comments.length === 1 ? '' : 's'}</div>}
    </div>
  );
}
