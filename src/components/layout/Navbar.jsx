import '../../css/Navbar.css';

const Navbar = () => { 
  return (
    <nav className="navbar">
      <div className="navbar-actions">
        <div className="navbar-item" >
          <button 
            className="navbar-btn notification-btn" 
          >
              <span className="notification-badge"></span>
          </button>
          
            <div className="dropdown notification-dropdown">
              <div className="dropdown-header">
                <h4>Notifications</h4>
                <span className="count"> new</span>
              </div>
              <div className="notification-list">
                  <div 
                  >
                    <div className="notification-content">
                      <p></p>
                      <span className="time"></span>
                    </div>
                  </div>
              </div>
              <div className="dropdown-footer">
                <button className="view-all-btn">View All</button>
              </div>
            </div>
        </div>

        <div className="navbar-item" >
          <button 
            className="navbar-btn profile-btn" 
            aria-label="Profile Menu"
          >
            <div className="profile-avatar">
            </div>
          </button>
            <div className="dropdown profile-dropdown">
              <div className="profile-header">
                <div className="profile-info">
                  <div className="profile-avatar-large">
                  </div>
                  <div className="profile-details">
                  </div>
                </div>
              </div>
              <div className="profile-menu">
                <button className="menu-item">
                  Profile Settings
                </button>
                <button className="menu-item">
                  Account Settings
                </button>
                <div className="menu-divider"></div>
                <button className="menu-item logout">
                  Logout
                </button>
              </div>
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;