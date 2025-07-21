import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiHome, FiThumbsUp, FiCalendar, FiGrid, FiShield } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

const MobileFooter = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  // Dynamic routes based on user role
  const navItems = [
    { to: '/', icon: FiHome, label: 'Home' },
    { to: '/recommendations', icon: FiThumbsUp, label: 'Recs' },
    
    { 
      to:  '/bookings',
      icon: FiCalendar,
      label:  'Book'
    },
    
    {
      to:  '/services',
      icon: FiGrid,
      label:'Serv'
    },
    { to: '/bot-chat', icon: FaRobot, label: 'Bot' },
  ];

 
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-between items-center px-2 py-1 sm:hidden">
      {navItems.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || (to === '/' && location.pathname === '/home');
        // Map short label to full name for tooltip
        const tooltip = label === 'Recs' ? 'Recommendations' : label === 'Serv' ? 'Services' : label === 'Book' ? 'Bookings' : label === 'Bot' ? 'Chatbot' : label;
        return (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`group flex flex-col items-center justify-center flex-1 py-1 ${active ? 'text-green-600' : 'text-gray-500 hover:text-green-500'} focus:outline-none`}
            aria-label={tooltip}
          >
            <span className="relative flex flex-col items-center">
              <Icon className="text-xl mb-0.5" />
              {/* Tooltip */}
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-black text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {tooltip}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default MobileFooter; 