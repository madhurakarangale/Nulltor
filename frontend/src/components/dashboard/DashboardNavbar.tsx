import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../context/ThemeContext';
import { NulltorLogo } from '../shared/NulltorLogo';
import { 
  FolderKanban, 
  Activity, 
  ShieldCheck, 
  User, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Sparkles
} from 'lucide-react';

export function DashboardNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = (user?.username?.slice(0, 2) || 'OP').toUpperCase();
  const currentPath = location.pathname;

  return (
    <header className="bento-topbar">
      {/* Brand / Logo */}
      <div className="bento-topbar-brand" onClick={() => navigate('/dashboard')}>
        <NulltorLogo size="md" />
        <span className="bento-version-badge">v5.5</span>
      </div>

      {/* Floating Center Segmented Pill Navigation */}
      <nav className="bento-nav-pill-group">
        <button
          className={`bento-nav-pill ${currentPath === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
          type="button"
        >
          <FolderKanban size={14} className="pill-icon" />
          <span>Workspaces</span>
        </button>

        <button
          className={`bento-nav-pill ${currentPath === '/logs' ? 'active' : ''}`}
          onClick={() => navigate('/logs')}
          type="button"
        >
          <Activity size={14} className="pill-icon" />
          <span>Telemetry</span>
        </button>

        <button
          className={`bento-nav-pill ${currentPath === '/users' ? 'active' : ''}`}
          onClick={() => navigate('/users')}
          type="button"
        >
          <ShieldCheck size={14} className="pill-icon" />
          <span>Governance</span>
        </button>

        <button
          className={`bento-nav-pill ${currentPath === '/profile' ? 'active' : ''}`}
          onClick={() => navigate('/profile')}
          type="button"
        >
          <User size={14} className="pill-icon" />
          <span>Profile</span>
        </button>

        <button
          className={`bento-nav-pill ${currentPath === '/settings' ? 'active' : ''}`}
          onClick={() => navigate('/settings')}
          type="button"
        >
          <Settings size={14} className="pill-icon" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Right Controls: Theme + User Profile + Logout */}
      <div className="bento-topbar-actions">
        <button
          className="bento-icon-btn"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
          type="button"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* User Pill Badge */}
        <div className="bento-user-chip" onClick={() => navigate('/profile')}>
          <div className="bento-avatar-circle">
            {initials}
          </div>
          <div className="bento-user-meta">
            <span className="bento-user-name">{user?.username || 'developer'}</span>
            <span className="bento-user-role">{user?.role || 'member'}</span>
          </div>
        </div>

        {/* Quick Logout */}
        <button
          className="bento-icon-btn bento-logout-btn"
          onClick={handleLogout}
          title="Sign out of Nulltor"
          type="button"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
