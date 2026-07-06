import { useState } from 'react';

export function useForm(initial) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const reset = () => setForm(initial);
  return { form, set, reset, setForm };
}
