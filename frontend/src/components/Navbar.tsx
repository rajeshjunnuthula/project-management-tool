import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  const linkClass = (active: boolean) =>
    `flex items-center gap-1.5 rounded-sm px-3.5 py-1.5 text-[0.9rem] font-medium no-underline transition-all hover:bg-canvas hover:text-ink hover:no-underline ${active ? 'bg-primary-light text-primary' : 'text-ink-muted'}`;

  return (
    <nav className="sticky top-0 z-[100] flex h-15 items-center gap-8 border-b border-border bg-surface px-8 shadow-sm">
      <div className="flex items-center gap-2.5">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-sm font-extrabold text-white no-underline">PM</Link>
        <span className="text-[1.1rem] font-bold text-ink">Project Management Tool</span>
      </div>
      <div className="flex flex-1 gap-1">
        <Link to="/" className={linkClass(pathname === '/')}>Dashboard</Link>
        <Link to="/projects" className={linkClass(pathname.startsWith('/projects'))}>Projects</Link>
        <Link to="/my-tasks" className={linkClass(pathname === '/my-tasks')}>My Tasks</Link>
        <Link to="/tickets" className={linkClass(pathname === '/tickets')}>Tickets</Link>
        <Link to="/milestones" className={linkClass(pathname === '/milestones')}>Milestones</Link>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-bold text-white">
          <span>{user?.name?.[0]?.toUpperCase()}</span>
        </div>
        <span className="text-sm font-medium">{user?.name}</span>
        <button className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-transparent px-2.5 py-1.5 text-[0.8rem] font-medium text-ink-muted transition-all hover:bg-canvas" onClick={toggleTheme}>
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-transparent px-2.5 py-1.5 text-[0.8rem] font-medium text-ink-muted transition-all hover:bg-canvas" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
