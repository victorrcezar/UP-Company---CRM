
import React, { useState, useEffect } from 'react';
import { Client, Task, TaskPriority, Subtask } from '../../types';
import { 
    X, Check, PencilLine, Mail, Phone,
    Layout, ListTodo, CreditCard, History,
    Activity, TrendingUp, Zap, MessageSquare, ArrowRight,
    CheckCircle2, Circle, Plus, Trash2, XCircle,
    ChevronDown, AlertTriangle, ToggleLeft, User, Building, DollarSign
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
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    if (v.length > 0) return v.replace(/^(\d{0,2}).*/, "($1");
    return v;
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
            case 'Urgent': return { badge: 'bg-red-100 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400', border: 'border-l-red-500' };
            case 'High': return { badge: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400', border: 'border-l-orange-500' };
            case 'Normal': return { badge: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400', border: 'border-l-blue-500' };
            case 'Low': return { badge: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400', border: 'border-l-gray-300' };
            default: return { badge: '', border: '' };
        }
    };

    const getHealthColor = (score: number) => {
        if (score >= 80) return 'text-green-500 border-green-500';
        if (score >= 50) return 'text-yellow-500 border-yellow-500';
        return 'text-red-500 border-red-500';
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

    // Componente reutilizável para o formulário de propriedades
    const PropertiesForm = () => (
        <div className="space-y-6">
            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Status da Operação</label>
                {isEditing ? (
                    <div className="relative">
                        <select 
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                            className="w-full p-3 bg-gray-50 dark:bg-up-dark border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none dark:text-white appearance-none"
                        >
                            <option value="Active">Ativo / Operando</option>
                            <option value="Inactive">Inativo / Pausado</option>
                            <option value="Churn">Cancelado / Churn</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-up-dark/50 rounded-xl border border-gray-100 dark:border-gray-700">
                        <ToggleLeft size={18} className={client.status === 'Active' ? 'text-green-500' : 'text-gray-400'} />
                        <p className="text-xs font-bold text-up-dark dark:text-white">{getStatusText(client.status)}</p>
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><User size={10} /> Nome do Cliente</label>
                {isEditing ? (
                    <input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full p-3 bg-gray-50 dark:bg-up-dark border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none dark:text-white"
                    />
                ) : (
                    <p className="text-sm font-bold text-up-dark dark:text-white px-1 leading-relaxed border-b border-transparent">{client.name}</p>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><Building size={10} /> Empresa</label>
                {isEditing ? (
                    <input 
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        className="w-full p-3 bg-gray-50 dark:bg-up-dark border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none dark:text-white"
                    />
                ) : (
                    <p className="text-sm font-bold text-up-dark dark:text-white px-1 leading-relaxed border-b border-transparent">{client.companyName || 'Pessoa Física'}</p>
                )}
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><Phone size={10} /> Telefone</label>
                {isEditing ? (
                    <input 
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: formatPhone(e.target.value)})}
                        className="w-full p-3 bg-gray-50 dark:bg-up-dark border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none dark:text-white"
                    />
                ) : (
                    <p className="text-sm font-bold text-up-dark dark:text-white px-1 border-b border-transparent">{client.phone}</p>
                )}
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 flex items-center gap-1"><DollarSign size={10} /> Faturamento (R$)</label>
                    {isEditing ? (
                        <input 
                            type="number"
                            value={formData.contractValue}
                            onChange={(e) => setFormData({...formData, contractValue: Number(e.target.value)})}
                            className="w-full p-3 bg-gray-50 dark:bg-up-dark border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none dark:text-white"
                        />
                    ) : (
                        <p className="text-sm font-bold text-green-600 px-1 border-b border-transparent">R$ {client.contractValue.toLocaleString()}</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-up-dark/95 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-6 animate-fade-in">
            <div className="bg-white dark:bg-up-deep w-full max-w-[1400px] h-full md:h-[95vh] md:rounded-[2.5rem] shadow-2xl flex flex-col animate-scale-up overflow-hidden border border-white/5 relative">
                
                {/* Close Button */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-all z-50 backdrop-blur-sm"
                >
                    <X size={20} />
                </button>

                {/* Header Section */}
                <div className="bg-[#0A1F2E] text-white pt-6 pb-2 px-5 md:px-10 md:py-10 relative shrink-0">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-up-accent/5 to-transparent pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-6 md:gap-0">
                        {/* Avatar & Title */}
                        <div className="flex items-center gap-4 md:gap-8 w-full pr-12 md:pr-0">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-up-accent to-blue-600 flex items-center justify-center text-2xl md:text-4xl font-black shadow-2xl shadow-up-accent/20 ring-4 ring-white/5 shrink-0">
                                {client.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl md:text-4xl font-black tracking-tight leading-tight break-words mb-2 line-clamp-2">
                                    {client.name}
                                </h2>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${getHealthColor(client.healthScore)}`}>
                                        Saúde: {client.healthScore}%
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border ${client.status === 'Active' ? 'border-green-500 text-green-500' : 'border-gray-500 text-gray-400'}`}>
                                        {getStatusText(client.status)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            {isEditing ? (
                                <>
                                    <button 
                                        onClick={() => setIsEditing(false)} 
                                        className="flex-1 md:flex-none px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold border border-white/10 transition-all uppercase tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        onClick={handleSave} 
                                        className="flex-1 md:flex-none px-6 py-2 bg-up-accent text-up-dark rounded-xl text-xs font-black shadow-xl shadow-up-accent/20 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                    >
                                        <Check size={16} /> Salvar
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={handleStartEdit} 
                                    className="w-full md:w-auto px-6 py-2 bg-up-accent/10 hover:bg-up-accent/20 text-up-accent rounded-xl text-xs font-black border border-up-accent/20 flex items-center justify-center gap-2 transition-all uppercase tracking-widest"
                                >
                                    <PencilLine size={16} /> Editar
                                </button>
                            )}
                            <a 
                                href={`https://wa.me/55${client.phone.replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="md:hidden w-10 h-10 rounded-xl bg-green-500 text-white flex items-center justify-center shrink-0"
                            >
                                <WhatsAppLogo />
                            </a>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-4 md:gap-10 mt-6 md:mt-12 border-b border-white/10 overflow-x-auto pb-0.5 no-scrollbar mask-gradient-right">
                        {[
                            { id: 'overview', label: 'Visão Geral', icon: Layout },
                            { id: 'workarea', label: 'Plano', icon: ListTodo },
                            { id: 'billing', label: 'Financeiro', icon: CreditCard },
                            { id: 'audit', label: 'Histórico', icon: History },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 md:gap-3 pb-3 md:pb-5 text-xs md:text-sm font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'border-up-accent text-up-accent' : 'border-transparent text-white/30 hover:text-white'}`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-50 dark:bg-[#0E2F3D]">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
                        {activeTab === 'overview' && (
                            <div className="space-y-6 md:space-y-12 animate-fade-in pb-10">
                                
                                {/* Stats Grid - Adjusted for Mobile (1 or 2 cols) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
                                    <div className="bg-white dark:bg-up-dark/40 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm sm:col-span-2 md:col-span-1">
                                        <div className="flex justify-between items-center mb-4 md:mb-6">
                                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Saúde do Cliente</p>
                                            <Activity size={16} className="text-up-accent" />
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className={`text-4xl md:text-5xl font-black ${getHealthColor(client.healthScore).split(' ')[0]}`}>{client.healthScore}</h3>
                                            <span className="text-xs font-bold text-gray-400">/100</span>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-up-dark/40 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <div className="flex justify-between items-center mb-4 md:mb-6">
                                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Receita Mensal</p>
                                            <TrendingUp size={16} className="text-green-500" />
                                        </div>
                                        <h3 className="text-2xl md:text-4xl font-black text-up-dark dark:text-white truncate">R$ {client.contractValue.toLocaleString('pt-BR', { notation: "compact" })}</h3>
                                    </div>

                                    <div className="bg-white dark:bg-up-dark/40 p-4 md:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm sm:col-span-2 md:col-span-1">
                                        <div className="flex justify-between items-center mb-4 md:mb-6">
                                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarefas</p>
                                            <Zap size={16} className="text-yellow-500" />
                                        </div>
                                        <h3 className="text-2xl md:text-4xl font-black text-up-dark dark:text-white">
                                            {client.tasks.filter(t => t.completed).length}/{client.tasks.length}
                                        </h3>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-2 md:mt-4 overflow-hidden">
                                            <div className="h-full bg-up-accent" style={{ width: `${client.tasks.length > 0 ? (client.tasks.filter(t => t.completed).length / client.tasks.length) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Only: Properties Section Embedded */}
                                <div className="block md:hidden bg-white dark:bg-up-dark/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                                    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Layout size={14} className="text-up-accent" /> Dados Cadastrais
                                    </h3>
                                    <PropertiesForm />
                                </div>

                                {/* Notes & Activity */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                    <div className="bg-white dark:bg-up-dark/40 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-gray-800">
                                        <h3 className="text-sm md:text-lg font-black text-up-dark dark:text-white mb-4 md:mb-6 flex items-center gap-3">
                                            <MessageSquare size={18} className="text-up-accent" /> Notas Estratégicas
                                        </h3>
                                        <textarea 
                                            readOnly={!isEditing}
                                            value={isEditing ? formData.notes : client.notes}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                            className={`w-full bg-transparent border-none focus:ring-0 text-xs md:text-sm leading-relaxed min-h-[120px] resize-none italic transition-all ${isEditing ? 'text-up-dark dark:text-white bg-white/5 p-4 rounded-xl ring-1 ring-white/10' : 'text-gray-500'}`}
                                            placeholder="Adicione considerações estratégicas para esta conta..."
                                        />
                                    </div>
                                    <div className="bg-white dark:bg-up-dark/40 p-5 md:p-8 rounded-2xl md:rounded-[2rem] border border-gray-100 dark:border-gray-800">
                                        <h3 className="text-sm md:text-lg font-black text-up-dark dark:text-white mb-4 md:mb-6 flex items-center gap-3">
                                            <ArrowRight size={18} className="text-up-accent" /> Atividades Recentes
                                        </h3>
                                        <div className="space-y-4 md:space-y-6">
                                            {client.activities.slice(0, 3).map(act => (
                                                <div key={act.id} className="flex gap-4">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-up-accent mt-1.5 shrink-0"></div>
                                                    <div>
                                                        <p className="text-xs md:text-sm font-bold text-up-dark dark:text-white leading-tight">{act.content}</p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold">{new Date(act.timestamp).toLocaleDateString()} por {act.user}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {client.activities.length === 0 && <p className="text-xs text-gray-400 italic">Nenhuma atividade registrada.</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'workarea' && (
                            <div className="space-y-6 md:space-y-10 animate-fade-in pb-20">
                                <div className="flex flex-col md:flex-row gap-2 md:gap-4 p-2 bg-white dark:bg-up-dark/50 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl focus-within:ring-2 focus-within:ring-up-accent/20">
                                    <input 
                                        type="text" 
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                        placeholder="Nova tarefa..."
                                        className="w-full md:flex-1 px-4 py-3 bg-transparent text-sm font-bold focus:outline-none dark:text-white"
                                    />
                                    <button onClick={handleAddTask} className="w-full md:w-auto bg-up-dark text-white px-4 md:px-10 py-3 md:py-0 rounded-xl md:rounded-2xl hover:bg-up-accent hover:text-up-dark transition-all font-black text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap">
                                        Criar
                                    </button>
                                </div>

                                <div className="grid gap-4 md:gap-6">
                                    {client.tasks.map(task => {
                                        const styles = getPriorityStyles(task.priority);
                                        const isPending = !task.completed;
                                        
                                        return (
                                            <div 
                                                key={task.id} 
                                                className={`group relative rounded-2xl md:rounded-[1.5rem] transition-all duration-300 border-l-[4px] md:border-l-[6px]
                                                    ${task.completed 
                                                        ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-gray-700 opacity-60 grayscale-[0.5]' 
                                                        : `bg-white dark:bg-up-surface shadow-sm hover:shadow-lg border-gray-100 dark:border-white/5 ${styles.border}`
                                                    }
                                                `}
                                            >
                                                <div className="p-4 md:p-6">
                                                    <div className="flex items-start gap-3 md:gap-5">
                                                        <button 
                                                            onClick={() => handleToggleTask(task.id)}
                                                            className={`mt-1 p-1 transition-all transform hover:scale-110 ${task.completed ? 'text-green-500' : 'text-gray-300 hover:text-up-accent'}`}
                                                        >
                                                            {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} strokeWidth={1.5} />}
                                                        </button>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <span className={`text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${styles.badge}`}>
                                                                    {task.priority}
                                                                </span>
                                                                {(isPending && (task.priority === 'Urgent' || task.priority === 'High')) && (
                                                                    <span className="flex items-center gap-1 text-[9px] font-black text-orange-500 uppercase tracking-widest animate-pulse">
                                                                        <AlertTriangle size={10} /> <span className="hidden md:inline">Atenção</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            
                                                            <p className={`text-sm md:text-base font-bold transition-all leading-snug break-words ${task.completed ? 'text-gray-400 line-through' : 'text-up-dark dark:text-white'}`}>
                                                                {task.title}
                                                            </p>
                                                            
                                                            {task.subtasks?.length > 0 && (
                                                                <div className="mt-2 md:mt-3 flex items-center gap-2">
                                                                    <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                                        <div 
                                                                            className="h-full bg-up-accent transition-all duration-500"
                                                                            style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase">
                                                                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Subtasks Section */}
                                                    <div className="mt-4 md:mt-6 pl-9 md:pl-12 space-y-2 md:space-y-3">
                                                        {task.subtasks?.map(sub => (
                                                            <div key={sub.id} className="flex items-center justify-between py-1">
                                                                <div className="flex items-center gap-3 relative min-w-0">
                                                                    <div className="absolute -left-5 top-1/2 w-3 h-px bg-gray-200 dark:bg-gray-700"></div>
                                                                    
                                                                    <button onClick={() => handleToggleSubtask(task.id, sub.id)} className={`p-1 ${sub.completed ? 'text-green-500' : 'text-gray-300 hover:text-up-accent transition-colors shrink-0'}`}>
                                                                        {sub.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                                                    </button>
                                                                    <span className={`text-[11px] md:text-xs font-medium truncate ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-600 dark:text-gray-300'}`}>
                                                                        {sub.title}
                                                                    </span>
                                                                </div>
                                                                <button onClick={() => handleDeleteSubtask(task.id, sub.id)} className="p-1 text-gray-300 hover:text-red-400">
                                                                    <XCircle size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        
                                                        <div className="flex items-center gap-2 pt-2 relative">
                                                            <div className="absolute -left-5 top-1/2 w-3 h-px bg-gray-200 dark:bg-gray-700"></div>
                                                            <div className="relative flex-1">
                                                                <input 
                                                                    type="text" 
                                                                    value={subtaskInputs[task.id] || ''}
                                                                    onChange={(e) => setSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(task.id)}
                                                                    placeholder="Subtarefa..."
                                                                    className="w-full pl-2 pr-3 py-1.5 bg-gray-50 dark:bg-up-dark/20 border border-gray-100 dark:border-gray-700/50 rounded-lg text-[10px] md:text-xs font-medium outline-none dark:text-gray-300 placeholder-gray-400"
                                                                />
                                                            </div>
                                                            <button 
                                                                onClick={() => handleAddSubtask(task.id)} 
                                                                className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-up-dark hover:text-white dark:hover:bg-up-accent dark:hover:text-up-dark transition-all"
                                                            >
                                                                <Plus size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="space-y-6 md:space-y-12 animate-fade-in pb-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                                    <div className="bg-up-accent/5 border border-up-accent/20 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] flex flex-col justify-between h-auto min-h-[160px] md:h-52 shadow-sm">
                                        <p className="text-[10px] md:text-[11px] font-black text-up-accent uppercase tracking-widest">Valor do Contrato</p>
                                        <h4 className="text-3xl md:text-5xl font-black text-up-dark dark:text-white my-2">R$ {client.contractValue.toLocaleString()}</h4>
                                        <p className="text-[10px] md:text-xs text-up-accent/60">Recorrência Mensal Fixa</p>
                                    </div>
                                    <div className="bg-gray-100 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] flex flex-col justify-between h-auto min-h-[160px] md:h-52 shadow-sm">
                                        <p className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Comprometimento</p>
                                        <h4 className="text-3xl md:text-5xl font-black text-up-dark dark:text-white my-2">{client.contractDuration} <span className="text-lg md:text-xl">Meses</span></h4>
                                        <p className="text-[10px] md:text-xs text-gray-400">Tempo total de fidelidade</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
                                <div className="space-y-4">
                                    {client.activities.map(act => (
                                        <div key={act.id} className="bg-white dark:bg-up-dark/20 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 dark:border-gray-700 flex justify-between items-center shadow-sm">
                                            <div className="flex gap-4 items-center">
                                                <div className={`p-2 md:p-3 rounded-2xl ${act.type === 'field_update' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    <History size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs md:text-sm font-bold text-up-dark dark:text-white line-clamp-2">{act.content}</p>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                                        {new Date(act.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Sidebar (Properties) - Visible Only on Desktop */}
                    <div className="hidden md:block w-[350px] lg:w-[400px] border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-up-dark/10 p-12 space-y-12 shrink-0 overflow-y-auto custom-scrollbar">
                        <div>
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <Layout size={14} className="text-up-accent" /> Propriedades da Conta
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
