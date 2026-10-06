import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { section: 'Overview' },
  { path: '/', icon: '📊', label: 'Dashboard', end: true },
  { path: '/profile', icon: '👤', label: 'My Profile' },
  { section: 'Preparation' },
  { path: '/assessment', icon: '📝', label: 'Assessment' },
  { path: '/aptitude', icon: '🧠', label: 'Aptitude' },
  { path: '/tasks', icon: '✅', label: 'Daily Tasks' },
  { path: '/coding', icon: '💻', label: 'Coding Platform' },
  { path: '/tests', icon: '📋', label: 'Weekly Tests' },
  { path: '/interview', icon: '🎤', label: 'Mock Interview' },
  { path: '/roadmaps', icon: '🗺️', label: 'Roadmaps' },
  { section: 'Analytics' },
  { path: '/progress', icon: '📈', label: 'Progress' },
  { path: '/reports', icon: '📑', label: 'Reports' },
  { section: 'Explore' },
  { path: '/opportunities', icon: '💼', label: 'Opportunities' },
];

const ADMIN_ITEMS = [
  { section: 'Admin' },
  { path: '/admin', icon: '⚙️', label: 'Admin Panel' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const items = user?.role === 'ADMIN' ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        <div className="sidebar-header">
          <div className="sidebar-logo">🎯</div>
          <div className="sidebar-brand">
            <h2>PlacePrep</h2>
            <span>Placement Platform</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item, i) =>
            item.section ? (
              <div key={i} className="sidebar-section-title">{item.section}</div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/profile')}>
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-role">{user?.role || 'Student'}</div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
              className="btn-icon" 
              style={{ color: '#ef4444', fontSize: '18px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
              title="Logout"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="header-left">
              <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            </div>
          </div>
          <div className="header-actions">
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </header>
        <div className="page-content page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
