
import React, { useState, useEffect } from 'react';
import { Client, Task, TaskPriority, Subtask } from '../../types';
import { 
    X, Check, PencilLine, Mail, Phone,
    Layout, ListTodo, CreditCard, History,
    Activity, TrendingUp, Zap, MessageSquare, ArrowRight,
    CheckCircle2, Circle, Plus, Trash2, XCircle,
    ChevronDown, AlertTriangle, ToggleLeft, User, Building, DollarSign, Clock, Briefcase, Repeat, CalendarCheck
} from 'lucide-react';
import { db } from '../../services/mockDb';

interface ClientDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string | null;
    onUpdate: () => void;
}

type TabType = 'overview' | 'workarea' | 'billing' | 'audit';

const WhatsAppLogo = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const formatPhone = (value: string) => {
    if (!value) return "";
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    if (phoneNumberLength < 11) {
        return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
};

const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({ isOpen, onClose, clientId, onUpdate }) => {
    const [client, setClient] = useState<Client | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<Client>>({});
    
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Normal');
    const [subtaskInputs, setSubtaskInputs] = useState<{[taskId: string]: string}>({});

    useEffect(() => {
        if (isOpen && clientId) {
            fetchClient(clientId);
        } else {
            setClient(null);
            setIsEditing(false);
            setActiveTab('overview');
        }
    }, [isOpen, clientId]);

    const fetchClient = async (id: string) => {
        const data = await db.getClientById(id);
        if (data) {
            setClient(data);
            setFormData(data);
        }
    };

    const handleStartEdit = () => {
        if (client) {
            setFormData({ ...client });
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        if (!client) return;
        const updated = await db.updateClient(client.id, formData);
        setClient(updated);
        setIsEditing(false);
        onUpdate();
    };

    const handleToggleTask = async (taskId: string) => {
        if (!client) return;
        const newTasks = client.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        const updated = await db.updateClient(client.id, { tasks: newTasks });
        setClient(updated);
    };

    const handleAddTask = async () => {
        if (!client || !newTaskTitle.trim()) return;
        const newTask: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: newTaskTitle,
            completed: false,
            priority: newTaskPriority,
            subtasks: []
        };
        const updated = await db.updateClient(client.id, { tasks: [...client.tasks, newTask] });
        setClient(updated);
        setNewTaskTitle('');
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!client || !confirm('Deseja excluir esta tarefa?')) return;
        const newTasks = client.tasks.filter(t => t.id !== taskId);
        const updated = await db.updateClient(client.id, { tasks: newTasks });
        setClient(updated);
    };

    const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
        if (!client) return;
        const newTasks = client.tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
                };
            }
            return t;
        });
        const updated = await db.updateClient(client.id, { tasks: newTasks });
        setClient(updated);
    };

    const handleAddSubtask = async (taskId: string) => {
        const title = subtaskInputs[taskId];
        if (!client || !title?.trim()) return;
        const newSubtask: Subtask = { id: Math.random().toString(36).substr(2, 9), title: title.trim(), completed: false };
        const newTasks = client.tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, subtasks: [...(t.subtasks || []), newSubtask] };
            }
            return t;
        });
        const updated = await db.updateClient(client.id, { tasks: newTasks });
        setClient(updated);
        setSubtaskInputs(prev => ({ ...prev, [taskId]: '' }));
    };

    const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
        if (!client) return;
        const newTasks = client.tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) };
            }
            return t;
        });
        const updated = await db.updateClient(client.id, { tasks: newTasks });
        setClient(updated);
    };

    const getPriorityStyles = (priority: TaskPriority) => {
        switch (priority) {
            case 'Urgent': return { badge: 'bg-red-500/10 text-red-500 border-red-500/20', border: 'border-l-red-500' };
            case 'High': return { badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20', border: 'border-l-orange-500' };
            case 'Normal': return { badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20', border: 'border-l-blue-500' };
            case 'Low': return { badge: 'bg-slate-500/10 text-slate-500 border-slate-500/20', border: 'border-l-slate-400' };
            default: return { badge: '', border: '' };
        }
    };

    const getStatusText = (status: string) => {
        switch(status) {
            case 'Active': return 'Ativo';
            case 'Inactive': return 'Inativo';
            case 'Churn': return 'Cancelado';
            default: return status;
        }
    };

    if (!isOpen || !client) return null;

    const PropertiesForm = () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Status da Operação</label>
                {isEditing ? (
                    <div className="relative group">
                        <select 
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                            className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none dark:text-white appearance-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                        >
                            <option value="Active">Ativo / Operando</option>
                            <option value="Inactive">Inativo / Pausado</option>
                            <option value="Churn">Cancelado / Churn</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                ) : (
                    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${client.status === 'Active' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <div className={`w-2 h-2 rounded-full ${client.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`}></div>
                        <p className={`text-xs font-bold ${client.status === 'Active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>{getStatusText(client.status)}</p>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1"><User size={10} /> Nome do Cliente</label>
                {isEditing ? (
                    <input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                ) : (
                    <div className="p-4 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{client.name}</p>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1"><Building size={10} /> Empresa</label>
                {isEditing ? (
                    <input 
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                ) : (
                    <div className="p-4 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">{client.companyName || 'Pessoa Física'}</p>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1"><Phone size={10} /> Telefone</label>
                {isEditing ? (
                    <input 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                        className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                ) : (
                    <div className="p-4 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl flex justify-between items-center">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{client.phone}</p>
                        <a href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-500 hover:scale-110 transition-transform"><WhatsAppLogo /></a>
                    </div>
                )}
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1"><DollarSign size={10} /> {formData.contractModel === 'Recurring' || (!isEditing && client.contractModel === 'Recurring') ? 'Faturamento (MRR)' : 'Valor Único'}</label>
                    {isEditing ? (
                        <input 
                            type="number"
                            value={formData.contractValue}
                            onChange={(e) => setFormData({...formData, contractValue: Number(e.target.value)})}
                            className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                    ) : (
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">R$ {client.contractValue.toLocaleString()}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1"><Clock size={10} /> Fidelidade / Modelo</label>
                    {isEditing ? (
                        <div className="relative">
                            <select 
                                value={formData.contractModel === 'OneOff' ? 'oneoff' : formData.contractDuration}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === 'oneoff') {
                                        setFormData({...formData, contractModel: 'OneOff', contractDuration: 1 });
                                    } else {
                                        setFormData({...formData, contractModel: 'Recurring', contractDuration: Number(val) });
                                    }
                                }}
                                className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold outline-none dark:text-white appearance-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                            >
                                <option value="oneoff">Pagamento Único</option>
                                <option value="3">3 Meses</option>
                                <option value="6">6 Meses</option>
                                <option value="12">12 Meses</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="p-4 bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                            <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {client.contractModel === 'OneOff' ? (
                                    <><Briefcase size={14} className="text-purple-500" /> Pagamento Único</>
                                ) : (
                                    <><Repeat size={14} className="text-blue-500" /> {client.contractDuration || 0} Meses</>
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const isOneOff = client.contractModel === 'OneOff';

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-0 md:p-6 animate-fade-in">
            {/* Modal Container: Full Screen on Mobile, Rounded on Desktop */}
            <div className="bg-[#F8FAFC] dark:bg-[#020617] w-full h-full md:max-w-[1400px] md:h-[95vh] md:rounded-[2.5rem] shadow-2xl flex flex-col animate-scale-up overflow-hidden border-0 md:border md:border-white/10 relative">
                
                {/* Close Button - Floating */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all z-50 backdrop-blur-md border border-white/10"
                >
                    <X size={20} />
                </button>

                {/* Header Section - Modern Gradient & Glass */}
                <div className="bg-[#0A1F2E] text-white pt-12 pb-4 px-6 md:px-12 md:py-10 relative shrink-0 overflow-hidden">
                    {/* Abstract Background Elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/3 -translate-x-1/4"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-6 md:gap-0">
                        {/* Avatar & Title */}
                        <div className="flex items-center gap-5 md:gap-8 w-full pr-12 md:pr-0">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl md:text-4xl font-black shadow-2xl shadow-blue-500/20 ring-4 ring-white/5 shrink-0">
                                {client.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl md:text-4xl font-black tracking-tight leading-tight break-words mb-2 line-clamp-2">
                                    {client.name}
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${client.status === 'Active' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-500/10 border-slate-500/30 text-slate-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                                        {getStatusText(client.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                            {isEditing ? (
                                <>
                                    <button 
                                        onClick={() => setIsEditing(false)} 
                                        className="flex-1 md:flex-none px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold border border-white/10 transition-all uppercase tracking-widest backdrop-blur-sm"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleSave} 
                                        className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                    >
                                        <Check size={16} /> Salvar
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={handleStartEdit} 
                                    className="flex-1 md:flex-none px-6 py-2.5 bg-white/5 hover:bg-white/10 text-blue-200 border border-white/10 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all uppercase tracking-widest backdrop-blur-sm group"
                                >
                                    <PencilLine size={16} className="group-hover:scale-110 transition-transform" /> Editar
                                </button>
                            )}
                            
                            {client.email && (
                                <a 
                                    href={`mailto:${client.email}`}
                                    className="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 flex items-center justify-center gap-2 transition-all shrink-0"
                                >
                                    <Mail size={18} />
                                    <span className="hidden md:inline text-xs font-black uppercase tracking-widest">Email</span>
                                </a>
                            )}

                            <a 
                                href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 transition-all shrink-0"
                            >
                                <WhatsAppLogo />
                                <span className="hidden md:inline text-xs font-black uppercase tracking-widest">WhatsApp</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Sticky Navigation Tabs */}
                <div className="sticky top-0 z-20 bg-[#F8FAFC]/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                    <div className="flex px-4 md:px-12 overflow-x-auto no-scrollbar gap-6 md:gap-10">
                        {[
                            { id: 'overview', label: 'Visão Geral', icon: Layout },
                            { id: 'workarea', label: 'Plano de Ação', icon: ListTodo },
                            { id: 'billing', label: 'Financeiro', icon: CreditCard },
                            { id: 'audit', label: 'Histórico', icon: History },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 py-4 text-xs md:text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                            >
                                <tab.icon size={16} className={activeTab === tab.id ? 'animate-bounce' : ''} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F8FAFC] dark:bg-[#020617]">
                    
                    {/* Left Content (Dynamic Tabs) */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar pb-24 md:pb-10">
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-fade-in">
                                
                                {/* Bento Grid Layout for Stats - Simplified without Health Score */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="bg-white dark:bg-[#0A1F2E] p-5 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isOneOff ? 'Valor Único' : 'Receita (MRR)'}</p>
                                            <TrendingUp size={16} className="text-emerald-500" />
                                        </div>
                                        <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white truncate">R$ {client.contractValue.toLocaleString('pt-BR', { notation: "compact" })}</h3>
                                    </div>

                                    <div className="bg-white dark:bg-[#0A1F2E] p-5 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarefas</p>
                                            <Zap size={16} className="text-yellow-500" />
                                        </div>
                                        <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white">
                                            {client.tasks.filter(t => t.completed).length}/{client.tasks.length}
                                        </h3>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${client.tasks.length > 0 ? (client.tasks.filter(t => t.completed).length / client.tasks.length) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Only: Properties Section */}
                                <div className="block md:hidden bg-white dark:bg-[#0A1F2E] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                        <Layout size={14} className="text-blue-500" /> Dados Cadastrais
                                    </h3>
                                    <PropertiesForm />
                                </div>

                                {/* Two Column Layout for Notes & Activity */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="bg-white dark:bg-[#0A1F2E] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <MessageSquare size={16} className="text-blue-500" /> Notas Estratégicas
                                        </h3>
                                        <textarea 
                                            readOnly={!isEditing}
                                            value={isEditing ? formData.notes : client.notes}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                            className={`w-full flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-sm leading-relaxed min-h-[150px] resize-none font-medium transition-all ${isEditing ? 'text-slate-900 dark:text-white bg-slate-50 dark:bg-white/5 p-4 rounded-xl' : 'text-slate-500'}`}
                                            placeholder="Nenhuma observação registrada."
                                        />
                                    </div>
                                    <div className="bg-white dark:bg-[#0A1F2E] p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                            <History size={16} className="text-purple-500" /> Últimas Atividades
                                        </h3>
                                        <div className="space-y-6 relative">
                                            <div className="absolute left-[5px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800"></div>
                                            {client.activities.slice(0, 4).map((act, idx) => (
                                                <div key={act.id} className="flex gap-4 relative">
                                                    <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 z-10 border-2 border-white dark:border-[#0A1F2E] ${idx === 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                                    <div>
                                                        <p className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{act.content}</p>
                                                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{new Date(act.timestamp).toLocaleDateString()} • {act.user}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {client.activities.length === 0 && <p className="text-xs text-slate-400 italic">Nenhuma atividade recente.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'workarea' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="flex gap-2 p-2 bg-white dark:bg-[#0A1F2E] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg sticky top-0 z-10">
                                    <input 
                                        type="text" 
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                        placeholder="Adicionar nova tarefa..."
                                        className="flex-1 px-4 py-3 bg-transparent text-sm font-bold focus:outline-none dark:text-white placeholder-slate-400"
                                    />
                                    <button onClick={handleAddTask} className="bg-slate-900 dark:bg-blue-600 text-white px-4 md:px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform">
                                        Adicionar
                                    </button>
                                </div>

                                <div className="space-y-4 pb-10">
                                    {client.tasks.length === 0 ? (
                                        <div className="text-center py-20 opacity-50">
                                            <ListTodo size={48} className="mx-auto mb-4 text-slate-300" />
                                            <p className="text-sm font-bold text-slate-400">Nenhuma tarefa pendente</p>
                                        </div>
                                    ) : (
                                        client.tasks.map(task => {
                                            const styles = getPriorityStyles(task.priority);
                                            return (
                                                <div 
                                                    key={task.id} 
                                                    className={`group bg-white dark:bg-[#0A1F2E] rounded-2xl md:rounded-[1.2rem] border transition-all duration-300 overflow-hidden
                                                        ${task.completed 
                                                            ? 'border-slate-100 dark:border-slate-800 opacity-60' 
                                                            : `border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-900`
                                                        }
                                                    `}
                                                >
                                                    <div className={`p-4 md:p-5 flex items-start gap-4 ${styles.border} border-l-4`}>
                                                        <button 
                                                            onClick={() => handleToggleTask(task.id)}
                                                            className={`mt-0.5 transition-all active:scale-90 ${task.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}
                                                        >
                                                            {task.completed ? <CheckCircle2 size={22} className="fill-emerald-500/10" /> : <Circle size={22} strokeWidth={2} />}
                                                        </button>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${styles.badge}`}>
                                                                    {task.priority}
                                                                </span>
                                                            </div>
                                                            <p className={`text-sm md:text-base font-bold transition-all ${task.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                                                {task.title}
                                                            </p>
                                                            
                                                            {/* Subtasks Progress Bar */}
                                                            {task.subtasks && task.subtasks.length > 0 && (
                                                                <div className="mt-3 flex items-center gap-3">
                                                                    <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-blue-500 transition-all duration-500"
                                                                            style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-slate-400">
                                                                        {Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Subtasks List */}
                                                            <div className="mt-4 space-y-2">
                                                                {task.subtasks?.map(sub => (
                                                                    <div key={sub.id} className="flex items-center gap-3 pl-2 group/sub">
                                                                        <button onClick={() => handleToggleSubtask(task.id, sub.id)} className={`transition-colors ${sub.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}>
                                                                            {sub.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                                                        </button>
                                                                        <span className={`text-xs font-medium truncate flex-1 ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                                                            {sub.title}
                                                                        </span>
                                                                        <button onClick={() => handleDeleteSubtask(task.id, sub.id)} className="opacity-0 group-hover/sub:opacity-100 text-slate-300 hover:text-red-400 transition-opacity p-1">
                                                                            <X size={12} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                
                                                                <div className="flex items-center gap-2 pt-1 pl-2">
                                                                    <Plus size={14} className="text-slate-300" />
                                                                    <input 
                                                                        type="text" 
                                                                        value={subtaskInputs[task.id] || ''}
                                                                        onChange={(e) => setSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(task.id)}
                                                                        placeholder="Adicionar subtarefa..."
                                                                        className="flex-1 bg-transparent text-xs outline-none text-slate-600 dark:text-slate-300 placeholder-slate-300"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <button onClick={() => handleDeleteTask(task.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Card Principal - Estilo Cartão de Crédito */}
                                    <div className="md:col-span-2 bg-gradient-to-br from-[#0F172A] to-[#1E293B] p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-700"></div>
                                        
                                        <div className="flex justify-between items-start relative z-10">
                                            <div>
                                                <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Valor Total do Contrato</p>
                                                <h3 className="text-4xl md:text-5xl font-black tracking-tight">R$ {client.contractValue.toLocaleString()}</h3>
                                            </div>
                                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                                                <CreditCard size={24} className="text-blue-300" />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-end relative z-10">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Modelo</p>
                                                <div className="flex items-center gap-2">
                                                    {isOneOff ? <Briefcase size={14} className="text-purple-400" /> : <Repeat size={14} className="text-blue-400" />}
                                                    <span className="text-sm font-bold">{isOneOff ? 'Pagamento Único' : 'Assinatura Recorrente'}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Status Financeiro</p>
                                                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 justify-end">
                                                    <CheckCircle2 size={14} /> Em Dia
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Secundário - Detalhes */}
                                    <div className="bg-white dark:bg-[#0A1F2E] border border-slate-100 dark:border-slate-800 p-8 rounded-[2rem] shadow-sm flex flex-col justify-center">
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><CalendarCheck size={14} /> Início do Contrato</p>
                                                <p className="text-xl font-bold text-slate-900 dark:text-white">{new Date(client.contractStartDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={14} /> Duração / Fidelidade</p>
                                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {isOneOff ? 'Pontual' : `${client.contractDuration} Meses`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 md:ml-10 space-y-8 pl-8 md:pl-10 py-2">
                                    {client.activities.map((act, idx) => (
                                        <div key={act.id} className="relative group">
                                            <div className={`absolute -left-[41px] md:-left-[49px] top-0 w-5 h-5 rounded-full border-4 border-white dark:border-[#0A1F2E] transition-colors ${idx === 0 ? 'bg-blue-500 scale-125' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                                            
                                            <div className="bg-white dark:bg-[#0A1F2E] p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${act.type === 'field_update' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20'}`}>
                                                        {act.type.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">{new Date(act.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{act.content}</p>
                                                <p className="text-xs text-slate-400 mt-2 font-bold flex items-center gap-1">
                                                    <User size={12} /> {act.user}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar (Properties) - Desktop Only */}
                    <div className="hidden md:block w-[380px] lg:w-[420px] border-l border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#020617] p-10 space-y-10 shrink-0 overflow-y-auto custom-scrollbar">
                        <div>
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <Layout size={14} className="text-blue-500" /> Propriedades da Conta
                            </h3>
                            <PropertiesForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientDetailsModal;
