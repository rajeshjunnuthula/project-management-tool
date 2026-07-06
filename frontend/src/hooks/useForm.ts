import { useState } from 'react';

export function useForm<T extends Record<string, unknown>>(initial: T) {
  const [form, setForm] = useState<T>(initial);
  const set = <K extends keyof T>(key: K, val: T[K]) => setForm(f => ({ ...f, [key]: val }));
  const reset = () => setForm(initial);
  return { form, set, reset, setForm };
}
