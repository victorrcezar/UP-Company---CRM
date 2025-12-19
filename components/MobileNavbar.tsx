
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 z-[50] pb-safe safe-area-bottom shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
      <div className="grid grid-cols-5 h-16 items-center">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className="flex flex-col items-center justify-center h-full w-full active:scale-90 transition-transform duration-200 relative"
            >
              {/* Active Indicator Glow */}
              {isActive && (
                  <div className="absolute top-0 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              )}

              <div 
                className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 mb-1
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                    : 'text-gray-400 dark:text-gray-500 bg-transparent'
                  }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span 
                className={`text-[9px] font-black uppercase tracking-wide transition-colors duration-300 
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400 dark:text-gray-600'
                  }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Menu Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="flex flex-col items-center justify-center h-full w-full active:scale-90 transition-transform duration-200 group"
        >
          <div className="w-9 h-9 flex items-center justify-center rounded-xl mb-1 text-gray-400 dark:text-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-colors">
            <Menu size={20} strokeWidth={2} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-wide text-gray-400 dark:text-gray-600">
            Menu
          </span>
        </button>
      </div>
    </div>
  );
};

export default MobileNavbar;
