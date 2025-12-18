
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Trello, Settings, LogOut, Calendar, ChevronLeft, ChevronRight, Handshake } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const { currentTenant, logout } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={2} />, path: '/' },
    { name: 'Agenda', icon: <Calendar size={20} strokeWidth={2} />, path: '/agenda' },
    { name: 'Leads (CRM)', icon: <Users size={20} strokeWidth={2} />, path: '/leads' },
    { name: 'Funil de Vendas', icon: <Trello size={20} strokeWidth={2} />, path: '/pipeline' },
    { name: 'Clientes', icon: <Handshake size={20} strokeWidth={2} />, path: '/clients' },
  ];

  const isActive = (path: string) => location.pathname === path;
  const UP_LOGO_URL = "https://static.wixstatic.com/media/1f17f3_1e2b54d2fd894dd997c6cbc18e940576~mv2.png";

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside className={`
        fixed inset-y-0 left-0 z-50 
        bg-[#0F172A] text-slate-300
        transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]
        border-r border-slate-800
        flex flex-col shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0
        ${isCollapsed ? 'md:w-[5.5rem]' : 'md:w-[17rem]'}
      `}>
        
        {/* Toggle Button - Desktop */}
        <button 
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-10 w-6 h-6 bg-[#0F172A] border border-slate-700 rounded-full items-center justify-center text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-600 shadow-lg z-50 transition-all duration-300 hover:scale-110 group"
        >
          {isCollapsed ? <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
        </button>

        {/* Header */}
        <div className={`h-28 flex flex-col items-center justify-center transition-all duration-500 ${isCollapsed ? 'px-2' : 'px-6'}`}>
          <div className="relative group cursor-pointer" onClick={() => !isCollapsed && window.location.reload()}>
              <img 
                  src={UP_LOGO_URL} 
                  alt="UP! Company" 
                  className={`object-contain transition-all duration-500 filter brightness-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] ${isCollapsed ? 'w-10 h-10' : 'h-8 w-auto'}`} 
              />
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          </div>
          
          <div className={`overflow-hidden transition-all duration-500 flex flex-col items-center ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100 mt-4'}`}>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center truncate w-full">
                  {currentTenant?.name || 'UP! CRM'}
              </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (window.innerWidth < 768) toggleSidebar(); }}
                title={isCollapsed ? item.name : ''}
                className={`
                  group flex items-center gap-3 px-3.5 py-3.5 rounded-2xl transition-all duration-300 font-medium text-sm relative overflow-hidden
                  ${active 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_8px_20px_-6px_rgba(59,130,246,0.4)] translate-y-[-1px]' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  } 
                  ${isCollapsed ? 'justify-center px-0 w-12 mx-auto' : ''}`
                }
              >
                <div className={`shrink-0 transition-all duration-300 relative z-10 ${isCollapsed ? 'scale-110' : ''}`}>
                    {React.cloneElement(item.icon as React.ReactElement, { 
                      className: `${active ? 'animate-pulse' : ''}` 
                    })}
                </div>
                
                <span 
                  className={`whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] relative z-10
                  ${isCollapsed 
                      ? 'w-0 opacity-0 translate-x-10 absolute left-full' 
                      : 'w-auto opacity-100 translate-x-0'
                  }
                  ${active ? 'font-bold tracking-tight' : 'font-medium'}
                  `}
                >
                    {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 mx-2 mb-2 bg-[#0F172A] border-t border-slate-800/50">
           <div className={`flex flex-col gap-1 transition-all duration-300 ${isCollapsed ? 'items-center' : ''}`}>
             <Link 
                to="/settings" 
                title="Configurações" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-white/5 hover:text-white transition-all font-medium text-sm group ${isCollapsed ? 'justify-center w-12' : 'w-full'}`}
             >
                <Settings size={20} className="shrink-0 group-hover:rotate-90 transition-transform duration-500" />
                {!isCollapsed && <span className="whitespace-nowrap">Configurações</span>}
              </Link>
             <button 
                onClick={logout} 
                title="Sair" 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium text-sm group ${isCollapsed ? 'justify-center w-12' : 'w-full'}`}
             >
                <LogOut size={20} className="shrink-0 group-hover:-translate-x-1 transition-transform" />
                {!isCollapsed && <span className="whitespace-nowrap">Sair</span>}
             </button>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
