
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { db, TENANTS, USERS } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  login: (email: string) => Promise<boolean>;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  updateTenantProfile: (updates: Partial<Tenant>) => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  createClient: (data: { name: string, email: string, companyName: string, category: string }) => Promise<void>;
  updateSystemClient: (tenantId: string, data: { name: string, category: string, adminName?: string, adminEmail?: string }) => Promise<void>;
  deleteSystemClient: (tenantId: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate session check
  useEffect(() => {
    const storedUserId = localStorage.getItem('up_crm_user_id');
    if (storedUserId) {
        const foundUser = USERS.find(u => u.id === storedUserId);
        if (foundUser) {
            setUser(foundUser);
            // If super admin, load all tenants, else load only own tenant
            if (foundUser.role === 'super_admin') {
                setAvailableTenants(TENANTS);
            } else {
                setAvailableTenants(TENANTS.filter(t => t.id === foundUser.tenantId));
            }
            
            // Restore last selected tenant or default
            const lastTenantId = localStorage.getItem('up_crm_tenant_id') || foundUser.tenantId;
            const tenant = TENANTS.find(t => t.id === lastTenantId) || TENANTS[0];
            
            setCurrentTenant(tenant);
            db.setTenant(tenant.id);
        }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    const foundUser = USERS.find(u => u.email === email);
    if (foundUser) {
        localStorage.setItem('up_crm_user_id', foundUser.id);
        setUser(foundUser);
        
        // Setup tenants based on role
        if (foundUser.role === 'super_admin') {
            setAvailableTenants(TENANTS);
        } else {
            setAvailableTenants(TENANTS.filter(t => t.id === foundUser.tenantId));
        }

        // Set default tenant
        const defaultTenant = TENANTS.find(t => t.id === foundUser.tenantId) || TENANTS[0];
        setCurrentTenant(defaultTenant);
        db.setTenant(defaultTenant.id);
        localStorage.setItem('up_crm_tenant_id', defaultTenant.id);
        
        return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('up_crm_user_id');
    localStorage.removeItem('up_crm_tenant_id');
    setUser(null);
    setCurrentTenant(null);
  };

  const switchTenant = (tenantId: string) => {
    // Only allow if user is super_admin or belongs to tenant
    if (user?.role !== 'super_admin' && user?.tenantId !== tenantId) return;

    const tenant = TENANTS.find(t => t.id === tenantId);
    if (tenant) {
        // 1. Set the DB context first
        db.setTenant(tenant.id);
        localStorage.setItem('up_crm_tenant_id', tenant.id);
        
        // 2. Update state to trigger re-renders in subscribing components (Dashboard, Leads, etc.)
        setCurrentTenant(tenant);
    }
  };

  // --- Methods added to match root AuthContext functionality ---
  
  const updateTenantProfile = async (updates: Partial<Tenant>) => {
      if (!currentTenant) return;
      // In a real app this would call db.updateTenant
      const updated = { ...currentTenant, ...updates };
      setCurrentTenant(updated);
      setAvailableTenants(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const updateUserProfile = async (updates: Partial<User>) => {
      if (!user) return;
      // In a real app this would call db.updateUser
      setUser({ ...user, ...updates });
  };

  const createClient = async (data: { name: string, email: string, companyName: string, category: string }) => {
      // Mock implementation
      console.log("Creating client", data);
      // For mock purposes, just update local state if needed or do nothing
  };

  const updateSystemClient = async (tenantId: string, data: { name: string, category: string, adminName?: string, adminEmail?: string }) => {
      // Mock implementation
      console.log("Updating client", tenantId, data);
  };

  const deleteSystemClient = async (tenantId: string) => {
      // Mock implementation
      console.log("Deleting client", tenantId);
      setAvailableTenants(prev => prev.filter(t => t.id !== tenantId));
      if (currentTenant?.id === tenantId) {
          setCurrentTenant(null);
      }
  };

  return (
    <AuthContext.Provider value={{ 
        user, currentTenant, availableTenants, 
        login, logout, switchTenant, 
        updateTenantProfile, updateUserProfile,
        createClient, updateSystemClient, deleteSystemClient,
        isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
