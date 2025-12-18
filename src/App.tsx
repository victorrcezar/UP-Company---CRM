import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Agenda from './pages/Agenda';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Protected Route Component
const RequireAuth = ({ children }: { children?: React.ReactNode }) => {
    const { user, isLoading } = useAuth();
    
    if (isLoading) {
        return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-up-dark"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
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
    <div className="flex h-screen bg-white dark:bg-[#0A1F2E] transition-colors duration-300 overflow-hidden font-sans">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isCollapsed={isCollapsed}
        toggleCollapse={toggleCollapse}
      />

      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-auto p-6 md:p-8 scroll-smooth relative">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
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