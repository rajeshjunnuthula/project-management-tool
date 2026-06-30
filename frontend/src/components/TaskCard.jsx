const PRIORITY_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444', urgent: '#7c3aed' };

export default function TaskCard({ task, isDragging, onDragStart, onDragEnd, onEdit, onDelete }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  return (
    <div className={`task-card ${isDragging ? 'dragging' : ''}`} draggable onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="task-card-header">
        <span className="priority-indicator" style={{ background: PRIORITY_COLOR[task.priority] }} title={`Priority: ${task.priority}`} />
        <div className="task-card-actions">
          <button className="icon-btn-sm" onClick={e => { e.stopPropagation(); onEdit(); }}>✏️</button>
          <button className="icon-btn-sm" onClick={e => { e.stopPropagation(); onDelete(); }}>🗑️</button>
        </div>
      </div>
      <p className="task-card-title">{task.title}</p>
      {task.description && <p className="task-card-desc">{task.description.slice(0, 80)}{task.description.length > 80 ? '…' : ''}</p>}
      {task.labels?.length > 0 && (
        <div className="task-labels">{task.labels.map(l => <span key={l} className="task-label">{l}</span>)}</div>
      )}
      <div className="task-card-footer">
        {task.assignee
          ? <div className="avatar-xs" title={task.assignee.name}><span>{task.assignee.name[0]}</span></div>
          : <span className="text-muted text-xs">Unassigned</span>}
        {task.dueDate && <span className={`due-date ${isOverdue ? 'overdue' : ''}`}>📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
      </div>
      {task.comments?.length > 0 && <div className="task-comment-count">💬 {task.comments.length}</div>}
    </div>
  );
}
