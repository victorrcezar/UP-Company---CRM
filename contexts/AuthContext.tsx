
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { db } from '../services/mockDb';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut, confirmPasswordReset as firebaseConfirmReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  login: (email: string, password?: string) => Promise<string | null>;
  logout: () => void;
  resetPassword: (email: string) => Promise<string | null>;
  verifyResetCode: (oobCode: string) => Promise<string | null>;
  confirmReset: (oobCode: string, newPassword: string) => Promise<string | null>;
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
      // Busca tenants atualizados do banco (COM PERSISTÊNCIA)
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

  const login = async (email: string, password?: string): Promise<string | null> => {
    const allUsers = await db.getAllUsers();
    // Busca user de forma case-insensitive para evitar "system/user-not-found" indevido
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!foundUser) {
        console.error("Usuário não encontrado na base de dados do sistema.");
        return 'system/user-not-found';
    }

    if (password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log("✅ Login autenticado via Firebase Auth");
            
            localStorage.setItem('up_crm_user_id', foundUser.id);
            setUser(foundUser);
            await setupUserEnvironment(foundUser);
            return null; // Sucesso retorna null

        } catch (error: any) {
            console.error("❌ Falha na autenticação:", error.code);
            return error.code || 'auth/unknown-error'; // Retorna o código do erro
        }
    }

    return 'auth/missing-password';
  };

  const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Erro ao deslogar do Firebase", error);
    }
    localStorage.removeItem('up_crm_user_id');
    localStorage.removeItem('up_crm_tenant_id');
    setUser(null);
    setCurrentTenant(null);
    setAvailableTenants([]);
  };

  const resetPassword = async (email: string): Promise<string | null> => {
      try {
          console.log(`📨 Tentando enviar reset de senha para: ${email}...`);
          auth.languageCode = 'pt-BR';
          await sendPasswordResetEmail(auth, email);
          console.log("✅ Reset de senha enviado com sucesso pelo Firebase!");
          return null; // Null indica sucesso
      } catch (error: any) {
          console.error("❌ Erro ao enviar reset de senha:", error.code, error.message);
          return error.code || 'unknown'; // Retorna o código do erro
      }
  };

  const verifyResetCode = async (oobCode: string): Promise<string | null> => {
      try {
          const email = await verifyPasswordResetCode(auth, oobCode);
          return email;
      } catch (error) {
          console.error("Código de reset inválido:", error);
          return null;
      }
  };

  const confirmReset = async (oobCode: string, newPassword: string): Promise<string | null> => {
      try {
          await firebaseConfirmReset(auth, oobCode, newPassword);
          console.log("✅ Senha redefinida com sucesso no Firebase!");
          return null; // Sucesso
      } catch (error: any) {
          console.error("❌ Erro ao confirmar reset de senha:", error.code, error.message);
          return error.code || 'unknown'; // Retorna código do erro
      }
  };

  const switchTenant = async (tenantId: string) => {
    if (user?.role !== 'super_admin') {
        console.warn("Tentativa não autorizada de troca de tenant.");
        return;
    }

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
      setAvailableTenants(prev => prev.map(t => t.id === updatedTenant.id ? updatedTenant : t));
  };

  const updateUserProfile = async (updates: Partial<User>) => {
      if (!user) return;
      const updatedUser = await db.updateUser(user.id, updates);
      setUser({ ...user, ...updatedUser });
  };

  const createClient = async (data: { name: string, email: string, companyName: string, category: string }) => {
      await db.createSystemClient(data);
      if (user?.role === 'super_admin') {
          const allTenants = await db.getAllTenants();
          setAvailableTenants(allTenants);
      }
  };

  const updateSystemClient = async (tenantId: string, data: { name: string, category: string, adminName?: string, adminEmail?: string }) => {
      await db.updateSystemClient(tenantId, data);
      const allTenants = await db.getAllTenants();
      setAvailableTenants(allTenants);
      if (currentTenant?.id === tenantId) {
          const updated = allTenants.find(t => t.id === tenantId);
          if (updated) setCurrentTenant(updated);
      }
  };

  const deleteSystemClient = async (tenantId: string) => {
      await db.deleteTenant(tenantId);
      const updatedTenants = await db.getAllTenants();
      setAvailableTenants(updatedTenants);
      if (currentTenant?.id === tenantId) {
          const nextTenant = updatedTenants[0];
          if (nextTenant) {
              switchTenant(nextTenant.id);
          }
      }
  };

  return (
    <AuthContext.Provider value={{ user, currentTenant, availableTenants, login, logout, resetPassword, verifyResetCode, confirmReset, switchTenant, updateTenantProfile, updateUserProfile, createClient, updateSystemClient, deleteSystemClient, isLoading }}>
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
