import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { ALERT_ERROR, BTN_FULL, BTN_PRIMARY, FORM_GROUP, FORM_INPUT, FORM_LABEL } from '../lib/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { form, set } = useForm({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#667eea22,#764ba222)] p-5">
      <div className="w-full max-w-[420px] rounded-2xl bg-surface p-10 shadow-lg">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-xl bg-primary text-[18px] font-extrabold text-white">PM</div>
          <h1 className="mb-1 text-2xl">Welcome back</h1>
          <p className="text-[0.9rem]">Sign in to your account</p>
        </div>
        {error && <div className={ALERT_ERROR}>{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className={FORM_GROUP}>
            <label className={FORM_LABEL}>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} className={FORM_INPUT}
              onChange={(e) => set('email', e.target.value)} required />
          </div>
          <div className={FORM_GROUP}>
            <label className={FORM_LABEL}>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} className={FORM_INPUT}
              onChange={(e) => set('password', e.target.value)} required />
          </div>
          <button type="submit" className={`${BTN_PRIMARY} ${BTN_FULL}`} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-muted">Don&apos;t have an account? <Link to="/register">Create one</Link></p>
      </div>
    </div>
  );
}
