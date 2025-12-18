
import { 
    collection, 
    getDocs, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    setDoc,
    writeBatch
} from '@firebase/firestore';
import { dbFirestore } from './firebase';
import { Lead, Notification, Tag, Tenant, User, Client, ActivityLog, DashboardStats } from '../types';

// Dados iniciais LIMPOS - Apenas Admin Master
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

const cleanData = (obj: any) => {
    const newObj = { ...obj };
    Object.keys(newObj).forEach(key => {
        if (newObj[key] === undefined) {
            delete newObj[key];
        }
    });
    return newObj;
};

class MockDB {
  private currentTenantId: string = 'up-admin';

  setTenant(tenantId: string) { 
    this.currentTenantId = tenantId; 
  }

  // --- SYSTEM MANAGEMENT (SUPER ADMIN) ---

  async createSystemClient(userData: { name: string, email: string, companyName: string, category: string }): Promise<{ user: User, tenant: Tenant }> {
      // 1. Gerar Tenant ID (Slugify)
      const tenantId = userData.companyName
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
          .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
          .replace(/\s+/g, '-'); // Troca espaços por hífens

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
          role: 'admin', // O primeiro usuário é Admin do Tenant, mas NÃO super_admin
          tenantId: tenantId, // VINCULO CRUCIAL
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0F172A&color=fff`
      };

      // 2. Salvar no Firestore
      try {
          await setDoc(doc(dbFirestore, 'tenants', tenantId), newTenant);
          await setDoc(doc(dbFirestore, 'users', newUser.id), newUser);
          
          // 3. Atualizar Arrays Locais
          const exists = TENANTS.find(t => t.id === newTenant.id);
          if (!exists) TENANTS.push(newTenant);
          
          const userExists = USERS.find(u => u.email === newUser.email);
          if (!userExists) USERS.push(newUser);

          return { user: newUser, tenant: newTenant };
      } catch (error) {
          console.error("Erro ao criar cliente sistema:", error);
          throw error;
      }
  }

  async deleteTenant(tenantId: string): Promise<void> {
      if (tenantId === 'up-admin') throw new Error("Não é possível excluir o ambiente mestre.");

      try {
          // Deletar do Firestore
          await deleteDoc(doc(dbFirestore, 'tenants', tenantId));
          
          // Buscar e deletar usuários associados (opcional, mas recomendado para limpeza)
          const q = query(collection(dbFirestore, 'users'), where('tenantId', '==', tenantId));
          const snapshot = await getDocs(q);
          const batch = writeBatch(dbFirestore);
          snapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
          });
          await batch.commit();

          // Atualizar Arrays Locais
          const tIndex = TENANTS.findIndex(t => t.id === tenantId);
          if (tIndex > -1) TENANTS.splice(tIndex, 1);

          // Remover usuários locais
          for (let i = USERS.length - 1; i >= 0; i--) {
              if (USERS[i].tenantId === tenantId) {
                  USERS.splice(i, 1);
              }
          }

      } catch (error) {
          console.error("Erro ao excluir tenant:", error);
          // Fallback local se firestore falhar
          const tIndex = TENANTS.findIndex(t => t.id === tenantId);
          if (tIndex > -1) TENANTS.splice(tIndex, 1);
      }
  }

  async getAllUsers(): Promise<User[]> {
      // Combina usuários estáticos com os do Firestore (simulação robusta)
      const q = query(collection(dbFirestore, 'users'));
      const snapshot = await getDocs(q);
      const dbUsers = snapshot.docs.map(d => d.data() as User);
      
      // Merge unique users by ID
      const allUsers = [...USERS, ...dbUsers];
      return Array.from(new Map(allUsers.map(item => [item.id, item])).values());
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
      // Atualiza no Firestore se existir lá, senão atualiza apenas localmente (para mock users)
      try {
          // Tenta atualizar no Firestore
          const docRef = doc(dbFirestore, 'users', id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
              await updateDoc(docRef, cleanData(updates));
          }
      } catch (e) {
          console.warn("Usuário não está no Firestore, atualizando apenas localmente.");
      }

      // Atualiza array local
      const localIndex = USERS.findIndex(u => u.id === id);
      if (localIndex >= 0) {
          USERS[localIndex] = { ...USERS[localIndex], ...updates };
          return USERS[localIndex];
      }
      
      // Se não achou no local, retorna o objeto mesclado assumindo sucesso do firestore ou retorno mockado
      return { id, ...updates } as User; 
  }
  
  async getAllTenants(): Promise<Tenant[]> {
      try {
          // Busca todos os tenants do Firestore
          const q = query(collection(dbFirestore, 'tenants'));
          const snapshot = await getDocs(q);
          const dbTenants = snapshot.docs.map(d => d.data() as Tenant);
          
          // Combina com os tenants estáticos, evitando duplicatas por ID
          const dbIds = new Set(dbTenants.map(t => t.id));
          const uniqueStatic = TENANTS.filter(t => !dbIds.has(t.id));
          
          return [...uniqueStatic, ...dbTenants];
      } catch (error) {
          console.error("Erro ao buscar tenants:", error);
          return TENANTS; // Fallback para estático em caso de erro
      }
  }

  // --- TENANT METHODS ---

  async getTenant(id: string): Promise<Tenant | undefined> {
      const docRef = doc(dbFirestore, 'tenants', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) return docSnap.data() as Tenant;
      return TENANTS.find(t => t.id === id);
  }

  async getTenantAdmin(tenantId: string): Promise<User | undefined> {
      const users = await this.getAllUsers();
      // Retorna o primeiro admin encontrado para este tenant
      return users.find(u => u.tenantId === tenantId && (u.role === 'admin' || u.role === 'super_admin'));
  }

  async updateTenant(id: string, updates: Partial<Tenant>): Promise<Tenant> {
      const docRef = doc(dbFirestore, 'tenants', id);
      const cleaned = cleanData(updates);
      await setDoc(docRef, cleaned, { merge: true });
      
      // Atualiza array local também
      const localIndex = TENANTS.findIndex(t => t.id === id);
      if (localIndex >= 0) {
          TENANTS[localIndex] = { ...TENANTS[localIndex], ...updates };
      }

      const updated = await this.getTenant(id);
      return updated!;
  }

  async getLeads(): Promise<Lead[]> { 
    const q = query(
        collection(dbFirestore, 'leads'), 
        where('tenantId', '==', this.currentTenantId)
    );
    const querySnapshot = await getDocs(q);
    const leads = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
    return leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getLeadById(id: string): Promise<Lead | undefined> { 
    const docRef = doc(dbFirestore, 'leads', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Lead;
    return undefined;
  }

  async addLead(leadData: Omit<Lead, 'id' | 'tenantId' | 'createdAt'>): Promise<Lead> {
    const newLead = {
      ...leadData,
      tenantId: this.currentTenantId,
      createdAt: new Date().toISOString(),
      tags: leadData.tags || []
    };
    const cleaned = cleanData(newLead);
    const docRef = await addDoc(collection(dbFirestore, 'leads'), cleaned);
    return { id: docRef.id, ...cleaned } as Lead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const docRef = doc(dbFirestore, 'leads', id);
    const cleaned = cleanData(updates);
    await updateDoc(docRef, cleaned);
    const updated = await this.getLeadById(id);
    return updated!;
  }

  async deleteLead(id: string): Promise<void> {
    console.log(`[Firestore] Deletando Lead ID: ${id}`);
    const leadRef = doc(dbFirestore, 'leads', id);
    await deleteDoc(leadRef);
  }

  async getClients(): Promise<Client[]> { 
    const q = query(
        collection(dbFirestore, 'clients'), 
        where('tenantId', '==', this.currentTenantId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
  }

  async getClientById(id: string): Promise<Client | undefined> { 
    const docRef = doc(dbFirestore, 'clients', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() } as Client;
    return undefined;
  }

  async addClient(clientData: any): Promise<Client> {
    const newClient = {
      ...clientData,
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
      ]
    };
    const cleaned = cleanData(newClient);
    const docRef = await addDoc(collection(dbFirestore, 'clients'), cleaned);
    return { id: docRef.id, ...cleaned } as Client;
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
      const docRef = doc(dbFirestore, 'clients', id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Cliente não encontrado");
      
      const clientToUpdate = docSnap.data() as Client;
      const user = "Gestor Estratégico";
      const newActivities: ActivityLog[] = [];
      
      if (updates.contractValue && updates.contractValue !== clientToUpdate.contractValue) {
          newActivities.push({
              id: Math.random().toString(36).substr(2, 9),
              type: 'field_update',
              content: `Valor do contrato alterado para R$ ${updates.contractValue}`,
              timestamp: new Date().toISOString(),
              user: user
          });
      }

      const updatedData = { 
          ...updates, 
          activities: [...newActivities, ...(clientToUpdate.activities || [])]
      };

      const cleaned = cleanData(updatedData);
      await updateDoc(docRef, cleaned);
      const result = await this.getClientById(id);
      return result!;
  }

  async deleteClient(id: string): Promise<void> {
    console.log(`[Firestore] Deletando Cliente ID: ${id}`);
    const clientRef = doc(dbFirestore, 'clients', id);
    await deleteDoc(clientRef);
  }

  async getNotifications(): Promise<Notification[]> {
    const q = query(
      collection(dbFirestore, 'notifications'),
      where('tenantId', '==', this.currentTenantId)
    );
    const querySnapshot = await getDocs(q);
    let notifications = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    return notifications;
  }

  async markAllRead(): Promise<void> {
    const q = query(
      collection(dbFirestore, 'notifications'),
      where('tenantId', '==', this.currentTenantId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(dbFirestore);
    querySnapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  }

  async getStats(): Promise<DashboardStats> {
    const leads = await this.getLeads();
    const clients = await this.getClients();
    const activeClients = clients.filter(c => c.status === 'Active');
    const monthlyRevenue = activeClients.reduce((acc, c) => acc + c.contractValue, 0);
    return {
      totalLeads: leads.length,
      monthlyLeads: leads.filter(l => new Date(l.createdAt).getMonth() === new Date().getMonth()).length,
      conversionRate: leads.length > 0 ? Math.round((clients.length / leads.length) * 100) : 0,
      monthlyRevenue: monthlyRevenue, 
      averageTicket: activeClients.length > 0 ? monthlyRevenue / activeClients.length : 0
    };
  }

  async getTags(): Promise<Tag[]> { 
    const q = query(collection(dbFirestore, 'tags'));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return [
            { name: 'Prioridade Alta', color: 'bg-red-100 text-red-700 border-red-200' },
            { name: 'VIP', color: 'bg-purple-100 text-purple-700 border-purple-200' }
        ];
    }
    return querySnapshot.docs.map(doc => doc.data() as Tag);
  }

  async saveTag(tag: Tag, oldName?: string): Promise<Tag[]> {
    const tagId = tag.name.toLowerCase().replace(/\s+/g, '-');
    await setDoc(doc(dbFirestore, 'tags', tagId), tag);
    return this.getTags();
  }

  async deleteTag(name: string): Promise<Tag[]> {
    const tagId = name.toLowerCase().replace(/\s+/g, '-');
    await deleteDoc(doc(dbFirestore, 'tags', tagId));
    return this.getTags();
  }

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
