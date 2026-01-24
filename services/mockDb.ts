
import { Lead, Notification, Tag, Tenant, User, Client, DashboardStats, ActivityLog, CustomEvent } from '../types';
import { dbFirestore, authPromise } from './firebase';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, orderBy 
} from 'firebase/firestore';

// --- DADOS INICIAIS (FALLBACK) ---
export const INITIAL_TENANTS: Tenant[] = [
  { 
      id: 'up-admin', 
      name: 'UP! Sistema Central', 
      category: 'Tecnologia', 
      logoUrl: 'https://static.wixstatic.com/media/1f17f3_1e2b54d2fd894dd997c6cbc18e940576~mv2.png' 
  }
];

export const INITIAL_USERS: User[] = [
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

// Exportações legadas para compatibilidade (mas o código usará métodos assíncronos)
export const TENANTS = INITIAL_TENANTS;
export const USERS = INITIAL_USERS;

// --- DADOS DE FALLBACK (Mutável para permitir funcionamento offline/demo) ---
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

const FALLBACK_EVENTS: CustomEvent[] = []; // Armazenamento local para eventos manuais

class MockDB { 
  currentTenantId: string;
  hasShownError: boolean;

  constructor() {
    this.currentTenantId = 'up-admin';
    this.hasShownError = false;
  }

  setTenant(tenantId: string) { 
    this.currentTenantId = tenantId; 
  }

  handleFirebaseError(error: any) {
      if (!this.hasShownError && error?.code === 'permission-denied') {
          this.hasShownError = true;
          console.warn("🔒 ACESSO NEGADO PELO FIREBASE. Regras expiradas? Ativando modo DEMO.");
      } else {
          console.error("Erro Firebase:", error);
      }
  }

  // --- PERSISTÊNCIA LOCAL HELPER ---
  private saveLocally(key: string, data: any[]) {
      try {
          localStorage.setItem(key, JSON.stringify(data));
      } catch (e) { console.error("Erro ao salvar localmente", e); }
  }

  // --- TENANTS & USERS (AGORA COM PERSISTÊNCIA) ---

  async getAllTenants(): Promise<Tenant[]> {
      try {
          await authPromise;
          const q = query(collection(dbFirestore, 'tenants'));
          const snap = await getDocs(q);
          if (!snap.empty) {
              const tenants: Tenant[] = [];
              snap.forEach(doc => tenants.push(doc.data() as Tenant));
              
              if (!tenants.find(t => t.id === 'up-admin')) {
                  tenants.unshift(INITIAL_TENANTS[0]);
              }
              return tenants;
          }
      } catch (e) {
          // Falha silenciosa
      }

      const stored = localStorage.getItem('up_crm_tenants');
      if (stored) return JSON.parse(stored);
      
      return INITIAL_TENANTS;
  }

  async getAllUsers(): Promise<User[]> {
      try {
          await authPromise;
          const q = query(collection(dbFirestore, 'users'));
          const snap = await getDocs(q);
          if (!snap.empty) {
              const users: User[] = [];
              snap.forEach(doc => users.push(doc.data() as User));
              
              INITIAL_USERS.forEach(admin => {
                  if (!users.find(u => u.id === admin.id)) users.push(admin);
              });
              return users;
          }
      } catch (e) {
          // Falha silenciosa
      }

      const stored = localStorage.getItem('up_crm_users');
      if (stored) return JSON.parse(stored);

      return INITIAL_USERS;
  }

  async createSystemClient(data: any): Promise<any> { 
      const newTenantId = Math.random().toString(36).substr(2, 9);
      const newTenant: Tenant = {
          id: newTenantId,
          name: data.companyName,
          category: data.category
      };
      
      const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name: data.name,
          email: data.email,
          role: 'admin',
          tenantId: newTenantId
      };

      try {
          await authPromise;
          await setDoc(doc(dbFirestore, "tenants", newTenantId), newTenant);
          await setDoc(doc(dbFirestore, "users", newUser.id), newUser);
      } catch (error) {
          this.handleFirebaseError(error);
          
          const currentTenants = await this.getAllTenants();
          const currentUsers = await this.getAllUsers();
          
          currentTenants.push(newTenant);
          currentUsers.push(newUser);
          
          this.saveLocally('up_crm_tenants', currentTenants);
          this.saveLocally('up_crm_users', currentUsers);
      }

      return { tenant: newTenant, user: newUser }; 
  }

  async updateSystemClient(tenantId: string, data: { name: string, category: string, adminName?: string, adminEmail?: string }): Promise<void> {
      try {
          await authPromise;
          await updateDoc(doc(dbFirestore, "tenants", tenantId), { name: data.name, category: data.category });
          
          const admin = await this.getTenantAdmin(tenantId);
          if (admin && (data.adminName || data.adminEmail)) {
              await updateDoc(doc(dbFirestore, "users", admin.id), { 
                  name: data.adminName || admin.name, 
                  email: data.adminEmail || admin.email 
              });
          }
      } catch (error) {
          this.handleFirebaseError(error);
          
          const tenants = await this.getAllTenants();
          const users = await this.getAllUsers();
          
          const tIndex = tenants.findIndex(t => t.id === tenantId);
          if (tIndex > -1) {
              tenants[tIndex] = { ...tenants[tIndex], name: data.name, category: data.category };
              this.saveLocally('up_crm_tenants', tenants);
          }

          if (data.adminName || data.adminEmail) {
              const uIndex = users.findIndex(u => u.tenantId === tenantId && u.role === 'admin');
              if (uIndex > -1) {
                  users[uIndex] = { ...users[uIndex], name: data.adminName || users[uIndex].name, email: data.adminEmail || users[uIndex].email };
                  this.saveLocally('up_crm_users', users);
              }
          }
      }
  }

  async deleteTenant(id: string): Promise<void> {
      try {
          await authPromise;
          await deleteDoc(doc(dbFirestore, "tenants", id));
          
          const users = await this.getAllUsers();
          const tenantUsers = users.filter(u => u.tenantId === id);
          for (const u of tenantUsers) {
              await deleteDoc(doc(dbFirestore, "users", u.id));
          }
      } catch (error) {
          this.handleFirebaseError(error);
          
          const tenants = await this.getAllTenants();
          const users = await this.getAllUsers();
          
          const newTenants = tenants.filter(t => t.id !== id);
          const newUsers = users.filter(u => u.tenantId !== id);
          
          this.saveLocally('up_crm_tenants', newTenants);
          this.saveLocally('up_crm_users', newUsers);
      }
  }

  async getTenant(id: string): Promise<Tenant | undefined> { 
      const tenants = await this.getAllTenants();
      return tenants.find(t => t.id === id); 
  }
  
  async getTenantAdmin(tenantId: string): Promise<User | undefined> { 
      const users = await this.getAllUsers();
      return users.find(u => u.tenantId === tenantId); 
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> { 
      try {
          await authPromise;
          await updateDoc(doc(dbFirestore, "users", id), updates);
          const users = await this.getAllUsers();
          return users.find(u => u.id === id)!;
      } catch (error) {
          const users = await this.getAllUsers();
          const idx = users.findIndex(u => u.id === id);
          if (idx > -1) {
              users[idx] = { ...users[idx], ...updates };
              this.saveLocally('up_crm_users', users);
              return users[idx];
          }
          throw error;
      }
  }
  
  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> { 
      try {
          await authPromise;
          await updateDoc(doc(dbFirestore, "tenants", id), updates);
          const tenants = await this.getAllTenants();
          return tenants.find(t => t.id === id)!;
      } catch (error) {
          const tenants = await this.getAllTenants();
          const idx = tenants.findIndex(t => t.id === id);
          if (idx > -1) {
              tenants[idx] = { ...tenants[idx], ...updates };
              this.saveLocally('up_crm_tenants', tenants);
              return tenants[idx];
          }
          throw error;
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
      return FALLBACK_LEADS;
    }
  }

  async getLeadById(id: string): Promise<Lead | undefined> { 
    const leads = await this.getLeads();
    return leads.find(l => l.id === id);
  }

  async addLead(leadData: Omit<Lead, 'id' | 'tenantId' | 'createdAt'>): Promise<Lead> {
    const newId = Math.random().toString(36).substr(2, 9);
    const newLead: Lead = {
        id: newId,
        tenantId: this.currentTenantId,
        createdAt: new Date().toISOString(),
        tags: leadData.tags || [],
        ...leadData
    };

    try {
        await authPromise;
        await setDoc(doc(dbFirestore, "leads", newId), newLead);
        return newLead;
    } catch (error) {
        this.handleFirebaseError(error);
        FALLBACK_LEADS.push(newLead); 
        return newLead;
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
        const index = FALLBACK_LEADS.findIndex(l => l.id === id);
        if (index > -1) {
            FALLBACK_LEADS[index] = { ...FALLBACK_LEADS[index], ...updates };
            return FALLBACK_LEADS[index];
        }
        return { ...(FALLBACK_LEADS[0]), ...updates };
    }
  }

  async deleteLead(id: string): Promise<void> {
    try {
        await authPromise;
        await deleteDoc(doc(dbFirestore, "leads", id));
    } catch (error) {
        this.handleFirebaseError(error);
        const index = FALLBACK_LEADS.findIndex(l => l.id === id);
        if (index > -1) FALLBACK_LEADS.splice(index, 1);
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
      return FALLBACK_CLIENTS;
    }
  }

  async getClientById(id: string): Promise<Client | undefined> { 
    const clients = await this.getClients();
    return clients.find(c => c.id === id);
  }

  async addClient(clientData: any): Promise<Client> {
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

    try {
        await authPromise;
        await setDoc(doc(dbFirestore, "clients", newId), newClient);
        return newClient;
    } catch (error) {
        this.handleFirebaseError(error);
        FALLBACK_CLIENTS.push(newClient);
        return newClient;
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
        const index = FALLBACK_CLIENTS.findIndex(c => c.id === id);
        if (index > -1) {
            FALLBACK_CLIENTS[index] = { ...FALLBACK_CLIENTS[index], ...updates };
            return FALLBACK_CLIENTS[index];
        }
        throw error;
    }
  }

  async deleteClient(id: string): Promise<void> {
    try {
        await authPromise;
        await deleteDoc(doc(dbFirestore, "clients", id));
    } catch (error) {
        this.handleFirebaseError(error);
        const index = FALLBACK_CLIENTS.findIndex(c => c.id === id);
        if (index > -1) {
            FALLBACK_CLIENTS.splice(index, 1);
        }
    }
  }

  // --- CUSTOM EVENTS (AGENDA AVULSA) ---

  async getCustomEvents(): Promise<CustomEvent[]> {
      try {
          await authPromise;
          const q = query(
              collection(dbFirestore, 'events'),
              where("tenantId", "==", this.currentTenantId)
          );
          const querySnapshot = await getDocs(q);
          const events: CustomEvent[] = [];
          querySnapshot.forEach((doc) => {
              events.push({ id: doc.id, ...doc.data() } as CustomEvent);
          });
          return events;
      } catch (error) {
          this.handleFirebaseError(error);
          return FALLBACK_EVENTS.filter(e => e.tenantId === this.currentTenantId);
      }
  }

  async addCustomEvent(eventData: Omit<CustomEvent, 'id' | 'tenantId'>): Promise<CustomEvent> {
      const newId = Math.random().toString(36).substr(2, 9);
      const newEvent: CustomEvent = {
          id: newId,
          tenantId: this.currentTenantId,
          ...eventData
      };

      try {
          await authPromise;
          await setDoc(doc(dbFirestore, "events", newId), newEvent);
          return newEvent;
      } catch (error) {
          this.handleFirebaseError(error);
          FALLBACK_EVENTS.push(newEvent);
          return newEvent;
      }
  }

  async deleteCustomEvent(id: string): Promise<void> {
      try {
          await authPromise;
          await deleteDoc(doc(dbFirestore, "events", id));
      } catch (error) {
          this.handleFirebaseError(error);
          const index = FALLBACK_EVENTS.findIndex(e => e.id === id);
          if (index > -1) FALLBACK_EVENTS.splice(index, 1);
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
    const leads = await this.getLeads();
    const clients = await this.getClients();
    
    const activeLeadsCount = leads.filter(l => !['Closed', 'Lost'].includes(l.status)).length;
    const closedDealsCount = leads.filter(l => l.status === 'Closed').length;

    const activeClients = clients.filter(c => c.status === 'Active');
    const monthlyRevenue = activeClients.reduce((acc, c) => acc + (c.contractValue || 0), 0);
    
    return {
      totalLeads: leads.length,
      activeLeads: activeLeadsCount,
      closedDeals: closedDealsCount,
      monthlyLeads: leads.length,
      conversionRate: leads.length > 0 ? Math.round((closedDealsCount / leads.length) * 100) : 0,
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
}

export const db = new MockDB();
