
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, Tag } from '../../types';
import { db } from '../../services/mockDb';
import { googleSync } from '../../services/googleSync';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { 
    X, User, CheckSquare, Calendar, Clock, Tag as TagIcon, 
    Plus, Check, History, MessageSquare, Trash2, 
    Sparkles, Building, Globe, DollarSign, ListFilter, ChevronDown, RefreshCw, AlertTriangle,
    Send, Mail, Pencil, XCircle, AlertCircle
} from 'lucide-react';
import RichTextEditor from '../RichTextEditor';

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    leadId: string | null;
    onSaveSuccess: (savedLead: Lead) => void;
}

const WhatsAppLogo = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
    { value: 'New', label: 'Novo Lead' },
    { value: 'Contacted', label: 'Contatado' },
    { value: 'Discussion', label: 'Em Negociação' },
    { value: 'Interested', label: 'Interessado' },
    { value: 'Qualified', label: 'Qualificado' },
    { value: 'Closed', label: 'Fechado' },
    { value: 'Lost', label: 'Perdido' },
];

const SOURCE_OPTIONS = [
    'Instagram',
    'Facebook',
    'Google Ads',
    'LinkedIn',
    'Indicação',
    'WhatsApp',
    'Site',
    'Evento',
    'Outros'
];

const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    
    if (v.length > 10) {
        return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (v.length > 6) {
        return v.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (v.length > 2) {
        return v.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    } else if (v.length > 0) {
        return v.replace(/^(\d{0,2}).*/, "($1");
    }
    return v;
};

const INITIAL_FORM_STATE = {
    name: '',
    phone: '',
    email: '',
    company: '',
    source: 'Instagram',
    status: 'New' as LeadStatus,
    value: 0,
    nextFollowUp: '',
    notes: '[]',
    tags: [] as Tag[]
};

interface NoteItem {
    id: string;
    date: string;
    timestamp: number;
    content: string;
}

const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, leadId, onSaveSuccess }) => {
    const { currentTenant } = useAuth();
    const [activeTab, setActiveTab] = useState<'info' | 'timeline'>('info');
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [noteHistory, setNoteHistory] = useState<NoteItem[]>([]);
    const [currentNote, setCurrentNote] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [systemTags, setSystemTags] = useState<Tag[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [syncToCalendar, setSyncToCalendar] = useState(!!currentTenant?.googleScriptUrl);

    useEffect(() => {
        if (isOpen) {
            fetchSystemTags();
            setSyncToCalendar(!!currentTenant?.googleScriptUrl);
            if (leadId) {
                fetchLeadDetails(leadId);
            } else {
                setFormData(INITIAL_FORM_STATE);
                setNoteHistory([]);
                setActiveTab('info');
            }
            // Reset editing state on open
            setEditingNoteId(null);
            setCurrentNote('');
        }
    }, [isOpen, leadId, currentTenant]);

    const fetchSystemTags = async () => {
        const tags = await db.getTags();
        setSystemTags(tags);
    };

    const fetchLeadDetails = async (id: string) => {
        const lead = await db.getLeadById(id);
        if (lead) {
            let formattedDate = '';
            if (lead.nextFollowUp) {
                const d = new Date(lead.nextFollowUp);
                const dLocal = new Date(d.getTime() - (d.getTimezoneOffset() * 60000));
                formattedDate = dLocal.toISOString().slice(0, 16);
            }

            setFormData({
                ...lead,
                company: lead.company || '',
                nextFollowUp: formattedDate,
                notes: lead.notes || '[]',
                tags: lead.tags || [],
                value: lead.value || 0
            });

            try {
                setNoteHistory(JSON.parse(lead.notes || '[]'));
            } catch (e) {
                setNoteHistory([]);
            }
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const addDaysToFollowUp = (days: number) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        date.setHours(9, 0, 0, 0);
        const dLocal = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        setFormData({ ...formData, nextFollowUp: dLocal.toISOString().slice(0, 16) });
    };

    const handleSaveNote = async () => {
        if (!currentNote.trim()) return;

        let updatedHistory: NoteItem[];

        if (editingNoteId) {
            // Edit existing note
            updatedHistory = noteHistory.map(note => 
                note.id === editingNoteId 
                    ? { ...note, content: currentNote } 
                    : note
            );
            setEditingNoteId(null);
        } else {
            // Add new note
            const now = new Date();
            const newNote: NoteItem = {
                id: Math.random().toString(36).substr(2, 9),
                date: now.toLocaleString('pt-BR'),
                timestamp: now.getTime(),
                content: currentNote.trim()
            };
            updatedHistory = [newNote, ...noteHistory];
        }

        setNoteHistory(updatedHistory);
        setCurrentNote('');

        if (leadId) {
            await db.updateLead(leadId, {
                notes: JSON.stringify(updatedHistory)
            });
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta anotação?')) return;

        const updatedHistory = noteHistory.filter(n => n.id !== noteId);
        setNoteHistory(updatedHistory);
        
        // Se estava editando a nota que foi excluída, limpa o editor
        if (editingNoteId === noteId) {
            setEditingNoteId(null);
            setCurrentNote('');
        }

        if (leadId) {
            await db.updateLead(leadId, {
                notes: JSON.stringify(updatedHistory)
            });
        }
    };

    const handleStartEditNote = (note: NoteItem) => {
        setEditingNoteId(note.id);
        setCurrentNote(note.content);
    };

    const handleCancelEditNote = () => {
        setEditingNoteId(null);
        setCurrentNote('');
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setIsSaving(true);

        let finalHistory = [...noteHistory];
        // Se tiver texto não salvo no editor ao clicar em salvar lead, salva como nova nota
        if (currentNote.trim() && !editingNoteId) {
            const now = new Date();
            const newNote: NoteItem = {
                id: Math.random().toString(36).substr(2, 9),
                date: now.toLocaleString('pt-BR'),
                timestamp: now.getTime(),
                content: currentNote.trim()
            };
            finalHistory = [newNote, ...finalHistory];
        }

        const leadData = {
            ...formData,
            notes: JSON.stringify(finalHistory),
            nextFollowUp: formData.nextFollowUp ? new Date(formData.nextFollowUp).toISOString() : null,
        };

        let savedLead;
        if (leadId) {
            savedLead = await db.updateLead(leadId, leadData);
        } else {
            savedLead = await db.addLead(leadData);
        }

        // Se a sincronização estiver ativa, chamamos o googleSync.
        // O googleSync agora lida com o envio do e-mail do lead para o script.
        if (syncToCalendar && savedLead.nextFollowUp && currentTenant?.googleScriptUrl) {
            await googleSync.syncLead(savedLead);
        }

        onSaveSuccess(savedLead);
        setIsSaving(false);
        setCurrentNote('');
        setEditingNoteId(null);
    };

    const toggleTag = (tag: Tag) => {
        const exists = formData.tags.find(t => t.name === tag.name);
        if (exists) {
            setFormData({ ...formData, tags: formData.tags.filter(t => t.name !== tag.name) });
        } else {
            setFormData({ ...formData, tags: [...formData.tags, tag] });
        }
    };

    if (!isOpen) return null;

    // Verificar se está atrasado
    const nextDate = formData.nextFollowUp ? new Date(formData.nextFollowUp) : null;
    const isOverdue = nextDate && nextDate < new Date();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-0 md:p-4 animate-fade-in">
            {/* Responsividade: rounded-none e h-full no mobile para preencher a tela */}
            <div className="bg-white dark:bg-[#0A1F2E] w-full max-w-5xl h-full md:h-auto md:max-h-[92vh] rounded-none md:rounded-[2.5rem] shadow-2xl flex flex-col animate-scale-up border border-white/10 overflow-hidden relative">
                
                {/* Header Style Premium */}
                <div className="px-6 md:px-10 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-start bg-white/50 dark:bg-[#0A1F2E] shrink-0 backdrop-blur-xl z-20">
                    <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                {leadId ? <User size={20} /> : <Plus size={20} />}
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight truncate leading-none">
                                {leadId ? 'Gerenciar Negócio' : 'Novo Lead'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2 pl-12">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status Atual:</span>
                            <div className="relative group">
                                <select 
                                    value={formData.status}
                                    onChange={(e) => setFormData({...formData, status: e.target.value as LeadStatus})}
                                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-transparent border-none p-0 focus:ring-0 uppercase cursor-pointer pr-4 hover:underline"
                                >
                                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <ChevronDown size={10} className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all shrink-0">
                        <X size={22} />
                    </button>
                </div>

                {/* Tabs Modernas */}
                <div className="flex px-6 md:px-10 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0A1F2E] shrink-0 overflow-x-auto gap-6">
                    {[
                        { id: 'info', label: 'Dados do Lead', icon: User },
                        { id: 'timeline', label: 'Histórico & Notas', icon: History }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-4 pt-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2
                                ${activeTab === tab.id 
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <tab.icon size={14} className={activeTab === tab.id ? 'text-blue-500' : ''} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-[#F8FAFC] dark:bg-[#020617] relative">
                    {activeTab === 'info' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nome Completo</label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={formData.name} 
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                                                placeholder="Nome do cliente potencial"
                                            />
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Empresa</label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={formData.company} 
                                                onChange={(e) => setFormData({...formData, company: e.target.value})}
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                                                placeholder="Organização"
                                            />
                                            <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Contato</label>
                                        <div className="relative group">
                                            <input 
                                                type="text" 
                                                value={formData.phone} 
                                                onChange={handlePhoneChange}
                                                className="w-full pl-12 pr-24 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                                                placeholder="(00) 00000-0000"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">BR</span>
                                            
                                            {/* Action Buttons inside Input */}
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                {formData.email && (
                                                    <a 
                                                        href={`mailto:${formData.email}`}
                                                        className="text-blue-500 hover:scale-110 transition-transform bg-blue-50 dark:bg-blue-500/10 p-2 rounded-xl"
                                                        title="Enviar Email"
                                                    >
                                                        <Mail size={16} />
                                                    </a>
                                                )}
                                                {formData.phone && (
                                                    <a 
                                                        href={`https://wa.me/55${formData.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-green-500 hover:scale-110 transition-transform bg-green-50 dark:bg-green-500/10 p-2 rounded-xl"
                                                        title="Abrir WhatsApp"
                                                    >
                                                        <WhatsAppLogo />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">E-mail</label>
                                        <div className="relative group">
                                            <input 
                                                type="email" 
                                                value={formData.email} 
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                                                placeholder="contato@email.com"
                                            />
                                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Potencial (R$)</label>
                                        <div className="relative group">
                                            <input 
                                                type="number" 
                                                value={formData.value} 
                                                onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none"
                                                placeholder="0,00"
                                            />
                                            <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Origem</label>
                                        <div className="relative group">
                                            <select 
                                                value={formData.source} 
                                                onChange={(e) => setFormData({...formData, source: e.target.value})}
                                                className="w-full pl-12 pr-10 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all outline-none appearance-none cursor-pointer"
                                            >
                                                {SOURCE_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="relative md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-[2rem] border border-blue-100 dark:border-blue-500/20">
                                        <label className="block text-[10px] font-black text-blue-400 uppercase mb-4 ml-1 flex items-center gap-2">
                                            <Calendar size={14} /> Agendamento de Follow-up
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                            <div className="space-y-4">
                                                <div className="relative group">
                                                    <input 
                                                        type="datetime-local" 
                                                        value={formData.nextFollowUp} 
                                                        onChange={(e) => setFormData({...formData, nextFollowUp: e.target.value})}
                                                        className="w-full pl-4 pr-4 py-4 bg-white dark:bg-[#0A1F2E] border border-blue-200 dark:border-blue-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none shadow-sm"
                                                    />
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        { label: '+1 Dia', days: 1 },
                                                        { label: '+3 Dias', days: 3 },
                                                        { label: '+1 Sem', days: 7 },
                                                    ].map(preset => (
                                                        <button 
                                                            key={preset.label}
                                                            onClick={() => addDaysToFollowUp(preset.days)}
                                                            className="px-3 py-1.5 bg-white dark:bg-[#0A1F2E] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-black uppercase hover:border-blue-500 hover:text-blue-500 transition-all shadow-sm"
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="h-full flex flex-col justify-center mt-4 md:mt-0">
                                                {currentTenant?.googleScriptUrl ? (
                                                    <div onClick={() => setSyncToCalendar(!syncToCalendar)} className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 group ${syncToCalendar ? 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-[#0A1F2E] border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={18} className={syncToCalendar ? 'text-white' : 'text-slate-400'} />
                                                                <span className={`text-xs font-black uppercase tracking-wide ${syncToCalendar ? 'text-white' : 'text-slate-500'}`}>Google Agenda</span>
                                                            </div>
                                                            <div className={`w-4 h-4 rounded-full border-2 ${syncToCalendar ? 'bg-white border-white' : 'border-slate-300'}`}>
                                                                {syncToCalendar && <Check size={12} className="text-blue-500" />}
                                                            </div>
                                                        </div>
                                                        <p className={`text-[10px] font-medium leading-tight ${syncToCalendar ? 'text-blue-100' : 'text-slate-400'}`}>
                                                            {syncToCalendar ? 'Convite será enviado ao Lead.' : 'Toque para sincronizar.'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <AlertTriangle size={16} className="text-orange-500" />
                                                            <p className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase">Não conectado</p>
                                                        </div>
                                                        <Link to="/settings" className="text-[10px] font-bold text-orange-600 underline">Configurar Integração</Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-white dark:bg-[#0A1F2E] rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm h-full">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <TagIcon size={14} /> Tags Estratégicas
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {formData.tags.map(tag => (
                                            <button 
                                                key={tag.name} 
                                                onClick={() => toggleTag(tag)}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border flex items-center gap-2 transition-all hover:opacity-80 ${tag.color}`}
                                            >
                                                {tag.name}
                                                <X size={10} />
                                            </button>
                                        ))}
                                        {formData.tags.length === 0 && <p className="text-xs text-slate-400 italic">Nenhuma tag selecionada.</p>}
                                    </div>
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase">Adicionar Tags:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {systemTags.filter(st => !formData.tags.find(t => t.name === st.name)).map(tag => (
                                                <button 
                                                    key={tag.name}
                                                    onClick={() => toggleTag(tag)}
                                                    className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all bg-slate-50 dark:bg-slate-900"
                                                >
                                                    + {tag.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
                            
                            {/* Destaque para Follow-up Atrasado ou Futuro */}
                            {formData.nextFollowUp && (
                                <div className={`p-6 rounded-[2rem] border flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm relative overflow-hidden ${
                                    isOverdue 
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' 
                                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-100 dark:border-blue-800/30'
                                }`}>
                                    <div className={`p-4 rounded-2xl shrink-0 shadow-sm ${
                                        isOverdue ? 'bg-red-100 text-red-600' : 'bg-white dark:bg-white/10 text-blue-600 dark:text-blue-400'
                                    }`}>
                                        {isOverdue ? <AlertCircle size={28} /> : <Calendar size={28} />}
                                    </div>
                                    <div>
                                        <h4 className={`text-base font-black uppercase tracking-wide ${
                                            isOverdue ? 'text-red-700 dark:text-red-400' : 'text-blue-800 dark:text-blue-300'
                                        }`}>
                                            {isOverdue ? 'Follow-up Atrasado' : 'Próximo Agendamento'}
                                        </h4>
                                        <p className={`text-sm font-medium mt-1 ${
                                            isOverdue ? 'text-red-600/80 dark:text-red-400/80' : 'text-blue-600/80 dark:text-blue-300/80'
                                        }`}>
                                            {isOverdue 
                                                ? `Esta tarefa estava agendada para ${new Date(formData.nextFollowUp).toLocaleString('pt-BR')}.`
                                                : `Agendado para ${new Date(formData.nextFollowUp).toLocaleString('pt-BR')}.`
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={16} className="text-blue-500" /> 
                                        {editingNoteId ? 'Editando Registro' : 'Novo Registro de Contato'}
                                    </h3>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {editingNoteId && (
                                            <button 
                                                onClick={handleCancelEditNote}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                            >
                                                <XCircle size={14} /> Cancelar
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleSaveNote}
                                            disabled={!currentNote.trim()}
                                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:scale-105 active:scale-95 group
                                                ${editingNoteId ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-slate-900 dark:bg-blue-600 hover:opacity-90 shadow-slate-900/20'}`}
                                        >
                                            <Send size={14} className="group-hover:translate-x-1 transition-transform" /> 
                                            {editingNoteId ? 'Atualizar' : 'Registrar Nota'}
                                        </button>
                                    </div>
                                </div>
                                <RichTextEditor 
                                    key={editingNoteId || 'new'} 
                                    initialValue={currentNote}
                                    onChange={setCurrentNote}
                                    onEnter={handleSaveNote}
                                    placeholder={editingNoteId ? "Edite sua anotação..." : "Descreva o que foi discutido, objeções ou próximos passos..."}
                                    autoFocus={!!editingNoteId}
                                    className="min-h-[200px] shadow-sm"
                                />
                            </div>

                            <div className="space-y-6 pt-8 border-t border-slate-200 dark:border-slate-800">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <History size={16} /> Linha do Tempo
                                </h3>
                                <div className="space-y-6 relative ml-3">
                                    <div className="absolute left-[7px] top-4 bottom-4 w-px bg-slate-200 dark:border-slate-800"></div>
                                    {noteHistory.length === 0 ? (
                                        <div className="py-12 text-center text-slate-400 bg-white dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                                            <History size={32} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-xs font-medium">Nenhum histórico registrado.</p>
                                        </div>
                                    ) : (
                                        noteHistory.map(note => (
                                            <div key={note.id} className="relative pl-8 group">
                                                <div className="absolute left-0 top-1.5 w-4 h-4 bg-white dark:bg-[#0A1F2E] border-2 border-blue-500 rounded-full z-10 group-hover:scale-125 transition-transform"></div>
                                                <div 
                                                    className={`bg-white dark:bg-[#0A1F2E] p-6 rounded-[1.5rem] border transition-all relative group
                                                        ${editingNoteId === note.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm'}`}
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg uppercase tracking-wide">
                                                            {note.date}
                                                        </span>
                                                        
                                                        {/* Actions Buttons */}
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => handleStartEditNote(note)}
                                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteNote(note.id)}
                                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Excluir"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div 
                                                        className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                                        dangerouslySetInnerHTML={{ __html: note.content }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 md:px-10 py-6 border-t border-gray-100 dark:border-white/5 flex justify-end gap-4 bg-white/50 dark:bg-[#0A1F2E] shrink-0 backdrop-blur-xl z-20">
                    <button onClick={onClose} className="px-6 py-3.5 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all">Cancelar</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className={`px-8 md:px-12 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95 ${isSaving ? 'bg-slate-400 cursor-wait' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                    >
                        {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <CheckSquare size={18} />} 
                        {isSaving ? 'Salvando...' : leadId ? 'Salvar Alterações' : 'Criar Negócio'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadModal;
