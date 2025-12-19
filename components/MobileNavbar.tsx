
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Handshake, Calendar, Menu } from 'lucide-react';

interface MobileNavbarProps {
  toggleSidebar: () => void;
}

const MobileNavbar: React.FC<MobileNavbarProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { name: 'Dash', icon: LayoutDashboard, path: '/' },
    { name: 'Leads', icon: Users, path: '/leads' },
    { name: 'Clientes', icon: Handshake, path: '/clients' },
    { name: 'Agenda', icon: Calendar, path: '/agenda' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 z-[50] pb-safe safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 relative group
                ${isActive ? 'text-up-accent' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}
              `}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 translate-y-[-2px]' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.name}
              </span>
              {isActive && (
                <span className="absolute -bottom-[1px] w-1 h-1 rounded-full bg-up-accent"></span>
              )}
            </Link>
          );
        })}

        {/* Menu Toggle Button (Opens Sidebar) */}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all active:scale-95"
        >
          <div className="p-1.5">
            <Menu size={20} strokeWidth={2} />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wide opacity-60">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavbar;
