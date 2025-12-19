
import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Moon, Sun, Menu, User, Check, AlertCircle, RefreshCw, CheckCircle, Info, ChevronDown, Settings, ChevronLeft, Building, LogOut } from 'lucide-react';
import { db } from '../services/mockDb';
import { Notification } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { googleCalendar } from '../services/googleCalendar';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, currentTenant, availableTenants, switchTenant, logout } = useAuth();
  
  const [darkMode, setDarkMode] = useState(false);
  const [dateTime, setDateTime] = useState({ time: '', date: '' });
  const [isGoogleConnected, setIsGoogleConnected] = useState(true);
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false); 
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [showTenantSwitcher, setShowTenantSwitcher] = useState(false);
  const tenantSwitcherRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const dateStr = now.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }).replace('.', '');

      setDateTime({
        time: timeStr,
        date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1)
      });
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const data = await db.getNotifications();
      setNotifications(data);
      setIsGoogleConnected(googleCalendar.isConnected());
    };
    fetchNotifications();
    const poll = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(poll);
  }, [currentTenant]);

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
        setTimeout(() => setShowSettings(false), 200);
      }
      if (tenantSwitcherRef.current && !tenantSwitcherRef.current.contains(event.target as Node)) {
          setShowTenantSwitcher(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    await db.markAllRead();
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertCircle size={18} className="text-red-500" />;
      case 'update': return <RefreshCw size={18} className="text-purple-500" />;
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  return (
    <header className="h-16 md:h-20 sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 transition-colors duration-300
        bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
      
      <div className="flex items-center gap-4">
        {/* Menu button hidden on mobile usually, controlled by bottom nav or sidebar logic */}
        <button 
          onClick={toggleSidebar} 
          className="hidden md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl active:scale-95 transition-all"
        >
          <Menu size={24} />
        </button>
        
        {/* Mobile Title */}
        <div className="md:hidden flex items-center gap-2">
             <img src="https://static.wixstatic.com/media/1f17f3_1e2b54d2fd894dd997c6cbc18e940576~mv2.png" className="h-7 w-auto" alt="Logo" />
        </div>

        {user?.role === 'super_admin' && (
            <div className="relative hidden md:block" ref={tenantSwitcherRef}>
                <button 
                    onClick={() => setShowTenantSwitcher(!showTenantSwitcher)}
                    className="flex items-center gap-3 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-95"
                >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 p-1 border border-slate-200 dark:border-slate-600">
                        {currentTenant?.logoUrl ? (
                            <img src={currentTenant.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Building size={16} className="text-slate-500" />
                        )}
                    </div>
                    <div className="text-left hidden lg:block">
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Visualizando</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none truncate max-w-[150px]">{currentTenant?.name}</p>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showTenantSwitcher ? 'rotate-180' : ''}`} />
                </button>

                {showTenantSwitcher && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 z-50 animate-scale-up overflow-hidden origin-top-left">
                        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <p className="text-xs font-bold text-slate-500 uppercase">Seus Clientes</p>
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {availableTenants.map(tenant => (
                                <button
                                    key={tenant.id}
                                    onClick={() => { switchTenant(tenant.id); setShowTenantSwitcher(false); }}
                                    className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0 text-left
                                        ${currentTenant?.id === tenant.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                    `}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-1 flex items-center justify-center shrink-0">
                                        {tenant.logoUrl ? (
                                            <img src={tenant.logoUrl} alt={tenant.name} className="w-full h-full object-contain" />
                                        ) : (
                                            <Building size={18} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${currentTenant?.id === tenant.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-100'}`}>{tenant.name}</p>
                                        <p className="text-xs text-slate-500">{tenant.category}</p>
                                    </div>
                                    {currentTenant?.id === tenant.id && <Check size={16} className="text-blue-500" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className={`hidden lg:flex items-center bg-white/50 dark:bg-white/5 rounded-2xl px-4 py-2.5 border border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 ${user?.role === 'super_admin' ? 'w-64 focus-within:w-80' : 'w-96 focus-within:w-[28rem]'}`}>
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar em todo o sistema..." 
            className="bg-transparent border-none outline-none ml-3 w-full text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <div className="hidden md:flex flex-col items-center justify-center bg-white/60 dark:bg-white/5 rounded-xl px-4 py-1.5 border border-slate-200 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
            <span className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono leading-none tracking-widest tabular-nums">
                {dateTime.time}
            </span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">
                {dateTime.date}
            </span>
        </div>

        <button 
          onClick={toggleTheme} 
          className="p-2 md:p-2.5 text-slate-500 hover:bg-white dark:hover:bg-slate-800 rounded-full transition-all hover:rotate-12 active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
        </button>
        
        <div className="relative flex items-center" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 md:p-2.5 text-slate-500 hover:bg-white dark:hover:bg-slate-800 rounded-full relative transition-all active:scale-95 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 ${showNotifications ? 'bg-blue-50 text-blue-500 dark:bg-slate-800' : ''}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-[-60px] md:right-0 top-14 md:top-16 w-[300px] md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up origin-top-right z-50">
              {/* Notification panel content remains same */}
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                {!showSettings ? (
                    <>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg">Notificações</h3>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Centro de Alertas</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                            <button onClick={markAllAsRead} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors" title="Marcar lidas"><Check size={18} /></button>
                            )}
                            <button onClick={() => setShowSettings(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><Settings size={18} /></button>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                         <button onClick={() => setShowSettings(false)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"><ChevronLeft size={20} /></button>
                         <h3 className="font-black text-slate-900 dark:text-slate-100">Configurações</h3>
                    </div>
                )}
              </div>
              
              <div className="max-h-[360px] overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                  {notifications.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {notifications.map((notification) => (
                      <div key={notification.id} className={`px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-white dark:bg-slate-900' : ''}`}>
                          {!notification.read && <span className="absolute left-0 top-6 w-1 h-8 bg-blue-500 rounded-r-full shadow-lg shadow-blue-500/50"></span>}
                          <div className="flex gap-4">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                                  {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start mb-1.5">
                                      <p className={`text-sm font-bold ${!notification.read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-500'}`}>{notification.title}</p>
                                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 font-bold">{formatTimeAgo(notification.timestamp)}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 font-medium">{notification.message}</p>
                              </div>
                          </div>
                      </div>
                      ))}
                  </div>
                  ) : (
                  <div className="py-16 text-center text-slate-400">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={24} className="opacity-40" />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest opacity-60">Tudo limpo por aqui</p>
                  </div>
                  )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-2 md:pl-6 border-l border-slate-200/50 dark:border-slate-700/50 relative group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.name || 'User'}</p>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user?.role === 'super_admin' ? 'Gestor Master' : 'Agente'}</p>
          </div>
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-slate-800 dark:to-slate-600 p-[2px] cursor-pointer hover:scale-105 transition-transform shadow-lg">
             <div className="w-full h-full rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center">
                <User size={18} className="text-slate-700 dark:text-slate-300 md:w-5 md:h-5" />
             </div>
          </div>

          <div className="absolute right-0 top-full mt-4 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 p-2 transform origin-top-right">
             <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors uppercase tracking-widest">
                 <LogOut size={16} /> Sair do Sistema
             </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
