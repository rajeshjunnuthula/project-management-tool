import { useState } from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#94a3b8' },
  { key: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { key: 'in-review', label: 'In Review', color: '#f59e0b' },
  { key: 'done', label: 'Done', color: '#22c55e' },
];

export default function KanbanBoard({ tasksByStatus, members, onStatusChange, onEdit, onDelete }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDragStart = (e, task) => { setDragging(task); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e, colKey) => { e.preventDefault(); setDragOver(colKey); };
  const handleDrop = (e, colKey) => {
    e.preventDefault();
    if (dragging && dragging.status !== colKey) onStatusChange(dragging._id, colKey);
    setDragging(null); setDragOver(null);
  };

  return (
    <div className="kanban-board">
      {COLUMNS.map(col => (
        <div key={col.key} className={`kanban-column ${dragOver === col.key ? 'drag-over' : ''}`}
          onDragOver={e => handleDragOver(e, col.key)}
          onDrop={e => handleDrop(e, col.key)}
          onDragLeave={() => setDragOver(null)}>
          <div className="kanban-column-header" style={{ borderTop: `3px solid ${col.color}` }}>
            <span className="column-label">{col.label}</span>
            <span className="column-count">{(tasksByStatus[col.key] || []).length}</span>
          </div>
          <div className="kanban-cards">
            {(tasksByStatus[col.key] || []).map(task => (
              <TaskCard key={task._id} task={task} isDragging={dragging?._id === task._id}
                onDragStart={e => handleDragStart(e, task)}
                onDragEnd={() => { setDragging(null); setDragOver(null); }}
                onEdit={() => onEdit(task)} onDelete={() => onDelete(task._id)} />
            ))}
            {(tasksByStatus[col.key] || []).length === 0 && <div className="kanban-empty">Drop tasks here</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
