import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Music, BarChart3, Users, Settings,
  DollarSign, ShoppingCart,
  Search, LogOut,
  UserCog, Shield, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../lib/apiBase';
import toast from 'react-hot-toast';
import '../styles/admin-dashboard.css';

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  role: string;
  createdAt: string;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tracks' | 'analytics' | 'settings'>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ users: 0, tracks: 0, orders: 0, revenue: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/');
    }
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      if (activeTab === 'users') fetchUsers();
    }
  }, [isAdmin, activeTab]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(apiUrl('/api/admin/stats'));
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(apiUrl('/api/auth/users'));
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(apiUrl(`/api/auth/role`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        toast.success('Role updated successfully');
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update role');
      }
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'tracks', label: 'Track Management', icon: Music },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">
          <RefreshCw size={24} className="spin" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-denied">
          <Shield size={48} />
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <a href="/" className="admin-denied-btn">Go Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Music size={20} />
          Admin Panel
        </div>

        <div className="admin-user-info">
          <div className="admin-avatar">
            {user?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="admin-user-name">{user?.display_name || user?.email}</div>
            <div className="admin-user-role">Administrator</div>
          </div>
        </div>

        <nav className="admin-nav">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
          <button className="admin-nav-item" onClick={() => navigate('/')}>
            <LogOut size={18} />
            Back to Site
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          {activeTab === 'overview' && (
            <>
              <h1 className="admin-page-title">Dashboard Overview</h1>

              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-icon stat-icon-yellow"><Users size={20} /></div>
                  <div className="stat-value">{loadingStats ? '...' : stats.users}</div>
                  <div className="stat-label">Total Users</div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon stat-icon-blue"><Music size={20} /></div>
                  <div className="stat-value">{loadingStats ? '...' : stats.tracks}</div>
                  <div className="stat-label">Total Tracks</div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon stat-icon-green"><ShoppingCart size={20} /></div>
                  <div className="stat-value">{loadingStats ? '...' : stats.orders}</div>
                  <div className="stat-label">Total Orders</div>
                </div>
                <div className="admin-stat-card">
                  <div className="stat-icon stat-icon-yellow"><DollarSign size={20} /></div>
                  <div className="stat-value">${loadingStats ? '...' : stats.revenue.toLocaleString()}</div>
                  <div className="stat-label">Total Revenue</div>
                </div>
              </div>

              <div className="admin-quick-actions">
                <h2>Quick Actions</h2>
                <div className="quick-actions-grid">
                  <button className="quick-action-card" onClick={() => setActiveTab('users')}>
                    <UserCog size={18} />
                    Manage Users
                  </button>
                  <button className="quick-action-card" onClick={() => setActiveTab('tracks')}>
                    <Music size={18} />
                    Manage Tracks
                  </button>
                  <button className="quick-action-card" onClick={() => setActiveTab('analytics')}>
                    <BarChart3 size={18} />
                    View Analytics
                  </button>
                  <button className="quick-action-card" onClick={() => setActiveTab('settings')}>
                    <Settings size={18} />
                    Site Settings
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <>
              <div className="admin-manage-header">
                <h1 className="admin-page-title" style={{ marginBottom: 0 }}>User Management</h1>
                <button className="admin-refresh-btn" onClick={fetchUsers}>
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>

              <div className="admin-manage-filters" style={{ marginTop: 24 }}>
                <div className="amf-item">
                  <label className="amf-label">Search Users</label>
                  <div className="amf-search-wrap">
                    <Search size={14} className="amf-search-icon" />
                    <input
                      className="amf-input"
                      placeholder="Search by email or name..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {loadingUsers ? (
                <div className="admin-loading-inline">
                  <RefreshCw size={20} className="spin" />
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="admin-empty">
                  <Users size={48} />
                  <p>No users found</p>
                </div>
              ) : (
                <div className="admin-tracks-table-wrap">
                  <table className="admin-tracks-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="admin-track-row">
                          <td>
                            <div className="admin-track-info">
                              <span className="admin-track-title">{u.display_name || 'N/A'}</span>
                            </div>
                          </td>
                          <td><span className="admin-meta">{u.email}</span></td>
                          <td>
                            <span className={`amt-status-pill ${u.role === 'admin' ? 'admin-role-admin' : u.role === 'producer' ? 'admin-role-producer' : ''}`}>
                              <span className="amt-status-dot" style={{ background: u.role === 'admin' ? '#eab308' : u.role === 'producer' ? '#60a5fa' : '#34d399' }} />
                              {u.role}
                            </span>
                          </td>
                          <td><span className="admin-meta">{new Date(u.createdAt).toLocaleDateString()}</span></td>
                          <td>
                            <div className="admin-action-cell">
                              <select
                                className="amf-select"
                                value={u.role}
                                onChange={e => handleRoleChange(u.id, e.target.value)}
                                style={{ width: 'auto', minWidth: 100 }}
                              >
                                <option value="user">User</option>
                                <option value="producer">Producer</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'tracks' && (
            <div className="admin-denied" style={{ minHeight: '60vh' }}>
              <Music size={48} style={{ opacity: 0.3 }} />
              <h2>Track Management</h2>
              <p>Track management features coming soon.</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="admin-denied" style={{ minHeight: '60vh' }}>
              <BarChart3 size={48} style={{ opacity: 0.3 }} />
              <h2>Analytics</h2>
              <p>Detailed analytics coming soon.</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="admin-denied" style={{ minHeight: '60vh' }}>
              <Settings size={48} style={{ opacity: 0.3 }} />
              <h2>Site Settings</h2>
              <p>Site settings coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
