
import { Lead, Notification, Tag, Tenant, User, Client, DashboardStats, ActivityLog } from '../types';

// Dados estáticos iniciais
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

// Utilitários
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const STORAGE_KEYS = {
    LEADS: 'up_crm_leads',
    CLIENTS: 'up_crm_clients',
    NOTIFICATIONS: 'up_crm_notifications',
    TAGS: 'up_crm_tags',
    TENANTS: 'up_crm_tenants',
    USERS: 'up_crm_users'
};

class MockDB {
  private currentTenantId: string = 'up-admin';

  setTenant(tenantId: string) { 
    this.currentTenantId = tenantId; 
  }

  // Generic Get/Set for LocalStorage
  private get<T>(key: string, defaultData: T[] = []): T[] {
      try {
          const stored = localStorage.getItem(key);
          return stored ? JSON.parse(stored) : defaultData;
      } catch (e) {
          console.error(`Error reading ${key} from localStorage`, e);
          return defaultData;
      }
  }

  private set<T>(key: string, data: T[]) {
      try {
          localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
          console.error(`Error saving ${key} to localStorage`, e);
      }
  }

  // --- SYSTEM MANAGEMENT (SUPER ADMIN) ---

  async createSystemClient(userData: { name: string, email: string, companyName: string, category: string }): Promise<{ user: User, tenant: Tenant }> {
      await delay(600);
      
      // Gerar ID seguro
      const tenantId = userData.companyName
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');

      const newTenant: Tenant = {
          id: tenantId,
          name: userData.companyName,
          category: userData.category,
          logoUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.companyName)}&background=random&color=fff`
      };

      const newUser: User = {
          id: `user-${Date.now()}`,
          name: userData.name,
          email: userData.email,
          role: 'admin',
          tenantId: tenantId,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0F172A&color=fff`
      };

      const allTenants = this.get<Tenant>(STORAGE_KEYS.TENANTS, TENANTS);
      const allUsers = this.get<User>(STORAGE_KEYS.USERS, USERS);

      // Avoid duplicates
      if (!allTenants.find(t => t.id === newTenant.id)) {
          this.set(STORAGE_KEYS.TENANTS, [...allTenants, newTenant]);
      }
      if (!allUsers.find(u => u.email === newUser.email)) {
          this.set(STORAGE_KEYS.USERS, [...allUsers, newUser]);
      }

      return { user: newUser, tenant: newTenant };
  }

  async deleteTenant(tenantId: string): Promise<void> {
      if (tenantId === 'up-admin') throw new Error("Não é possível excluir o ambiente mestre.");
      await delay(500);

      const tenants = this.get<Tenant>(STORAGE_KEYS.TENANTS, TENANTS).filter(t => t.id !== tenantId);
      const users = this.get<User>(STORAGE_KEYS.USERS, USERS).filter(u => u.tenantId !== tenantId);
      // Also clean up data related to tenant
      const leads = this.get<Lead>(STORAGE_KEYS.LEADS).filter(l => l.tenantId !== tenantId);
      const clients = this.get<Client>(STORAGE_KEYS.CLIENTS).filter(c => c.tenantId !== tenantId);

      this.set(STORAGE_KEYS.TENANTS, tenants);
      this.set(STORAGE_KEYS.USERS, users);
      this.set(STORAGE_KEYS.LEADS, leads);
      this.set(STORAGE_KEYS.CLIENTS, clients);
  }

  async getAllUsers(): Promise<User[]> {
      await delay(200);
      return this.get<User>(STORAGE_KEYS.USERS, USERS);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
      await delay(300);
      const users = this.get<User>(STORAGE_KEYS.USERS, USERS);
      const index = users.findIndex(u => u.id === id);
      
      if (index !== -1) {
          users[index] = { ...users[index], ...updates };
          this.set(STORAGE_KEYS.USERS, users);
          return users[index];
      }
      
      // Fallback for session user not in list
      return { id, ...updates } as User; 
  }
  
  async getAllTenants(): Promise<Tenant[]> {
      await delay(200);
      return this.get<Tenant>(STORAGE_KEYS.TENANTS, TENANTS);
  }

  // --- TENANT METHODS ---

  async getTenant(id: string): Promise<Tenant | undefined> {
      await delay(100);
      const tenants = this.get<Tenant>(STORAGE_KEYS.TENANTS, TENANTS);
      return tenants.find(t => t.id === id);
  }

  async getTenantAdmin(tenantId: string): Promise<User | undefined> {
      await delay(100);
      const users = this.get<User>(STORAGE_KEYS.USERS, USERS);
      return users.find(u => u.tenantId === tenantId && (u.role === 'admin' || u.role === 'super_admin'));
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
      await delay(300);
      const tenants = this.get<Tenant>(STORAGE_KEYS.TENANTS, TENANTS);
      const index = tenants.findIndex(t => t.id === id);
      
      if (index !== -1) {
          tenants[index] = { ...tenants[index], ...updates };
          this.set(STORAGE_KEYS.TENANTS, tenants);
          return tenants[index];
      }
      throw new Error("Tenant not found");
  }

  // --- LEADS ---

  async getLeads(): Promise<Lead[]> { 
    await delay(300);
    const leads = this.get<Lead>(STORAGE_KEYS.LEADS);
    return leads
        .filter(l => l.tenantId === this.currentTenantId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getLeadById(id: string): Promise<Lead | undefined> { 
    await delay(100);
    const leads = this.get<Lead>(STORAGE_KEYS.LEADS);
    return leads.find(l => l.id === id);
  }

  async addLead(leadData: Omit<Lead, 'id' | 'tenantId' | 'createdAt'>): Promise<Lead> {
    await delay(400);
    const newLead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      tenantId: this.currentTenantId,
      createdAt: new Date().toISOString(),
      tags: leadData.tags || [],
      ...leadData
    };
    
    const leads = this.get<Lead>(STORAGE_KEYS.LEADS);
    this.set(STORAGE_KEYS.LEADS, [...leads, newLead]);
    return newLead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    await delay(300);
    const leads = this.get<Lead>(STORAGE_KEYS.LEADS);
    const index = leads.findIndex(l => l.id === id);
    
    if (index !== -1) {
        leads[index] = { ...leads[index], ...updates };
        this.set(STORAGE_KEYS.LEADS, leads);
        return leads[index];
    }
    throw new Error("Lead not found");
  }

  async deleteLead(id: string): Promise<void> {
    await delay(300);
    const leads = this.get<Lead>(STORAGE_KEYS.LEADS).filter(l => l.id !== id);
    this.set(STORAGE_KEYS.LEADS, leads);
  }

  // --- CLIENTS ---

  async getClients(): Promise<Client[]> { 
    await delay(300);
    return this.get<Client>(STORAGE_KEYS.CLIENTS).filter(c => c.tenantId === this.currentTenantId);
  }

  async getClientById(id: string): Promise<Client | undefined> { 
    await delay(100);
    return this.get<Client>(STORAGE_KEYS.CLIENTS).find(c => c.id === id);
  }

  async addClient(clientData: any): Promise<Client> {
    await delay(400);
    const newClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
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
    
    const clients = this.get<Client>(STORAGE_KEYS.CLIENTS);
    this.set(STORAGE_KEYS.CLIENTS, [...clients, newClient]);
    return newClient;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
      await delay(300);
      const clients = this.get<Client>(STORAGE_KEYS.CLIENTS);
      const index = clients.findIndex(c => c.id === id);
      
      if (index !== -1) {
          const currentClient = clients[index];
          let activities = currentClient.activities || [];
          
          // Auto-generate activity log for value changes
          if (updates.contractValue && updates.contractValue !== currentClient.contractValue) {
              activities = [{
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'field_update',
                  content: `Valor do contrato alterado para R$ ${updates.contractValue}`,
                  timestamp: new Date().toISOString(),
                  user: "Gestor Estratégico"
              }, ...activities];
          }

          const updatedClient = { 
              ...currentClient, 
              ...updates, 
              activities: updates.activities || activities 
          };
          
          clients[index] = updatedClient;
          this.set(STORAGE_KEYS.CLIENTS, clients);
          return updatedClient;
      }
      throw new Error("Cliente não encontrado");
  }

  async deleteClient(id: string): Promise<void> {
    await delay(300);
    const clients = this.get<Client>(STORAGE_KEYS.CLIENTS).filter(c => c.id !== id);
    this.set(STORAGE_KEYS.CLIENTS, clients);
  }

  // --- NOTIFICATIONS ---

  async getNotifications(): Promise<Notification[]> {
    await delay(200);
    return this.get<Notification>(STORAGE_KEYS.NOTIFICATIONS)
        .filter(n => n.tenantId === this.currentTenantId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async markAllRead(): Promise<void> {
    await delay(200);
    const notifications = this.get<Notification>(STORAGE_KEYS.NOTIFICATIONS).map(n => 
        n.tenantId === this.currentTenantId ? { ...n, read: true } : n
    );
    this.set(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  // --- STATS ---

  async getStats(): Promise<DashboardStats> {
    await delay(300);
    const leads = await this.getLeads();
    const clients = await this.getClients();
    const activeClients = clients.filter(c => c.status === 'Active');
    const monthlyRevenue = activeClients.reduce((acc, c) => acc + (c.contractValue || 0), 0);
    
    return {
      totalLeads: leads.length,
      monthlyLeads: leads.filter(l => new Date(l.createdAt).getMonth() === new Date().getMonth()).length,
      conversionRate: leads.length > 0 ? Math.round((clients.length / leads.length) * 100) : 0,
      monthlyRevenue: monthlyRevenue, 
      averageTicket: activeClients.length > 0 ? monthlyRevenue / activeClients.length : 0
    };
  }

  // --- TAGS ---

  async getTags(): Promise<Tag[]> { 
    await delay(100);
    const defaultTags: Tag[] = [
        { name: 'Prioridade Alta', color: 'bg-red-100 text-red-700 border-red-200' },
        { name: 'VIP', color: 'bg-purple-100 text-purple-700 border-purple-200' }
    ];
    return this.get<Tag>(STORAGE_KEYS.TAGS, defaultTags);
  }

  async saveTag(tag: Tag, oldName?: string): Promise<Tag[]> {
    await delay(300);
    let tags = this.get<Tag>(STORAGE_KEYS.TAGS);
    
    if (oldName) {
        tags = tags.map(t => t.name === oldName ? tag : t);
    } else {
        if (!tags.find(t => t.name === tag.name)) {
            tags.push(tag);
        }
    }
    
    this.set(STORAGE_KEYS.TAGS, tags);
    return tags;
  }

  async deleteTag(name: string): Promise<Tag[]> {
    await delay(300);
    const tags = this.get<Tag>(STORAGE_KEYS.TAGS).filter(t => t.name !== name);
    this.set(STORAGE_KEYS.TAGS, tags);
    return tags;
  }

  // --- HELPERS ---

  async getUpcomingFollowUps(): Promise<Lead[]> {
      const leads = await this.getLeads();
      return leads.filter(l => l.nextFollowUp && new Date(l.nextFollowUp) >= new Date()).sort((a,b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());
  }
  
  async getAgendaItems(): Promise<Lead[]> {
      const leads = await this.getLeads();
      return leads.filter(l => l.nextFollowUp).sort((a,b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());
  }
}

export const db = new MockDB();
