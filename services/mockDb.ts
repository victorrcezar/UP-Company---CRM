
import { Lead, Notification, Tag, Tenant, User, Client, DashboardStats, ActivityLog } from '../types';
import { dbFirestore, authPromise } from './firebase';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy 
} from 'firebase/firestore';

// --- DADOS ESTÁTICOS PARA USUÁRIOS E TENANTS ---
export const TENANTS: Tenant[] = [
  { 
      id: 'up-admin', 
      name: 'UP! Sistema Central', 
      category: 'Tecnologia', 
      logoUrl: 'https://static.wixstatic.com/media/1f17f3_1e2b54d2fd894dd997c6cbc18e940576~mv2.png' 
  }
];

export const USERS: User[] = [
  { 
      id: 'admin-master', 
      name: 'Victor (UP! Company)', 
      email: 'victor@upandco.com.br', 
      role: 'super_admin', 
      tenantId: 'up-admin',
      avatar: 'https://ui-avatars.com/api/?name=Victor+Up&background=0F172A&color=fff'
  },
  { 
      id: 'admin-partner', 
      name: 'Bruno Sena', 
      email: 'bruno@upandco.com.br', 
      role: 'super_admin', 
      tenantId: 'up-admin',
      avatar: 'https://ui-avatars.com/api/?name=Bruno+Sena&background=0F172A&color=fff'
  }
];

// --- DADOS DE FALLBACK (Para quando o Firebase bloquear por regras expiradas) ---
const FALLBACK_LEADS: Lead[] = [
    {
        id: 'demo-1', tenantId: 'up-admin', name: 'Roberto Rocha (Demo)', email: 'roberto@demo.com', phone: '(11) 99999-0001',
        status: 'New', source: 'Instagram', createdAt: new Date().toISOString(), value: 5000,
        tags: [{ name: 'Quente', color: 'bg-red-100 text-red-700 border-red-200' }], nextFollowUp: new Date().toISOString()
    },
    {
        id: 'demo-2', tenantId: 'up-admin', name: 'Julia Silva (Demo)', email: 'julia@demo.com', phone: '(11) 99999-0002',
        status: 'Qualified', source: 'Indicação', createdAt: new Date(Date.now() - 86400000).toISOString(), value: 12000,
        tags: [], nextFollowUp: new Date(Date.now() + 86400000).toISOString()
    },
    {
        id: 'demo-3', tenantId: 'up-admin', name: 'Construtora Elite (Demo)', email: 'contato@elite.com', company: 'Elite Engenharia', phone: '(11) 99999-0003',
        status: 'Discussion', source: 'Google Ads', createdAt: new Date(Date.now() - 172800000).toISOString(), value: 45000,
        tags: [{ name: 'Prioridade Alta', color: 'bg-red-100 text-red-700 border-red-200' }]
    }
];

const FALLBACK_CLIENTS: Client[] = [
    {
        id: 'client-demo-1', tenantId: 'up-admin', name: 'Tech Solutions (Demo)', email: 'contato@tech.com', phone: '(11) 3333-4444',
        status: 'Active', contractModel: 'Recurring', healthScore: 95, contractValue: 2500, contractStartDate: '2025-01-01',
        contractDuration: 12, tasks: [], activities: []
    },
    {
        id: 'client-demo-2', tenantId: 'up-admin', name: 'Restaurante Sabor (Demo)', email: 'chef@sabor.com', phone: '(11) 3333-5555',
        status: 'Active', contractModel: 'OneOff', healthScore: 80, contractValue: 15000, contractStartDate: '2025-02-15',
        contractDuration: 1, tasks: [], activities: []
    }
];

class MockDB { 
  private currentTenantId: string = 'up-admin';
  private hasShownError: boolean = false;

  setTenant(tenantId: string) { 
    this.currentTenantId = tenantId; 
  }

