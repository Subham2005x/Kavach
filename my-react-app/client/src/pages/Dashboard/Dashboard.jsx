import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { logoutUser } from '../../services/auth.service';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        // Redirect to login if not authenticated
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">🏔️</div>
            <h2>Kavach</h2>
          </div>
          <button 
            className="mobile-close-btn" 
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a href="#" className="nav-item">
            <span className="icon">📈</span>
            <span>Analytics</span>
          </a>
          <a href="#" className="nav-item">
            <span className="icon">⚙️</span>
            <span>Settings</span>
          </a>
          <a href="#" className="nav-item">
            <span className="icon">👤</span>
            <span>Profile</span>
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="dashboard-main">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div>
              <h1>Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'User'}!</h1>
              <p>Here's what's happening with your account today.</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <div className="user-avatar">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" />
                ) : (
                  <div className="avatar-placeholder">
                    {(user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-info">
                <p className="user-name">{user?.displayName || 'User'}</p>
                <p className="user-email">{user?.email || 'No email'}</p>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Total Views</h3>
              <p className="stat-value">12,543</p>
              <span className="stat-change positive">+12.5%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Active Users</h3>
              <p className="stat-value">2,345</p>
              <span className="stat-change positive">+8.2%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>Revenue</h3>
              <p className="stat-value">$45,231</p>
              <span className="stat-change negative">-3.1%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Rating</h3>
              <p className="stat-value">4.8/5</p>
              <span className="stat-change positive">+0.3</span>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="dashboard-content">
          <div className="content-left">
            <div className="card">
              <div className="card-header">
                <h3>Recent Activity</h3>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="card-body">
                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">📝</div>
                    <div className="activity-details">
                      <p className="activity-title">New document created</p>
                      <p className="activity-time">2 hours ago</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">✅</div>
                    <div className="activity-details">
                      <p className="activity-title">Task completed</p>
                      <p className="activity-time">5 hours ago</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">💬</div>
                    <div className="activity-details">
                      <p className="activity-title">New message received</p>
                      <p className="activity-time">1 day ago</p>
                    </div>
                  </div>
                  <div className="activity-item">
                    <div className="activity-icon">🔔</div>
                    <div className="activity-details">
                      <p className="activity-title">System notification</p>
                      <p className="activity-time">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="content-right">
            <div className="card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="card-body">
                <div className="quick-actions">
                  <button className="action-btn">
                    <span className="action-icon">➕</span>
                    <span>Create New</span>
                  </button>
                  <button className="action-btn">
                    <span className="action-icon">📤</span>
                    <span>Upload File</span>
                  </button>
                  <button className="action-btn">
                    <span className="action-icon">📧</span>
                    <span>Send Message</span>
                  </button>
                  <button className="action-btn">
                    <span className="action-icon">📋</span>
                    <span>View Reports</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-header">
                <h3>Account Info</h3>
              </div>
              <div className="card-body">
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Provider:</span>
                    <span className="info-value">
                      {user?.providerData?.[0]?.providerId || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Member Since:</span>
                    <span className="info-value">
                      {user?.metadata?.creationTime 
                        ? new Date(user.metadata.creationTime).toLocaleDateString() 
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
