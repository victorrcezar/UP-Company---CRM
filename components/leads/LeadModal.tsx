
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
    Send, Mail, Pencil, XCircle
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
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const TAG_COLORS = [
    { id: 'red', class: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'blue', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'green', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'yellow', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'purple', class: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'gray', class: 'bg-gray-100 text-gray-700 border-gray-200' },
];

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

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-0 md:p-4 animate-fade-in">
            <div className="bg-white dark:bg-up-deep w-full max-w-5xl h-full md:h-[90vh] md:rounded-[2.5rem] shadow-2xl flex flex-col animate-scale-up border border-white/10 overflow-hidden">
                
                <div className="px-6 md:px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-up-deep shrink-0">
                    <div className="flex-1 min-w-0 mr-4">
                        <h2 className="text-xl md:text-2xl font-black text-up-dark dark:text-white uppercase tracking-tight truncate">
                            {leadId ? 'Detalhes do Negócio' : 'Novo Lead'}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold text-gray-400 uppercase">Status:</span>
                            <select 
                                value={formData.status}
                                onChange={(e) => setFormData({...formData, status: e.target.value as LeadStatus})}
                                className="text-xs font-black text-blue-500 bg-transparent border-none p-0 focus:ring-0 uppercase cursor-pointer"
                            >
                                {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all shrink-0">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-up-deep shrink-0 overflow-x-auto">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 min-w-[120px] px-4 md:px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center flex justify-center ${activeTab === 'info' ? 'border-up-dark text-up-dark dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <div className="flex items-center gap-2"><User size={16} /> Informações</div>
                    </button>
                    <button 
                        onClick={() => setActiveTab('timeline')}
                        className={`flex-1 min-w-[120px] px-4 md:px-8 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2 text-center flex justify-center ${activeTab === 'timeline' ? 'border-up-dark text-up-dark dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <div className="flex items-center gap-2"><History size={16} /> Timeline</div>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-white dark:bg-up-deep">
                    {activeTab === 'info' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                            <div className="lg:col-span-8 space-y-6 md:space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nome Completo</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.name} 
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                                placeholder="Nome do Lead"
                                            />
                                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Empresa</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.company} 
                                                onChange={(e) => setFormData({...formData, company: e.target.value})}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                                placeholder="Organização"
                                            />
                                            <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Telefone / WhatsApp</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={formData.phone} 
                                                onChange={handlePhoneChange}
                                                className="w-full pl-6 pr-12 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                                placeholder="(00) 00000-0000"
                                            />
                                            {formData.phone && (
                                                <a 
                                                    href={`https://wa.me/${formData.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 hover:scale-110 transition-transform bg-green-50 dark:bg-green-500/10 p-1.5 rounded-lg"
                                                    title="Abrir WhatsApp"
                                                >
                                                    <WhatsAppLogo />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Valor do Negócio (R$)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={formData.value} 
                                                onChange={(e) => setFormData({...formData, value: Number(e.target.value)})}
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                                placeholder="0,00"
                                            />
                                            <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Origem do Lead</label>
                                        <div className="relative">
                                            <select 
                                                value={formData.source} 
                                                onChange={(e) => setFormData({...formData, source: e.target.value})}
                                                className="w-full pl-12 pr-10 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none appearance-none cursor-pointer dark:text-white"
                                            >
                                                {SOURCE_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
                                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="relative md:col-span-2 bg-gray-50 dark:bg-up-dark/30 p-6 rounded-[2rem] border border-gray-200 dark:border-gray-700">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-4 ml-1">📅 Agendamento de Próximo Contato</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                            <div className="space-y-4">
                                                <div className="relative">
                                                    <input 
                                                        type="datetime-local" 
                                                        value={formData.nextFollowUp} 
                                                        onChange={(e) => setFormData({...formData, nextFollowUp: e.target.value})}
                                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-up-deep border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 outline-none"
                                                    />
                                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {[
                                                        { label: '+1d', days: 1 },
                                                        { label: '+3d', days: 3 },
                                                        { label: '+1sem', days: 7 },
                                                    ].map(preset => (
                                                        <button 
                                                            key={preset.label}
                                                            onClick={() => addDaysToFollowUp(preset.days)}
                                                            className="px-3 py-1.5 bg-white dark:bg-up-deep text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl text-[10px] font-black uppercase hover:border-blue-500 hover:text-blue-500 transition-all"
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="h-full flex flex-col justify-center mt-4 md:mt-0">
                                                {currentTenant?.googleScriptUrl ? (
                                                    <div className={`p-4 rounded-2xl border transition-all ${syncToCalendar ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-100 dark:bg-up-deep border-gray-200 dark:border-gray-700'}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${syncToCalendar ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                                                    <Calendar size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-up-dark dark:text-white uppercase tracking-tight">Sincronização Google</p>
                                                                    <p className="text-[9px] font-bold text-gray-400 uppercase">Status: {syncToCalendar ? 'Ativo' : 'Pausado'}</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => setSyncToCalendar(!syncToCalendar)}
                                                                className={`w-10 h-6 rounded-full relative transition-all ${syncToCalendar ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-300 dark:bg-gray-600'}`}
                                                            >
                                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${syncToCalendar ? 'left-5' : 'left-1'}`}></div>
                                                            </button>
                                                        </div>
                                                        <p className="text-[9px] text-gray-500 leading-tight">Os eventos aparecerão automaticamente na agenda compartilhada da empresa.</p>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <AlertTriangle size={18} className="text-orange-500" />
                                                            <p className="text-[10px] font-black text-orange-700 dark:text-orange-400 uppercase">Integração Pendente</p>
                                                        </div>
                                                        <p className="text-[9px] text-orange-600/70 leading-tight mb-2">A agenda da empresa não está conectada ao Google.</p>
                                                        <Link to="/settings" className="text-[9px] font-black text-orange-700 underline uppercase tracking-widest hover:text-orange-900 transition-colors">Configurar Agora</Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-gray-50 dark:bg-up-dark/30 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 h-full">
                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TagIcon size={14} /> Tags Estratégicas
                                    </h3>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {formData.tags.map(tag => (
                                            <span key={tag.name} className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border flex items-center gap-2 ${tag.color}`}>
                                                {tag.name}
                                                <button onClick={() => toggleTag(tag)}><X size={10} /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {systemTags.filter(st => !formData.tags.find(t => t.name === st.name)).map(tag => (
                                            <button 
                                                key={tag.name}
                                                onClick={() => toggleTag(tag)}
                                                className="px-3 py-1.5 rounded-xl text-[10px] font-bold border border-gray-200 dark:border-gray-700 text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-all bg-white dark:bg-up-deep"
                                            >
                                                + {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            <div className="space-y-4">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={16} /> 
                                        {editingNoteId ? 'Editando Anotação' : 'Nova Anotação'}
                                    </h3>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        {editingNoteId && (
                                            <button 
                                                onClick={handleCancelEditNote}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                                            >
                                                <XCircle size={14} /> Cancelar
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleSaveNote}
                                            disabled={!currentNote.trim()}
                                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed group
                                                ${editingNoteId ? 'bg-blue-600 hover:bg-blue-500' : 'bg-up-dark hover:bg-up-accent hover:text-up-dark'}`}
                                        >
                                            <Send size={14} className="group-hover:translate-x-1 transition-transform" /> 
                                            {editingNoteId ? 'Atualizar' : 'Registrar'}
                                        </button>
                                    </div>
                                </div>
                                <RichTextEditor 
                                    key={editingNoteId || 'new'} 
                                    initialValue={currentNote}
                                    onChange={setCurrentNote}
                                    onEnter={handleSaveNote}
                                    placeholder={editingNoteId ? "Edite sua anotação..." : "O que aconteceu no contato? (Pressione Enter para registrar)"}
                                    autoFocus={!!editingNoteId}
                                />
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <History size={16} /> Histórico
                                </h3>
                                <div className="space-y-4">
                                    {noteHistory.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic text-center py-8">Nenhuma anotação registrada ainda.</p>
                                    ) : (
                                        noteHistory.map(note => (
                                            <div 
                                                key={note.id} 
                                                className={`bg-white dark:bg-up-dark/20 p-6 rounded-3xl border transition-all relative group
                                                    ${editingNoteId === note.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-gray-100 dark:border-gray-700 hover:border-blue-200'}`}
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase">
                                                        {note.date}
                                                    </span>
                                                    
                                                    {/* Actions Buttons */}
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleStartEditNote(note)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteNote(note.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div 
                                                    className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 md:px-8 py-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/30 dark:bg-up-dark/10 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 rounded-2xl transition-all">Cancelar</button>
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className={`px-8 md:px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 ${isSaving ? 'bg-gray-400 cursor-wait' : 'bg-up-dark text-white shadow-up-dark/20 hover:scale-[1.02] active:scale-95'}`}
                    >
                        {isSaving ? <RefreshCw size={18} className="animate-spin" /> : <CheckSquare size={18} />} 
                        {isSaving ? 'Sincronizando...' : leadId ? 'Atualizar Lead' : 'Criar Negócio'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LeadModal;