  private handleFirebaseError(error: any) {
      if (!this.hasShownError && error?.code === 'permission-denied') {
          this.hasShownError = true;
          console.warn("🔒 ACESSO NEGADO PELO FIREBASE. Regras expiradas? Ativando modo DEMO.");
          alert(
              "⚠️ MODO DEMONSTRAÇÃO ATIVADO\n\n" +
              "O acesso ao banco de dados foi bloqueado (provavelmente as regras de data expiraram em 17/01/2026).\n\n" +
              "Estamos exibindo dados locais de exemplo para você não ficar travado."
          );
      } else {
          console.error("Erro Firebase:", error);
      }
  }

  // --- LEADS ---

  async getLeads(): Promise<Lead[]> { 
    try {
      await authPromise;
      
      const q = query(
        collection(dbFirestore, 'leads'),
        where("tenantId", "==", this.currentTenantId)
      );
      
      const querySnapshot = await getDocs(q);
      const leads: Lead[] = [];
      querySnapshot.forEach((doc) => {
        leads.push({ id: doc.id, ...doc.data() } as Lead);
      });
      
      return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      this.handleFirebaseError(error);
      return FALLBACK_LEADS; // Retorna dados mockados em caso de erro
    }
  }

  async getLeadById(id: string): Promise<Lead | undefined> { 
    const leads = await this.getLeads();
    return leads.find(l => l.id === id);
  }

  async addLead(leadData: Omit<Lead, 'id' | 'tenantId' | 'createdAt'>): Promise<Lead> {
    try {
        await authPromise;
        const newId = Math.random().toString(36).substr(2, 9);
        const newLead: Lead = {
        id: newId,
        tenantId: this.currentTenantId,
        createdAt: new Date().toISOString(),
        tags: leadData.tags || [],
        ...leadData
        };
        
        await setDoc(doc(dbFirestore, "leads", newId), newLead);
        return newLead;
    } catch (error) {
        this.handleFirebaseError(error);
        throw error;
    }
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    try {
        await authPromise;
        const leadRef = doc(dbFirestore, "leads", id);
        await updateDoc(leadRef, updates);
        const existing = await this.getLeadById(id);
        return { ...existing!, ...updates };
    } catch (error) {
        this.handleFirebaseError(error);
        // Simula update no modo demo para não quebrar a UI
        const existing = FALLBACK_LEADS.find(l => l.id === id);
        return { ...(existing || FALLBACK_LEADS[0]), ...updates };
    }
  }

  async deleteLead(id: string): Promise<void> {
    try {
        await authPromise;
        await deleteDoc(doc(dbFirestore, "leads", id));
    } catch (error) {
        this.handleFirebaseError(error);
        throw error;
    }
  }

  // --- CLIENTS ---

  async getClients(): Promise<Client[]> { 
    try {
      await authPromise;
      const q = query(
        collection(dbFirestore, 'clients'),
        where("tenantId", "==", this.currentTenantId)
      );
      const querySnapshot = await getDocs(q);
      const clients: Client[] = [];
      querySnapshot.forEach((doc) => {
        clients.push({ id: doc.id, ...doc.data() } as Client);
      });
      return clients;
    } catch (error) {
      this.handleFirebaseError(error);
      return FALLBACK_CLIENTS; // Retorna dados mockados
    }
  }

  async getClientById(id: string): Promise<Client | undefined> { 
    const clients = await this.getClients();
    return clients.find(c => c.id === id);
  }

