import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-logo">PM</Link>
        <span className="brand-name">Project Management Tool</span>
      </div>
      <div className="navbar-links">
        <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>🏠 Dashboard</Link>
        <Link to="/projects" className={`nav-link ${pathname.startsWith('/projects') ? 'active' : ''}`}>📁 Projects</Link>
      </div>
      <div className="navbar-user">
        <div className="avatar-sm avatar-nav"><span>{user?.name?.[0]?.toUpperCase()}</span></div>
        <span className="user-name">{user?.name}</span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
