import React from 'react'
import { useState } from 'react';
import schoolLogo from './../../../../assets/school-logo.png';

const AdminSideBar = ({ onNavigate , currentPage}) => {
   const [activeItem, setActiveItem] = useState(currentPage);
   const [clickedItem, setClickedItem] = useState('');
   
   const navItems = [
     { name: 'Manage Student', icon: '📅', component: 'Registration' },
     { name: 'Manage Accounts', icon: '📊', component: 'Accounts' }, 
   ];
 
   const handleItemClick = (item) => {
     setActiveItem(item.name);
     setClickedItem(item.name);
     
     if (onNavigate) {
       onNavigate(item.component);
     }
     
     setTimeout(() => {
       setClickedItem('');
     }, 600);
   };
 
   const handleLogOutClick = () => {
     localStorage.removeItem("jwtToken");
     window.location.href = '/GuidanceLogin';
   } 
 
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
             <span className="nav-icon">{item.icon}</span>
             <span className="nav-text">{item.name}</span>
           </div>
         ))}
       </nav>
       <button onClick={handleLogOutClick}> Logout</button>
       
     </div>
   );
}

export default AdminSideBar
