export const BTN = 'inline-flex items-center gap-1.5 rounded-sm px-4 py-2 text-sm font-medium transition-all';
export const BTN_PRIMARY = `${BTN} bg-primary text-white enabled:hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60`;
export const BTN_GHOST = `${BTN} border border-border bg-transparent text-ink-muted hover:bg-canvas`;
export const BTN_DANGER = `${BTN} bg-danger text-white hover:bg-red-600`;
export const BTN_FULL = 'w-full justify-center py-2.5';
export const BTN_SM = 'px-2.5 py-1.5 text-[0.8rem]';

export const FORM_GROUP = 'flex flex-col gap-1.5';
export const FORM_LABEL = 'text-sm font-medium text-ink';
export const FORM_INPUT = 'rounded-sm border border-border bg-surface px-3 py-2.5 text-[0.9rem] text-ink outline-none transition-colors focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-light)]';
export const FORM_ROW = 'grid grid-cols-2 gap-4';

export const ALERT_ERROR = 'mb-3 rounded-sm border border-red-300 bg-danger-light px-3.5 py-2.5 text-sm text-red-700 dark:border-red-800 dark:text-red-300';

export const CARD = 'rounded-xl border border-border bg-surface p-6 shadow-sm';

export const NEUTRAL_BADGE = 'bg-slate-100 text-slate-600 dark:bg-slate-700/60 dark:text-slate-300';
export const INFO_BADGE = 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300';

export const AVATAR_XS = 'flex h-[22px] w-[22px] items-center justify-center overflow-hidden rounded-full bg-primary-light text-[10px] font-bold text-primary dark:text-indigo-300';
export const AVATAR_SM = 'flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full bg-primary-light text-xs font-bold text-primary dark:text-indigo-300';
export const AVATAR_MD = 'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary-light text-base font-bold text-primary dark:text-indigo-300';
export const AVATAR_STACK = '[&>*]:border-2 [&>*]:border-surface [&>*:not(:first-child)]:-ml-1.5';

export const MODAL_OVERLAY = 'fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-5';
export const MODAL = 'w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-lg';
export const MODAL_HEADER = 'flex items-center justify-between px-6 pt-5';
export const MODAL_CLOSE = 'rounded-sm bg-transparent px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-canvas';
export const MODAL_BODY = 'flex flex-col gap-4 p-6';
export const MODAL_FOOTER = 'flex justify-end gap-2.5 border-t border-border px-6 py-4';
