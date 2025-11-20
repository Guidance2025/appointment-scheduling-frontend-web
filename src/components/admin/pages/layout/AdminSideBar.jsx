import React from 'react'
import { useState } from 'react';
import schoolLogo from './../../../../assets/school-logo.png';
import { Folder, PanelsTopLeft, Square, UserSquare2 } from 'lucide-react';

const AdminSideBar = ({ onNavigate , currentPage}) => {
   const [activeItem, setActiveItem] = useState(currentPage);
   const [clickedItem, setClickedItem] = useState('');
   
   const navItems = [
     { name: 'Manage Student', icon: PanelsTopLeft, component: 'Registration' },
     { name: 'Manage Accounts', icon: UserSquare2, component: 'Accounts' }, 
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
             <span className="nav-icon"><item.icon size={20} strokeWidth={2} /></span>
             <span className="nav-text">{item.name}</span>
           </div>
         ))}
       </nav>
       
     </div>
   );
}

export default AdminSideBar
