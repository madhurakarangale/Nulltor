import { useEffect, useState, useCallback } from 'react';
import { usersApi, type UserCreate } from '../api/users';
import { type UserRead } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { DashboardNavbar } from '../components/dashboard/DashboardNavbar';
import { toast } from '../components/shared/Toast';
import { Modal } from '../components/shared/Modal';
import { Users, UserCheck, ShieldCheck, UserPlus, Search } from 'lucide-react';

export function SystemUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const isAdminOrSuper = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  const [users, setUsers] = useState<UserRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await usersApi.list();
      setUsers(data.items);
    } catch {
      toast('Failed to load system users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleToggleActive(user: UserRead) {
    try {
      await usersApi.update(user.id, { is_active: !user.is_active });
      toast(`User "${user.username}" ${user.is_active ? 'deactivated' : 'activated'}`, 'success');
      loadUsers();
    } catch {
      toast('Failed to update user status', 'error');
    }
  }

  async function handleRoleChange(user: UserRead, newRole: 'superadmin' | 'admin' | 'member') {
    try {
      await usersApi.update(user.id, { role: newRole });
      toast(`Role for ${user.username} updated to ${newRole.toUpperCase()}`, 'success');
      loadUsers();
    } catch {
      toast('Failed to update user role', 'error');
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
                          u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.is_active).length;
  const superadminCount = users.filter((u) => u.role === 'superadmin').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;
  const privilegedCount = superadminCount + adminCount;
  const activePercentage = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100;

  return (
    <div className="bento-dashboard-root">
      <DashboardNavbar />

      <main className="bento-dashboard-canvas">
        {/* Header Bar */}
        <div className="bento-subpage-header animate-fade-in-up stagger-1" style={{ marginBottom: '14px' }}>
          <div>
            <h1 className="bento-subpage-title">
              Workspace <span style={{ color: 'var(--accent-secondary, #3b82f6)' }}>Directory</span> & Members
            </h1>
            <p className="bento-subpage-subtitle">
              {isAdminOrSuper
                ? 'Manage user permissions, elevate privileged roles, and provision workspace members.'
                : 'Browse organization members and workspace contributors.'}
            </p>
          </div>

          {isAdminOrSuper && (
            <button 
              className="bento-btn-primary" 
              onClick={() => setShowCreate(true)}
              style={{ padding: '8px 18px', width: 'auto', flex: 'none', fontSize: '12.5px' }}
            >
              <UserPlus size={14} /> Add New User
            </button>
          )}
        </div>

        {/* KPI Cards — Strictly Visible to Superadmins and Admins Only */}
        {isAdminOrSuper && (
          <div 
            className="animate-fade-in-up stagger-2" 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
              gap: '16px', 
              marginBottom: '16px' 
            }}
          >
            {/* Card 1: Total Members */}
            <div 
              className="bento-card" 
              style={{ 
                padding: '16px 20px', 
                borderLeft: '4px solid #3b82f6', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div 
                  style={{ 
                    width: 42, 
                    height: 42, 
                    borderRadius: 10, 
                    background: 'rgba(59, 130, 246, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#3b82f6' 
                  }}
                >
                  <Users size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    Total Members
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Workspace Accounts
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#3b82f6', lineHeight: 1 }}>{totalCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>Registered</div>
              </div>
            </div>

            {/* Card 2: Total Active Members */}
            <div 
              className="bento-card" 
              style={{ 
                padding: '16px 20px', 
                borderLeft: '4px solid #10b981', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div 
                  style={{ 
                    width: 42, 
                    height: 42, 
                    borderRadius: 10, 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#10b981' 
                  }}
                >
                  <UserCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    Total Active Members
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Authenticated & Active
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{activeCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{activePercentage}% Active</div>
              </div>
            </div>

            {/* Card 3: Privileged Roles */}
            <div 
              className="bento-card" 
              style={{ 
                padding: '16px 20px', 
                borderLeft: '4px solid #818cf8', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div 
                  style={{ 
                    width: 42, 
                    height: 42, 
                    borderRadius: 10, 
                    background: 'rgba(129, 140, 248, 0.15)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#818cf8' 
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    Privileged Roles
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>
                    Admins & Superadmins
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '26px', fontWeight: 900, color: '#818cf8', lineHeight: 1 }}>{privilegedCount}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                  {superadminCount} Super · {adminCount} Admin
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Full-Width Members Directory Table */}
        <div className="bento-table-card animate-fade-in-up stagger-3">
          {/* Integrated Toolbar */}
          <div className="bento-table-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search members by username or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bento-search-input"
                  style={{ width: '100%', paddingLeft: '32px', paddingBlock: '6px' }}
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bento-search-input"
                style={{ width: '140px', paddingBlock: '6px', cursor: 'pointer' }}
              >
                <option value="all">All Roles</option>
                <option value="superadmin">Superadmin</option>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Showing {filteredUsers.length} of {users.length} members
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading system accounts…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No accounts found matching search filter.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr className="bento-table-header-row" style={{ display: 'table-row' }}>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Member / Account</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Email Address</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Role Assignment</th>
                  <th style={{ padding: '12px 20px', fontWeight: 700 }}>Status</th>
                  {isAdminOrSuper && (
                    <th style={{ padding: '12px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="bento-table-row" style={{ display: 'table-row' }}>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: u.role === 'superadmin' 
                            ? 'linear-gradient(135deg, #818cf8, #a855f7)'
                            : u.role === 'admin'
                            ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                            : 'linear-gradient(135deg, #0f52ba, #38bdf8)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}>
                          {u.username.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>{u.email}</td>
                    <td style={{ padding: '12px 20px' }}>
                      {isAdminOrSuper ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as any)}
                          className="bento-search-input"
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            width: 'auto',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 9px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            background:
                              u.role === 'superadmin'
                                ? 'rgba(129, 140, 248, 0.15)'
                                : u.role === 'admin'
                                ? 'rgba(6, 182, 212, 0.15)'
                                : 'rgba(255, 255, 255, 0.06)',
                            color:
                              u.role === 'superadmin'
                                ? '#818cf8'
                                : u.role === 'admin'
                                ? '#06b6d4'
                                : 'var(--text-secondary)',
                            border: `1px solid ${
                              u.role === 'superadmin'
                                ? 'rgba(129, 140, 248, 0.3)'
                                : u.role === 'admin'
                                ? 'rgba(6, 182, 212, 0.3)'
                                : 'var(--border)'
                            }`,
                          }}
                        >
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      {u.is_active ? (
                        <span className="bento-row-status-tag status-live" style={{ fontSize: '10.5px' }}>
                          <span className="status-dot-mini" /> Active
                        </span>
                      ) : (
                        <span className="bento-row-status-tag status-offline" style={{ fontSize: '10.5px' }}>
                          <span className="status-dot-mini" /> Disabled
                        </span>
                      )}
                    </td>
                    {isAdminOrSuper && (
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <button
                          className="bento-meta-pill bento-meta-btn"
                          style={{
                            color: u.is_active ? 'var(--text-muted)' : '#10b981',
                            borderColor: u.is_active ? 'var(--border)' : 'rgba(16, 185, 129, 0.3)',
                            background: u.is_active ? 'var(--bg-2)' : 'rgba(16, 185, 129, 0.1)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '11.5px',
                            padding: '4px 12px',
                          }}
                          onClick={() => handleToggleActive(u)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={loadUsers} />}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [data, setData] = useState<UserCreate>({ email: '', username: '', password: 'password123', role: 'member' });
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!data.username || !data.email) return;
    setLoading(true);
    try {
      await usersApi.create(data);
      toast(`User account "${data.username}" created`, 'success');
      onCreated();
      onClose();
    } catch (e: any) {
      toast(e.message || 'Failed to create user', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Add New System User Account"
      onClose={onClose}
      footer={
        <>
          <button
            className="bento-btn-ghost"
            style={{ width: 'auto', padding: '8px 18px' }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bento-btn-primary"
            style={{ width: 'auto', padding: '8px 20px' }}
            onClick={handleCreate}
            disabled={loading || !data.email || !data.username}
          >
            {loading ? 'Provisioning…' : 'Create User Account'}
          </button>
        </>
      }
    >
      <div className="form-field" style={{ marginBottom: '16px' }}>
        <label style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Account Username
        </label>
        <input
          type="text"
          value={data.username}
          onChange={(e) => setData({ ...data, username: e.target.value })}
          placeholder="e.g. dev_architect"
          className="bento-search-input"
          style={{ width: '100%' }}
          autoFocus
        />
      </div>

      <div className="form-field" style={{ marginBottom: '16px' }}>
        <label style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Email Address
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => setData({ ...data, email: e.target.value })}
          placeholder="user@nulltor.com"
          className="bento-search-input"
          style={{ width: '100%' }}
        />
      </div>

      <div className="form-field" style={{ marginBottom: '16px' }}>
        <label style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          System Hierarchy Role
        </label>
        <select
          value={data.role}
          onChange={(e) => setData({ ...data, role: e.target.value as any })}
          className="bento-search-input"
          style={{ width: '100%', cursor: 'pointer' }}
        >
          <option value="member">Level 3 · Member (Project Contributor)</option>
          <option value="admin">Level 2 · Admin (Can create & manage projects)</option>
          <option value="superadmin">Level 1 · Superadmin (Full System Control & Governance)</option>
        </select>
      </div>

      <div className="form-field" style={{ marginBottom: '8px' }}>
        <label style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', display: 'block', marginBottom: '6px' }}>
          Initial Passphrase
        </label>
        <input
          type="text"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          className="bento-search-input"
          style={{ width: '100%' }}
        />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
          User will be required to update this password upon initial login.
        </span>
      </div>
    </Modal>
  );
}