  async addClient(clientData: any): Promise<Client> {
    try {
        await authPromise;
        const newId = Math.random().toString(36).substr(2, 9);
        const newClient: Client = {
        id: newId,
        tenantId: this.currentTenantId,
        healthScore: 100,
        tasks: clientData.tasks || [
            { id: Math.random().toString(36).substr(2, 9), title: 'Boas vindas e Contrato', completed: false, priority: 'High', subtasks: [] }
        ],
        activities: clientData.activities || [
            { 
            id: Math.random().toString(36).substr(2, 9), 
            type: 'contract_update', 
            content: 'Nova conta ativada!', 
            timestamp: new Date().toISOString(), 
            user: 'Sistema' 
            }
        ],
        ...clientData
        };
        
        await setDoc(doc(dbFirestore, "clients", newId), newClient);
        return newClient;
    } catch (error) {
        this.handleFirebaseError(error);
        throw error;
    }
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    try {
        await authPromise;
        const clientRef = doc(dbFirestore, "clients", id);
        await updateDoc(clientRef, updates);
        const existing = await this.getClientById(id);
        return { ...existing!, ...updates };
    } catch (error) {
        this.handleFirebaseError(error);
        throw error;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
        await authPromise;
        await deleteDoc(doc(dbFirestore, "clients", id));
    } catch (error) {
        this.handleFirebaseError(error);
        throw error;
    }
  }

  // --- NOTIFICATIONS & TAGS ---

  async getNotifications(): Promise<Notification[]> {
    const stored = localStorage.getItem('up_crm_notifications');
    return stored ? JSON.parse(stored) : [];
  }

  async markAllRead(): Promise<void> {
    localStorage.setItem('up_crm_notifications', '[]');
  }

  async getTags(): Promise<Tag[]> { 
    const defaultTags: Tag[] = [
        { name: 'Prioridade Alta', color: 'bg-red-100 text-red-700 border-red-200' },
        { name: 'VIP', color: 'bg-purple-100 text-purple-700 border-purple-200' },
        { name: 'Indicação', color: 'bg-blue-100 text-blue-700 border-blue-200' }
    ];
    try {
        await authPromise;
        const q = query(collection(dbFirestore, 'tags'));
        const snap = await getDocs(q);
        if (snap.empty) return defaultTags;
        const tags: Tag[] = [];
        snap.forEach(d => tags.push(d.data() as Tag));
        return tags;
    } catch {
        // Sem permissão, retorna tags padrão
        return defaultTags;
    }
  }

  async saveTag(tag: Tag, oldName?: string): Promise<Tag[]> {
    return [tag]; 
  }

  async deleteTag(name: string): Promise<Tag[]> {
    return [];
  }

  // --- STATS & HELPERS ---

  async getStats(): Promise<DashboardStats> {
    // Busca leads/clients (que podem vir do fallback se der erro)
    const leads = await this.getLeads();
    const clients = await this.getClients();
    const activeClients = clients.filter(c => c.status === 'Active');
    const monthlyRevenue = activeClients.reduce((acc, c) => acc + (c.contractValue || 0), 0);
    
    return {
      totalLeads: leads.length,
      monthlyLeads: leads.length, // Simplificado para demo
      conversionRate: leads.length > 0 ? Math.round((clients.length / leads.length) * 100) : 0,
      monthlyRevenue: monthlyRevenue, 
      averageTicket: activeClients.length > 0 ? monthlyRevenue / activeClients.length : 0
    };
  }

  async getUpcomingFollowUps(): Promise<Lead[]> {
      const leads = await this.getLeads();
      return leads
        .filter(l => l.nextFollowUp && new Date(l.nextFollowUp) >= new Date())
        .sort((a,b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());
  }
  
  async getAgendaItems(): Promise<Lead[]> {
      const leads = await this.getLeads();
      return leads
        .filter(l => l.nextFollowUp)
        .sort((a,b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());
  }

  // --- USERS & TENANTS ---
  
  async getAllUsers(): Promise<User[]> { return USERS; }
  async getAllTenants(): Promise<Tenant[]> { return TENANTS; }
  async updateUser(id: string, updates: Partial<User>): Promise<User> { return { ...USERS[0], ...updates }; }
  async getTenant(id: string): Promise<Tenant | undefined> { return TENANTS.find(t => t.id === id); }
  async getTenantAdmin(tenantId: string): Promise<User | undefined> { return USERS.find(u => u.tenantId === tenantId); }
  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> { return { ...TENANTS[0], ...updates }; }
  async createSystemClient(data: any): Promise<any> { return {}; }
  async deleteTenant(id: string): Promise<void> {}
}

export const db = new MockDB();
