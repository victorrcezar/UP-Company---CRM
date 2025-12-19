
export type LeadStatus = 'New' | 'Contacted' | 'Discussion' | 'Interested' | 'Qualified' | 'Closed' | 'Lost';
export type TaskPriority = 'Urgent' | 'High' | 'Normal' | 'Low';
export type ActivityType = 'field_update' | 'task_complete' | 'contract_update' | 'note_added' | 'status_change' | 'system_alert';

export interface Tag {
  name: string;
  color: string;
}

export interface Tenant {
  id: string;
  name: string;
  category: string;
  logoUrl?: string;
  themeColor?: string;
  googleScriptUrl?: string; // URL para envio de dados (POST)
  googleClientId?: string;  // ID para leitura de dados (OAuth)
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  tenantId: string;
  avatar?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority: TaskPriority;
  subtasks: Subtask[];
}

export interface ActivityLog {
  id: string;
  type: ActivityType;
  field?: string;
  oldValue?: string;
  newValue?: string;
  content: string;
  timestamp: string;
  user: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
  source: string;
  status: LeadStatus;
  lastContact?: string;
  nextFollowUp?: string;
  notes?: string; 
  value?: number;
  company?: string;
  tags: Tag[];
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive' | 'Churn';
  contractModel?: 'Recurring' | 'OneOff'; // Novo campo
  healthScore: number; 
  contractValue: number;
  contractStartDate: string;
  contractDuration: number; // Alterado de 3 | 6 | 12 para number
  convertedFromLeadId?: string;
  notes?: string;
  tasks: Task[];
  activities: ActivityLog[];
}

export interface Notification {
  id: string;
  tenantId: string;
  title: string;
  message: string;
  type: 'warning' | 'update' | 'success' | 'info' | 'agenda';
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface DashboardStats {
  totalLeads: number;
  monthlyLeads: number;
  conversionRate: number;
  monthlyRevenue: number;
  averageTicket: number;
}
