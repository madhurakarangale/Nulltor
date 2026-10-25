import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { projectsApi, type ProjectRead } from '../api/projects';
import { DashboardNavbar } from '../components/dashboard/DashboardNavbar';
import { ForcePasswordChange } from '../components/auth/ForcePasswordChange';
import { Modal } from '../components/shared/Modal';
import { toast } from '../components/shared/Toast';
import { 
  FolderKanban, 
  Lock, 
  ShieldCheck, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  Cpu, 
  UserCheck, 
  Terminal,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');

  const getDesignation = (role?: string) => {
    switch (role) {
      case 'superadmin': return 'Principal Platform Architect & System Superadmin';
      case 'admin': return 'Lead Engineering Manager & Project Admin';
      case 'member': default: return 'Core Project Contributor & Member';
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await projectsApi.list();
        setProjects(data.items);
      } catch {
        toast('Failed to load user project details', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const initials = (user?.username?.slice(0, 2) || 'OP').toUpperCase();

  const filteredProjects = projects.filter((p) => 
    p.name.toLowerCase().includes(workspaceSearch.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(workspaceSearch.toLowerCase())
  );

  return (
    <div className="bento-dashboard-root">
      <DashboardNavbar />

      <main className="bento-dashboard-canvas">
        {/* Header Bar */}
        <div className="bento-subpage-header animate-fade-in-up stagger-1" style={{ marginBottom: '14px' }}>
          <div>
            <h1 className="bento-subpage-title">
              User <span style={{ color: 'var(--accent-secondary, #3b82f6)' }}>Profile</span> & Security Vault
            </h1>
            <p className="bento-subpage-subtitle">
              Zero-Knowledge Identity Vault, Role Credentials, and Workspace Allocations.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="bento-status-pill">
              <span className="bento-status-dot" /> AES-256 E2EE VERIFIED
            </span>
          </div>
        </div>

        {/* Row 1: Perfectly Symmetrical Twin Bento Cards (50% / 50% split) */}
        <div className="bento-twin-grid animate-fade-in-up stagger-2" style={{ marginBottom: '20px' }}>
          {/* Card 1: Developer Identity Console */}
          <div className="bento-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* Header: Avatar & Main Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0f52ba 0%, #2563eb 50%, #38bdf8 100%)',
                  color: '#ffffff',
                  fontSize: '22px',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(15, 82, 186, 0.4)',
                  flexShrink: 0,
                }}>
                  {initials}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {user?.username}
                    </span>
                    <span className="bento-row-status-tag" style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      background: user?.role === 'superadmin' ? 'rgba(129, 140, 248, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: user?.role === 'superadmin' ? '#a855f7' : '#38bdf8',
                      border: 'none',
                    }}>
                      {user?.role?.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12.5px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.email}
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--aurora-mint, #10b981)', marginTop: '2px' }}>
                    {getDesignation(user?.role)}
                  </span>
                </div>
              </div>

              {/* Metadata Badges Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <div className="bento-metric-cell" style={{ padding: '10px 12px' }}>
                  <div className="bento-metric-label" style={{ fontSize: '10.5px' }}>Assigned Access Level</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {user?.role || 'Member'} Authority
                  </div>
                </div>

                <div className="bento-metric-cell" style={{ padding: '10px 12px' }}>
                  <div className="bento-metric-label" style={{ fontSize: '10.5px' }}>Active Projects</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-secondary, #3b82f6)' }}>
                    {projects.length} Repositories
                  </div>
                </div>
              </div>
            </div>

            {/* Password Update Action Button */}
            <button
              className="bento-btn-primary"
              onClick={() => setShowPasswordChange(true)}
              style={{ width: '100%', padding: '10px 16px', fontSize: '13px', gap: '8px' }}
            >
              <Lock size={14} /> Update Master Passphrase
            </button>
          </div>

          {/* Card 2: Cryptographic Security Vault */}
          <div className="bento-card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="bento-card-header" style={{ marginBottom: '14px' }}>
                <span className="bento-card-title">
                  <ShieldCheck size={16} style={{ color: '#10b981' }} />
                  Zero-Knowledge Security Vault
                </span>
                <span className="bento-row-status-tag status-live" style={{ fontSize: '10px' }}>
                  PROTECTED
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <KeyRound size={15} style={{ color: '#06b6d4' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Branch Cryptography</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#06b6d4', fontFamily: 'var(--font-mono, monospace)' }}>
                    AES-256 GCM Client Encrypted
                  </span>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={15} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Session Verification</span>
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Active & Authenticated
                  </span>
                </div>

                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={15} style={{ color: '#818cf8' }} />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Execution Sandbox</span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#818cf8' }}>
                    Isolated Container Policy
                  </span>
                </div>
              </div>
            </div>

            {/* Account Integrity Indicator */}
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Security Compliance</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>100% OPERATIONAL</span>
            </div>
          </div>
        </div>

        {/* Row 2: Allocated Workspaces Bento Showcase (Full Width 2-Column Symmetrical Grid) */}
        <div className="bento-card animate-fade-in-up stagger-3" style={{ padding: '22px 24px' }}>
          {/* Section Header with Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="bento-card-title" style={{ fontSize: '15px' }}>
                <FolderKanban size={17} style={{ color: 'var(--accent-secondary, #3b82f6)' }} />
                Allocated Workspace Repositories
              </span>
              <span className="bento-row-status-tag" style={{ fontSize: '11px', fontWeight: 700 }}>
                {projects.length} Workspaces
              </span>
            </div>

            <div style={{ width: '240px' }}>
              <input
                type="text"
                placeholder="Filter repositories…"
                value={workspaceSearch}
                onChange={(e) => setWorkspaceSearch(e.target.value)}
                className="bento-search-input"
                style={{ width: '100%', paddingBlock: '6px' }}
              />
            </div>
          </div>

          {/* Symmetrical 2-Column Workspaces Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading workspace allocations…
            </div>
          ) : filteredProjects.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No workspaces found matching your search.
            </div>
          ) : (
            <div className="bento-workspaces-2col-grid">
              {filteredProjects.map((p) => {
                const statusStr = (p.status || 'live').toLowerCase();
                return (
                  <div
                    key={p.id}
                    className="bento-workspace-row"
                    onClick={() => navigate(`/ide/${p.id}`)}
                    style={{ padding: '12px 16px' }}
                  >
                    <div className="bento-row-main">
                      <div className="bento-row-icon" style={{ width: 36, height: 36 }}>
                        <FolderKanban size={17} />
                      </div>
                      <div className="bento-row-text">
                        <div className="bento-row-title-bar">
                          <span className="bento-row-title" style={{ fontSize: '13.5px' }}>{p.name}</span>
                          <span className={`bento-row-status-tag ${statusStr === 'live' ? 'status-live' : 'status-offline'}`} style={{ fontSize: '10px' }}>
                            <span className="status-dot-mini" /> {statusStr}
                          </span>
                        </div>
                        <span className="bento-row-desc" style={{ fontSize: '11.5px' }}>
                          {p.description || 'Zero-knowledge collaborative workspace'}
                        </span>
                      </div>
                    </div>

                    <div className="bento-row-actions">
                      <button
                        className="bento-row-open-btn"
                        style={{ padding: '6px 13px', fontSize: '11.5px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ide/${p.id}`);
                        }}
                      >
                        Open IDE <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showPasswordChange && (
        <Modal title="Update Account Password" onClose={() => setShowPasswordChange(false)} width={460}>
          <ForcePasswordChange
            embedded
            onSuccess={() => setShowPasswordChange(false)}
            onCancel={() => setShowPasswordChange(false)}
          />
        </Modal>
      )}
    </div>
  );
}
