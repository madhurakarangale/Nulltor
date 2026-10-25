import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi, type ProjectRead } from '../api/projects';
import { branchesApi } from '../api/branches';
import { logsApi, type AuditLogRead } from '../api/logs';
import { usersApi } from '../api/users';
import { commitsApi } from '../api/commits';
import { useAuthStore } from '../store/authStore';
import { DashboardNavbar } from '../components/dashboard/DashboardNavbar';
import { FireFlame } from '../components/dashboard/FireFlame';
import { ProjectCard, CreateProjectModal } from '../components/dashboard/ProjectCard';
import { JoinProjectModal } from '../components/dashboard/JoinProjectModal';
import { toast } from '../components/shared/Toast';
import { getOrUpdateStreak, type StreakData } from '../utils/streak';
import '../bento-dashboard.css';

import {
  FolderKanban,
  GitBranch,
  Users,
  GitCommit,
  PlusCircle,
  Key,
  Search,
  ArrowUpRight,
  Activity,
  Flame,
  Zap,
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<ProjectRead[]>([]);
  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({});
  const [recentLogs, setRecentLogs] = useState<AuditLogRead[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(1);
  const [todayCommitsCount, setTodayCommitsCount] = useState<number>(0);
  const [totalCommitsCount, setTotalCommitsCount] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [streakData, setStreakData] = useState<StreakData | null>(null);

  const canCreate = user?.role === 'superadmin' || user?.role === 'admin';

  // Initialize or update user streak on visit
  useEffect(() => {
    if (user?.id) {
      const data = getOrUpdateStreak(user.id);
      setStreakData(data);
    } else {
      const data = getOrUpdateStreak('guest');
      setStreakData(data);
    }
  }, [user?.id]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await projectsApi.list();
      setProjects(data.items);

      const counts: Record<string, number> = {};
      let totalCommits = 0;
      let todayCount = 0;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      await Promise.all(
        data.items.map(async (p) => {
          try {
            const bl = await branchesApi.list(p.id);
            counts[p.id] = bl.total;
          } catch {
            counts[p.id] = 0;
          }

          try {
            const cList = await commitsApi.getCommits(p.id);
            totalCommits += cList.length;
            todayCount += cList.filter((c) => new Date(c.created_at) >= todayStart).length;
          } catch {}
        })
      );

      setBranchCounts(counts);
      setTodayCommitsCount(todayCount);
      setTotalCommitsCount(totalCommits);

      try {
        const logData = await logsApi.list({ page: 1, page_size: 7 });
        setRecentLogs(logData.items);
      } catch {}

      try {
        const userData = await usersApi.list(0, 50);
        setTotalUsersCount(userData.total || userData.items.length);
      } catch {}
    } catch {
      toast('Failed to load workspace data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(async () => {
      try {
        const logData = await logsApi.list({ page: 1, page_size: 7 });
        setRecentLogs(logData.items);
      } catch {}
    }, 8000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  const filteredProjects = useMemo(() => {
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
    );
  }, [projects, search]);

  const totalBranches = useMemo(() => {
    return Object.values(branchCounts).reduce((a, b) => a + b, 0);
  }, [branchCounts]);

  // Days of week labels for streak tracker
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bento-dashboard-root">
      {/* Top Floating Pill Navigation Bar (No Sidebar!) */}
      <DashboardNavbar />

      <main className="bento-dashboard-canvas">
        {/* Welcome Strip */}
        <div className="bento-welcome-row">
          <div>
            <h1 className="bento-welcome-title">
              Welcome back, <span>{user?.username || 'developer'}</span>
            </h1>
            <p className="bento-welcome-subtitle">
              Your decentralized, zero-knowledge collaborative studio is active.
            </p>
          </div>
        </div>

        {/* ─── ROW 1: TOP HERO BENTO (Overview + Radiant Fire Streak) ─── */}
        <div className="bento-hero-row">
          {/* Left Bento: Workspace Quick Stats & Action Hub */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title">
                <FolderKanban size={16} style={{ color: '#3b82f6' }} />
                <span>Workspace Overview</span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {projects.length} Registered
              </span>
            </div>

            {/* 2x2 Micro Stats Grid */}
            <div className="bento-overview-metrics">
              <div className="bento-metric-cell">
                <div className="bento-metric-label">Active Workspaces</div>
                <div className="bento-metric-value">{loading ? '…' : projects.length}</div>
              </div>

              <div className="bento-metric-cell">
                <div className="bento-metric-label">Active Branches</div>
                <div className="bento-metric-value">{loading ? '…' : totalBranches}</div>
              </div>

              <div className="bento-metric-cell">
                <div className="bento-metric-label">Collaborators</div>
                <div className="bento-metric-value">{loading ? '…' : totalUsersCount}</div>
              </div>

              <div className="bento-metric-cell">
                <div className="bento-metric-label">Commits Today</div>
                <div className="bento-metric-value">{loading ? '…' : todayCommitsCount}</div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="bento-overview-actions">
              {canCreate && (
                <button
                  className="bento-btn-primary"
                  onClick={() => setShowCreate(true)}
                  type="button"
                >
                  <PlusCircle size={15} />
                  <span>New Workspace</span>
                </button>
              )}

              <button
                className="bento-btn-ghost"
                onClick={() => setShowJoin(true)}
                type="button"
              >
                <Key size={14} />
                <span>Join via Code</span>
              </button>
            </div>
          </div>

          {/* Right Bento: THE HERO FIRE STREAK CARD (Vibrant Amber/Orange Anchor) */}
          <div className="bento-fire-hero-card">
            <div className="bento-fire-header">
              <div className="bento-fire-title">
                <Flame size={15} style={{ color: '#fde047' }} />
                <span>Developer Momentum & Streak</span>
              </div>
              <div className="bento-fire-live-tag">
                <span className="bento-fire-live-dot" />
                <span>Active Today</span>
              </div>
            </div>

            <div className="bento-fire-body">
              {/* Living Animated Fire Flame */}
              <FireFlame size="lg" streakCount={streakData?.currentStreak || 4} />

              <div className="bento-fire-stats-col">
                <div className="bento-fire-streak-count">
                  <span>{streakData?.currentStreak || 4}</span>
                  <span className="bento-fire-streak-unit">DAY STREAK</span>
                </div>
                <div className="bento-fire-session-text">
                  Logged in <strong>{streakData?.todayLogins || 3} times</strong> today ·{' '}
                  {streakData?.totalLogins || 16} sessions recorded
                </div>
              </div>
            </div>

            {/* Weekly 7-Day Pill Tracker (M T W T F S S) */}
            <div className="bento-weekly-tracker">
              {weekDays.map((dayLabel, idx) => {
                const isActive = streakData?.activeDaysOfWeek[idx] ?? (idx <= 3);
                const isToday = streakData?.currentDayIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`bento-day-pill ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
                    title={`${dayLabel}: ${isActive ? 'Coded & Active' : 'Rest'}${isToday ? ' (Today)' : ''}`}
                  >
                    <span>{dayLabel}</span>
                    <span className="bento-day-dot" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── ROW 2: QUICK WORKSPACE LAUNCHER STRIP (Like FinPoint Watchlist) ─── */}
        {projects.length > 0 && (
          <div className="bento-ribbon-strip">
            <div className="bento-ribbon-label">
              <Zap size={14} style={{ color: '#f59e0b' }} />
              <span>Quick Launch</span>
            </div>

            <div className="bento-ribbon-items">
              {projects.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="bento-ribbon-chip"
                  onClick={() => navigate(`/ide/${p.id}`)}
                  title={`Open IDE for ${p.name}`}
                >
                  <span>{p.name}</span>
                  <span className="chip-branch">
                    {branchCounts[p.id] || 1} br
                  </span>
                  <ArrowUpRight size={13} className="chip-arrow" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── ROW 3: MAIN BENTO (All Workspaces 65% + Recent Activity 35%) ─── */}
        <div className="bento-main-row">
          {/* Left Bento: All Workspaces (Spacious 65% Grid) */}
          <div className="bento-card bento-workspaces-box">
            <div className="bento-card-header">
              <div className="bento-card-title">
                <FolderKanban size={16} />
                <span>All Workspaces</span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {filteredProjects.length}
                </span>
              </div>

              {/* Integrated Search / Filter */}
              <div className="bento-search-input-wrap">
                <Search size={14} className="bento-search-icon" />
                <input
                  type="text"
                  placeholder="Filter workspaces…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bento-search-input"
                />
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading workspaces…
              </div>
            ) : filteredProjects.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  padding: '42px 24px',
                  textAlign: 'center',
                }}
              >
                <FolderKanban size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>
                  No Workspace Projects Found
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 16px' }}>
                  {canCreate
                    ? 'Create your first project workspace to start collaborating.'
                    : 'No projects assigned.'}
                </p>
                {canCreate && (
                  <button
                    className="bento-btn-primary"
                    style={{ margin: '0 auto', display: 'inline-flex' }}
                    onClick={() => setShowCreate(true)}
                  >
                    + Create Workspace
                  </button>
                )}
              </div>
            ) : (
              <div className="bento-workspaces-dynamic-list">
                {filteredProjects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    branchCount={branchCounts[p.id] ?? 0}
                    myRole={user?.role}
                    currentUserId={user?.id}
                    layoutMode="row"
                    onDeleted={loadDashboardData}
                    onUpdated={loadDashboardData}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Bento: Recent Activity Stream (35% Column) */}
          <div className="bento-card">
            <div className="bento-card-header">
              <div className="bento-card-title">
                <Activity size={16} style={{ color: '#10b981' }} />
                <span>Recent Activity</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="bento-status-dot" />
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>Live</span>
              </div>
            </div>

            <div className="bento-log-stream">
              {recentLogs.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '24px 0', textAlign: 'center' }}>
                  No recent activity logged yet.
                </div>
              ) : (
                recentLogs.map((log) => {
                  const act = log.action.toLowerCase();
                  const isDelete = act.includes('delete') || act.includes('remove');
                  const isCreate = act.includes('create') || act.includes('branch');
                  const isCommit = act.includes('commit') || act.includes('push');
                  const isLogin = act.includes('login') || act.includes('auth');

                  const tagLabel = isDelete ? 'DEL' : isCreate ? 'CREATE' : isCommit ? 'COMMIT' : isLogin ? 'AUTH' : 'SYS';
                  const tagClass = isDelete ? 'log-tag-delete' : isCreate ? 'log-tag-create' : isCommit ? 'log-tag-commit' : isLogin ? 'log-tag-login' : 'log-tag-event';

                  const actionLabel = log.action
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  const actorName =
                    log.actor_username || (log.actor_id ? log.actor_id.slice(0, 8) : 'superadmin');

                  const timeStr = new Date(log.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={log.id} className="bento-log-row">
                      <div className="bento-log-left">
                        <span className="bento-log-time">{timeStr}</span>
                        <span className={`bento-log-tag ${tagClass}`}>{tagLabel}</span>
                        <span className="bento-log-msg">{actionLabel}</span>
                      </div>
                      <span className="bento-log-actor">{actorName}</span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Link to Full Telemetry */}
            <button
              className="bento-audit-link"
              onClick={() => navigate('/logs')}
              type="button"
            >
              <span>View Full Audit Telemetry</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setProjects((prev) => [p, ...prev]);
            setShowCreate(false);
          }}
        />
      )}

      {showJoin && (
        <JoinProjectModal
          onClose={() => setShowJoin(false)}
          onJoined={(p) => {
            setProjects((prev) => {
              if (prev.find((x) => x.id === p.id)) return prev;
              return [p, ...prev];
            });
            setShowJoin(false);
          }}
        />
      )}
    </div>
  );
}
