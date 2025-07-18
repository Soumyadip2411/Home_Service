import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiThumbsUp, FiCalendar, FiGrid } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';

const navItems = [
  { to: '/', icon: FiHome, label: 'Home' },
  { to: '/recommendations', icon: FiThumbsUp, label: 'Recs' },
  { to: '/bookings', icon: FiCalendar, label: 'Book' },
  { to: '/services', icon: FiGrid, label: 'Serv' },
  { to: '/bot-chat', icon: FaRobot, label: 'Bot' },
];

const MobileFooter = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-between items-center px-2 py-1 sm:hidden">
      {navItems.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to || (to === '/' && location.pathname === '/home');
        return (
          <button
            key={to}
            onClick={() => navigate(to)}
            className={`flex flex-col items-center justify-center flex-1 py-1 ${active ? 'text-green-600' : 'text-gray-500 hover:text-green-500'} focus:outline-none`}
          >
            <Icon className="text-xl mb-0.5" />
            {/* Optionally show label below icon: */}
            {/* <span className="text-[10px] font-medium">{label}</span> */}
          </button>
        );
      })}
    </nav>
  );
};

export default MobileFooter; 