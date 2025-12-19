
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MobileNavbar from './components/MobileNavbar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Agenda from './pages/Agenda';
import Clients from './pages/Clients';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route Component
const RequireAuth = ({ children }: { children?: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#020617]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

// Layout Component (Sidebar + Header + Content)
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-500 overflow-hidden font-sans relative">
      
      {/* --- BACKGROUND DINÂMICO (Estilo Login) --- */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          {/* Grid Pattern Sutil */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-50 dark:opacity-20"></div>
          
          {/* Orbs de Luz - Cores adaptadas para Light/Dark */}
          {/* Top Left - Blue */}
          <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[80px] md:blur-[120px] animate-pulse-slow mix-blend-multiply dark:mix-blend-screen"></div>
          
          {/* Bottom Right - Purple */}
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-400/20 dark:bg-purple-600/15 rounded-full blur-[80px] md:blur-[120px] animate-pulse-slow mix-blend-multiply dark:mix-blend-screen animation-delay-2000"></div>
          
          {/* Center - Emerald (Sutil) */}
          <div className="absolute top-[40%] left-[40%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse-slow mix-blend-multiply dark:mix-blend-screen animation-delay-4000"></div>
      </div>

      {/* --- Z-INDEX LAYER PARA CONTEÚDO --- */}
      <div className="relative z-10 flex w-full h-full">
          <Sidebar 
            isOpen={sidebarOpen} 
            toggleSidebar={toggleSidebar} 
            isCollapsed={isCollapsed}
            toggleCollapse={toggleCollapse}
          />

          <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
            <Header toggleSidebar={toggleSidebar} />
            
            <main className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8 scroll-smooth relative custom-scrollbar">
              <div className="max-w-[1920px] mx-auto">
                 <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/pipeline" element={<Pipeline />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                 </Routes>
              </div>
            </main>
          </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNavbar toggleSidebar={toggleSidebar} />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={
                <RequireAuth>
                    <MainLayout />
                </RequireAuth>
            } />
          </Routes>
        </Router>
    </AuthProvider>
  );
};

export default App;
