export const BADGE_BASE = 'inline-block rounded-full px-2.5 py-0.5 text-[0.72rem] font-semibold uppercase tracking-wide';
export const PRIORITY_BADGE_BASE = 'inline-block rounded-full px-2 py-0.5 text-[0.72rem] font-semibold';
export const STATUS_PILL_BASE = 'rounded-full px-2 py-0.5 text-[0.7rem] font-medium';

export const PROJECT_STATUS_COLOR = {
  active: 'bg-green-100 text-green-700',
  'on-hold': 'bg-yellow-100 text-yellow-700',
  completed: 'bg-sky-100 text-sky-700',
  archived: 'bg-slate-100 text-slate-500',
};

export const TASK_STATUS_COLOR = {
  todo: 'bg-slate-100 text-slate-500',
  'in-progress': 'bg-blue-100 text-blue-700',
  'in-review': 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
};

export const TASK_STATUS_DOT = {
  todo: 'bg-slate-400',
  'in-progress': 'bg-blue-500',
  'in-review': 'bg-amber-500',
  done: 'bg-green-500',
};

export const PRIORITY_COLOR = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
  urgent: 'bg-violet-100 text-violet-700',
};

export const PRIORITY_DOT = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
  urgent: 'bg-violet-600',
};

export const TICKET_STATUS_COLOR = {
  open: 'bg-red-100 text-red-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
};

export const TICKET_TYPE_LABEL = {
  bug: 'Bug',
  feature: 'Feature',
  question: 'Question',
  other: 'Other',
};

export const MILESTONE_STATUS_COLOR = {
  upcoming: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
};
