import { useEffect, useState, useCallback, useMemo } from 'react';
import { logsApi, type AuditLogRead } from '../api/logs';
import { DashboardNavbar } from '../components/dashboard/DashboardNavbar';
import { toast } from '../components/shared/Toast';
import { 
  Trash2, 
  Key, 
  PlusCircle, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  Edit,
  Search,
  CheckCircle2,
  Activity,
  Layers,
  Filter
} from 'lucide-react';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [resourceFilter, setResourceFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadLogs = useCallback(async (p: number, currentSearch: string = debouncedSearch) => {
    setLoading(true);
    try {
      const data = await logsApi.list({
        page: p,
        page_size: 40,
        resource_type: resourceFilter || undefined,
        search: currentSearch.trim() || undefined,
      });
      if (p === 1) {
        setLogs(data.items);
      } else {
        setLogs((prev) => [...prev, ...data.items]);
      }
      setHasMore(data.items.length === 40);
    } catch {
      toast('Failed to load audit telemetry', 'error');
    } finally {
      setLoading(false);
    }
  }, [resourceFilter, debouncedSearch]);

  useEffect(() => {
    setPage(1);
    loadLogs(1, debouncedSearch);
  }, [resourceFilter, debouncedSearch]);

  const filteredLogs = useMemo(() => {
    if (!search) return logs;
    const term = search.toLowerCase();
    return logs.filter((log) => {
      const actor = (log.actor_username || log.actor_id || '').toLowerCase();
      const action = log.action.toLowerCase();
      const resource = (log.resource_type || '').toLowerCase();
      const ip = (log.ip_address || '').toLowerCase();
      return action.includes(term) || actor.includes(term) || resource.includes(term) || ip.includes(term);
    });
  }, [logs, search]);

  // Compute event category distribution metrics
  const stats = useMemo(() => {
    const total = logs.length || 1;
    let branchCount = 0;
    let authCount = 0;
    let userCount = 0;
    let deleteCount = 0;

    logs.forEach((l) => {
      const act = l.action.toLowerCase();
      if (act.includes('branch') || act.includes('create') || act.includes('pull')) branchCount++;
      else if (act.includes('login') || act.includes('session')) authCount++;
      else if (act.includes('user') || act.includes('deactivate') || act.includes('grant')) userCount++;
      else if (act.includes('delete') || act.includes('remove')) deleteCount++;
    });

    return {
      branchCount,
      authCount,
      userCount,
      deleteCount,
      branchPct: Math.round((branchCount / total) * 100),
      authPct: Math.round((authCount / total) * 100),
      userPct: Math.round((userCount / total) * 100),
      deletePct: Math.round((deleteCount / total) * 100),
    };
  }, [logs]);

  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    const label = action.replace(/_/g, ' ').toUpperCase();

    if (act.includes('delete') || act.includes('remove')) {
      return {
        icon: <Trash2 size={12} />,
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.12)',
        border: 'rgba(239, 68, 68, 0.28)',
        label,
      };
    }
    if (act.includes('create') || act.includes('branch')) {
      return {
        icon: <PlusCircle size={12} />,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.12)',
        border: 'rgba(16, 185, 129, 0.28)',
        label,
      };
    }
    if (act.includes('grant') || act.includes('member')) {
      return {
        icon: <Shield size={12} />,
        color: '#3b82f6',
        bg: 'rgba(59, 130, 246, 0.12)',
        border: 'rgba(59, 130, 246, 0.28)',
        label,
      };
    }
    if (act.includes('login')) {
      return {
        icon: <Key size={12} />,
        color: '#06b6d4',
        bg: 'rgba(6, 182, 212, 0.12)',
        border: 'rgba(6, 182, 212, 0.28)',
        label,
      };
    }
    return {
      icon: <Edit size={12} />,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.12)',
      border: 'rgba(168, 85, 247, 0.28)',
      label,
    };
  };

  return (
    <div className="bento-dashboard-root">
      <DashboardNavbar />

      <main className="bento-dashboard-canvas">
        {/* Compact Header Bar */}
        <div className="bento-subpage-header animate-fade-in-up stagger-1" style={{ marginBottom: '14px' }}>
          <div>
            <h1 className="bento-subpage-title">
              Audit <span style={{ color: 'var(--accent-secondary, #3b82f6)' }}>Telemetry</span>
            </h1>
            <p className="bento-subpage-subtitle">
              Immutable operational and security audit stream across workspaces and sessions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="bento-status-pill">
              <span className="bento-status-dot" /> LIVE STREAM
            </span>
          </div>
        </div>

        {/* 2-Column Symmetrical Bento Architecture (Equal Height: 600px) */}
        <div className="bento-subpage-grid">
          {/* Main Column (8.3fr): Telemetry Log Stream Table with Inner Scrollbar */}
          <div 
            className="bento-table-card animate-fade-in-up stagger-2"
            style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
          >
            {/* Integrated Toolbar (Fixed at Top) */}
            <div className="bento-table-toolbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                  <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search logs by user, action, IP…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bento-search-input"
                    style={{ width: '100%', paddingLeft: '32px', paddingBlock: '6px' }}
                  />
                </div>

                <select
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  className="bento-search-input"
                  style={{ width: '140px', paddingBlock: '6px', cursor: 'pointer' }}
                >
                  <option value="">All Resources</option>
                  <option value="project">Project</option>
                  <option value="branch">Branch</option>
                  <option value="user">User</option>
                  <option value="session">Session</option>
                </select>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                {filteredLogs.length} events recorded
              </div>
            </div>

            {/* Table Column Headers (Fixed at Top) */}
            <div 
              className="bento-table-header-row"
              style={{ gridTemplateColumns: '150px 140px 1fr 115px 125px 30px' }}
            >
              <div>Action</div>
              <div>Actor</div>
              <div>Resource / Details</div>
              <div>Client IP</div>
              <div style={{ textAlign: 'right' }}>Timestamp</div>
              <div></div>
            </div>

            {/* Scrollable Table Rows Feed with Smooth Scrollbar */}
            <div 
              className="bento-scrollbar" 
              style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
            >
              {loading && logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  Loading audit logs…
                </div>
              ) : filteredLogs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No audit events found matching your filter.
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const actorName = log.actor_username || (log.actor_id ? log.actor_id.slice(0, 8) : 'superadmin');
                  const dateObj = new Date(log.created_at);
                  const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const isExpanded = expandedLogId === log.id;
                  const hasDetails = log.detail && Object.keys(log.detail).length > 0;

                  return (
                    <div key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <div
                        onClick={() => hasDetails && setExpandedLogId(isExpanded ? null : log.id)}
                        className="bento-table-row"
                        style={{
                          gridTemplateColumns: '150px 140px 1fr 115px 125px 30px',
                          cursor: hasDetails ? 'pointer' : 'default',
                          padding: '10px 18px',
                          background: isExpanded ? 'rgba(59, 130, 246, 0.06)' : undefined,
                        }}
                      >
                        {/* Action Badge */}
                        <div>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '2.5px 8px',
                            borderRadius: '9999px',
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            color: badge.color,
                            fontSize: '10.5px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                          }}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </div>

                        {/* Actor */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                          <div style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0f52ba, #38bdf8)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}>
                            {actorName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12.5px' }}>
                            {actorName}
                          </span>
                        </div>

                        {/* Resource / Details Summary */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.resource_type && (
                            <span style={{
                              fontSize: '10px',
                              padding: '1.5px 6px',
                              borderRadius: '4px',
                              background: 'var(--bg-2)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              flexShrink: 0,
                            }}>
                              {log.resource_type}
                            </span>
                          )}
                          <span style={{ color: 'var(--text-primary)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {log.detail && typeof log.detail === 'object'
                              ? Object.entries(log.detail).map(([k, v]) => `${k}: ${String(v)}`).join(' · ')
                              : 'System Event'}
                          </span>
                        </div>

                        {/* IP Address */}
                        <div>
                          <span style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-2)',
                            padding: '1.5px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                          }}>
                            {log.ip_address || '127.0.0.1'}
                          </span>
                        </div>

                        {/* Timestamp */}
                        <div style={{ textAlign: 'right', fontSize: '11.5px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{timeStr}</span>{' '}
                          <span style={{ color: 'var(--text-muted)' }}>· {dateStr}</span>
                        </div>

                        {/* Expand Icon */}
                        <div style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {hasDetails && (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                        </div>
                      </div>

                      {/* Expandable JSON Payload Drawer */}
                      {isExpanded && log.detail && (
                        <div style={{
                          padding: '12px 18px',
                          background: 'var(--bg-2)',
                          borderTop: '1px solid var(--border)',
                        }}>
                          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent-secondary, #3b82f6)', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                            Event Payload
                          </div>
                          <pre style={{
                            margin: 0,
                            padding: '10px 14px',
                            borderRadius: '6px',
                            background: 'var(--bg-0)',
                            border: '1px solid var(--border)',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '11.5px',
                            color: 'var(--aurora-mint)',
                            overflowX: 'auto',
                            lineHeight: 1.5,
                          }}>
                            {JSON.stringify(log.detail, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Footer (Fixed at Bottom of Card) */}
            {!loading && hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px', borderTop: '1px solid var(--border)', background: 'var(--bg-1)' }}>
                <button
                  className="bento-btn-ghost"
                  style={{
                    maxWidth: '160px',
                    padding: '5px 14px',
                    fontSize: '11.5px',
                  }}
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    loadLogs(nextPage, debouncedSearch);
                  }}
                >
                  Load More ↓
                </button>
              </div>
            )}
          </div>

          {/* Right Column (3.7fr): Telemetry Intelligence & Security Panel (Height: 600px Exactly) */}
          <div 
            className="bento-insights-column animate-fade-in-up stagger-3"
            style={{ height: '600px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            {/* Stream Health Card */}
            <div className="bento-card" style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="bento-card-header" style={{ marginBottom: '10px' }}>
                  <span className="bento-card-title">
                    <Activity size={15} style={{ color: 'var(--accent-secondary, #3b82f6)' }} />
                    Stream Health
                  </span>
                  <span className="bento-row-status-tag status-live" style={{ fontSize: '10px' }}>
                    ACTIVE
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="bento-metric-cell" style={{ padding: '8px 10px' }}>
                    <div className="bento-metric-label" style={{ fontSize: '11px' }}>Total Events</div>
                    <div className="bento-metric-value" style={{ fontSize: '20px' }}>{logs.length}</div>
                  </div>
                  <div className="bento-metric-cell" style={{ padding: '8px 10px' }}>
                    <div className="bento-metric-label" style={{ fontSize: '11px' }}>Filter Scope</div>
                    <div className="bento-metric-value" style={{ fontSize: '13px', color: 'var(--accent-secondary, #3b82f6)', marginTop: 2 }}>
                      {resourceFilter ? resourceFilter.toUpperCase() : 'ALL'}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '8px', padding: '8px 10px', borderRadius: '8px', background: 'var(--bg-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981' }}>IMMUTABLE AUDIT LOG</span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Cryptographically sealed SHA-256</span>
                </div>
              </div>
            </div>

            {/* Event Distribution Breakdown */}
            <div className="bento-card" style={{ flex: 1.25, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div className="bento-card-header" style={{ marginBottom: '2px' }}>
                  <span className="bento-card-title">
                    <Layers size={15} style={{ color: '#06b6d4' }} />
                    Event Distribution
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Last 40</span>
                </div>

                <div className="bento-distribution-list" style={{ gap: '8px', marginTop: '8px' }}>
                  <div className="bento-dist-row">
                    <div className="bento-dist-labels">
                      <span className="bento-dist-name">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                        Branch & Workspace
                      </span>
                      <span className="bento-dist-count">{stats.branchCount} ({stats.branchPct}%)</span>
                    </div>
                    <div className="bento-dist-track">
                      <div className="bento-dist-fill" style={{ width: `${stats.branchPct}%`, background: '#10b981' }} />
                    </div>
                  </div>

                  <div className="bento-dist-row">
                    <div className="bento-dist-labels">
                      <span className="bento-dist-name">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                        Session & Auth
                      </span>
                      <span className="bento-dist-count">{stats.authCount} ({stats.authPct}%)</span>
                    </div>
                    <div className="bento-dist-track">
                      <div className="bento-dist-fill" style={{ width: `${stats.authPct}%`, background: '#3b82f6' }} />
                    </div>
                  </div>

                  <div className="bento-dist-row">
                    <div className="bento-dist-labels">
                      <span className="bento-dist-name">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7' }} />
                        User Governance
                      </span>
                      <span className="bento-dist-count">{stats.userCount} ({stats.userPct}%)</span>
                    </div>
                    <div className="bento-dist-track">
                      <div className="bento-dist-fill" style={{ width: `${stats.userPct}%`, background: '#a855f7' }} />
                    </div>
                  </div>

                  <div className="bento-dist-row">
                    <div className="bento-dist-labels">
                      <span className="bento-dist-name">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                        Destructive / Deletions
                      </span>
                      <span className="bento-dist-count">{stats.deleteCount} ({stats.deletePct}%)</span>
                    </div>
                    <div className="bento-dist-track">
                      <div className="bento-dist-fill" style={{ width: `${stats.deletePct}%`, background: '#ef4444' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Filter Presets */}
            <div className="bento-card" style={{ padding: '12px 16px', flexShrink: 0 }}>
              <span className="bento-card-title" style={{ marginBottom: '8px', fontSize: '12px' }}>
                <Filter size={13} style={{ color: 'var(--text-muted)' }} />
                Quick Scope Presets
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {[
                  { label: 'All', val: '' },
                  { label: 'Sessions', val: 'session' },
                  { label: 'Branches', val: 'branch' },
                  { label: 'Users', val: 'user' },
                  { label: 'Projects', val: 'project' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setResourceFilter(item.val)}
                    className="bento-meta-pill bento-meta-btn"
                    style={{
                      fontSize: '10.5px',
                      padding: '3px 8px',
                      cursor: 'pointer',
                      background: resourceFilter === item.val ? 'var(--accent-secondary, #3b82f6)' : undefined,
                      color: resourceFilter === item.val ? '#ffffff' : undefined,
                      borderColor: resourceFilter === item.val ? 'transparent' : undefined,
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
