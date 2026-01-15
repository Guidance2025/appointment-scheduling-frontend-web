import React, { useState } from 'react';
import '../../css/Sidebar.css';
import schoolLogo from '../../assets/school-logo.png';
import { 
  CalendarDays, 
  LayoutGrid, 
  CalendarClock, 
  UserSquare2, 
  FolderOpen, 
  GitCommit,
  ShieldHalfIcon
} from 'lucide-react';

const Sidebar = ({ onNavigate, currentPage }) => {
  const [activeItem, setActiveItem] = useState(currentPage);
  const [clickedItem, setClickedItem] = useState('');

  const navItems = [
    { name: 'Dashboard', icon: LayoutGrid, component: 'Dashboard' },
    { name: 'Calendar', icon: CalendarDays, component: 'Calendar' },
    { name: 'Appointments', icon: CalendarClock, component: 'Appointments' },
    { name: 'Exit Interview', icon: FolderOpen, component: 'ExitInterview' },
    { name: 'Mood Management', icon: UserSquare2, component: 'MoodTrend' },
    { name: 'Self-Assessment', icon: ShieldHalfIcon, component: 'SelfAssesment' },
  ];

  const handleItemClick = (item) => {
    setActiveItem(item.name);
    setClickedItem(item.name);

    if (onNavigate) {
      onNavigate(item.component);
    }

    setTimeout(() => {
      setClickedItem('');
    }, 300);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img src={schoolLogo} alt="School Logo" className="logo-icon" />
          <h1 className="logo-text">GABAY</h1>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <div
            key={item.name}
            className={`nav-item ${activeItem === item.name ? 'nav-item-active' : ''} ${clickedItem === item.name ? 'clicked' : ''}`}
            onClick={() => handleItemClick(item)}
          >
            <span className="nav-icon"><item.icon size={20} strokeWidth={2} /></span>
            <span className="nav-text">{item.name}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;