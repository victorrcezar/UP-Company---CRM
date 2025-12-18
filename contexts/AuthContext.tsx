
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { db, TENANTS, USERS } from '../services/mockDb';

interface AuthContextType {
  user: User | null;
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  login: (email: string, password?: string) => Promise<boolean>;
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

  // Helper para configurar ambiente baseado no usuário
  const setupUserEnvironment = async (loggedUser: User) => {
      // Busca tenants atualizados do banco
      const allTenants = await db.getAllTenants();

      if (loggedUser.role === 'super_admin') {
          // Super Admin vê tudo
          setAvailableTenants(allTenants);
          
          // Tenta restaurar o último tenant acessado ou vai para o master
          const lastTenantId = localStorage.getItem('up_crm_tenant_id') || loggedUser.tenantId;
          const targetTenant = allTenants.find(t => t.id === lastTenantId) || allTenants[0];
          
          setCurrentTenant(targetTenant);
          db.setTenant(targetTenant.id);
      } else {
          // Usuário Comum/Admin de Tenant: ISOLAMENTO TOTAL
          // Filtra apenas o tenant ao qual ele pertence
          const userTenant = allTenants.find(t => t.id === loggedUser.tenantId);
          
          if (userTenant) {
              setAvailableTenants([userTenant]); // Array com apenas 1 item
              setCurrentTenant(userTenant);
              db.setTenant(userTenant.id);
              localStorage.setItem('up_crm_tenant_id', userTenant.id);
          } else {
              console.error("Tenant do usuário não encontrado. Contate o suporte.");
              // Fallback de segurança
              setAvailableTenants([]);
              setCurrentTenant(null);
          }
      }
  };

  // Simulate session check
  useEffect(() => {
    const checkSession = async () => {
        const storedUserId = localStorage.getItem('up_crm_user_id');
        if (storedUserId) {
            const allUsers = await db.getAllUsers();
            const foundUser = allUsers.find(u => u.id === storedUserId);
            
            if (foundUser) {
                setUser(foundUser);
                await setupUserEnvironment(foundUser);
            }
        }
        setIsLoading(false);
    };
    checkSession();
  }, []);

  const login = async (email: string, password?: string) => {
    const allUsers = await db.getAllUsers();
    const foundUser = allUsers.find(u => u.email === email);
    
    if (foundUser) {
        // Validação de segurança específica para o Super Admin
        if (foundUser.role === 'super_admin' && foundUser.email === 'victor@upandco.com.br') {
            if (password !== 'Victor585722!#@') {
                console.error("Senha incorreta para Super Admin");
                return false;
            }
        } 
        // Senha padrão para outros usuários
        else {
            if (password && password !== '123456') {
                return false;
            }
        }

        localStorage.setItem('up_crm_user_id', foundUser.id);
        setUser(foundUser);
        
        // Configura o ambiente (Isolamento ou Acesso Total)
        await setupUserEnvironment(foundUser);
        
        return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('up_crm_user_id');
    localStorage.removeItem('up_crm_tenant_id');
    setUser(null);
    setCurrentTenant(null);
    setAvailableTenants([]);
  };

  const switchTenant = async (tenantId: string) => {
    // SEGURANÇA: Só permite trocar se for super_admin
    // Usuários comuns não podem invocar essa função para tenants alheios
    if (user?.role !== 'super_admin') {
        console.warn("Tentativa não autorizada de troca de tenant.");
        return;
    }

    // Refresh list to ensure we have the latest
    const allTenants = await db.getAllTenants();
    setAvailableTenants(allTenants);

    const tenant = allTenants.find(t => t.id === tenantId);
    if (tenant) {
        db.setTenant(tenant.id);
        localStorage.setItem('up_crm_tenant_id', tenant.id);
        setCurrentTenant(tenant);
    }
  };

  const updateTenantProfile = async (updates: Partial<Tenant>) => {
      if (!currentTenant) return;
      const updatedTenant = await db.updateTenant(currentTenant.id, updates);
      setCurrentTenant(updatedTenant);
      
      // Atualiza a lista disponível
      setAvailableTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
  };

  const updateUserProfile = async (updates: Partial<User>) => {
      if (!user) return;
      const updatedUser = await db.updateUser(user.id, updates);
      // Atualiza o estado local do usuário com os dados mesclados
      setUser({ ...user, ...updatedUser });
  };

  const createClient = async (data: { name: string, email: string, companyName: string, category: string }) => {
      // Create in DB
      await db.createSystemClient(data);
      
      // Update local state for immediate visibility ONLY if super_admin
      if (user?.role === 'super_admin') {
          const allTenants = await db.getAllTenants();
          setAvailableTenants(allTenants);
      }
  };

  const updateSystemClient = async (tenantId: string, data: { name: string, category: string, adminName?: string, adminEmail?: string }) => {
      // 1. Update Tenant
      const updatedTenant = await db.updateTenant(tenantId, { name: data.name, category: data.category });
      
      // 2. Update Admin User
      if (data.adminName || data.adminEmail) {
          const admin = await db.getTenantAdmin(tenantId);
          if (admin) {
              await db.updateUser(admin.id, { name: data.adminName, email: data.adminEmail });
          }
      }

      // 3. Update Local State
      setAvailableTenants(prev => prev.map(t => t.id === tenantId ? updatedTenant : t));
      
      // If updating current tenant, update that too
      if (currentTenant?.id === tenantId) {
          setCurrentTenant(updatedTenant);
      }
  };

  const deleteSystemClient = async (tenantId: string) => {
      await db.deleteTenant(tenantId);
      
      // Update local state
      const updatedTenants = availableTenants.filter(t => t.id !== tenantId);
      setAvailableTenants(updatedTenants);

      // If user was viewing the deleted tenant, switch to the first available or master
      if (currentTenant?.id === tenantId) {
          const nextTenant = updatedTenants[0];
          if (nextTenant) {
              switchTenant(nextTenant.id);
          }
      }
  };

  return (
    <AuthContext.Provider value={{ user, currentTenant, availableTenants, login, logout, switchTenant, updateTenantProfile, updateUserProfile, createClient, updateSystemClient, deleteSystemClient, isLoading }}>
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
