import { useState } from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'todo', label: 'To Do', border: 'border-t-slate-400' },
  { key: 'in-progress', label: 'In Progress', border: 'border-t-blue-500' },
  { key: 'in-review', label: 'In Review', border: 'border-t-amber-500' },
  { key: 'done', label: 'Done', border: 'border-t-green-500' },
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
    <div className="grid grid-cols-4 items-start gap-4 max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1">
      {COLUMNS.map(col => (
        <div key={col.key}
          className={`min-h-[400px] rounded-xl border border-border transition-colors ${dragOver === col.key ? 'border-primary bg-primary-light' : 'bg-canvas'}`}
          onDragOver={e => handleDragOver(e, col.key)}
          onDrop={e => handleDrop(e, col.key)}
          onDragLeave={() => setDragOver(null)}>
          <div className={`flex items-center justify-between border-t-[3px] px-4 pb-3 pt-3.5 ${col.border}`}>
            <span className="text-[0.85rem] font-semibold text-ink">{col.label}</span>
            <span className="rounded-full border border-border bg-surface px-2 py-px text-xs font-semibold text-ink-muted">{(tasksByStatus[col.key] || []).length}</span>
          </div>
          <div className="flex flex-col gap-2 px-3 pb-3 pt-2">
            {(tasksByStatus[col.key] || []).map(task => (
              <TaskCard key={task._id} task={task} isDragging={dragging?._id === task._id}
                onDragStart={e => handleDragStart(e, task)}
                onDragEnd={() => { setDragging(null); setDragOver(null); }}
                onEdit={() => onEdit(task)} onDelete={() => onDelete(task._id)} />
            ))}
            {(tasksByStatus[col.key] || []).length === 0 && <div className="rounded-sm border-2 border-dashed border-border p-5 text-center text-[0.8rem] text-ink-light">Drop tasks here</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
