
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Lead, CustomEvent } from '../types';
import { googleCalendar, GoogleEvent } from '../services/googleCalendar';
import { 
    Calendar as CalendarIcon, Clock, ChevronRight, ChevronLeft, Building, ExternalLink, Globe, 
    CalendarDays, LogOut, RefreshCw, CalendarPlus, User, MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import EventModal from '../components/agenda/EventModal';

interface UnifiedEvent {
    id: string;
    type: 'crm_lead' | 'crm_event' | 'google';
    title: string;
    date: Date;
    description?: string;
    location?: string;
    originalData: Lead | GoogleEvent | CustomEvent;
    colorClass: string;
}

const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
    </svg>
);

const Agenda = () => {
    // State do Calendário
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // State dos Dados
    const [unifiedEvents, setUnifiedEvents] = useState<UnifiedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { currentTenant } = useAuth();
    const navigate = useNavigate();

    // Funções de Data
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const handleToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedDate(now);
    };

    const fetchAllEvents = async () => {
        setIsRefreshing(true);
        
        // Define range para busca (Mês atual visualizado)
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);
        
        // Amplia range para garantir que pegamos tudo
        const fetchStart = new Date(startOfMonth); fetchStart.setDate(fetchStart.getDate() - 7);
        const fetchEnd = new Date(endOfMonth); fetchEnd.setDate(fetchEnd.getDate() + 7);

        // 1. Fetch CRM Leads Follow-ups (Local)
        // O MockDB retorna todos, filtramos depois por simplicidade ou melhoramos o mock depois
        const crmLeads = await db.getAgendaItems();
        
        // 2. Fetch Custom CRM Events (Local)
        const customEvents = await db.getCustomEvents();

        // 3. Fetch Google Calendar Events (Live)
        const connected = googleCalendar.isConnected();
        setIsGoogleConnected(connected);
        
        let googleEvents: GoogleEvent[] = [];
        if (connected) {
            googleEvents = await googleCalendar.fetchEvents(fetchStart, fetchEnd);
        }

        // Unifica tudo
        const unified: UnifiedEvent[] = [
            ...crmLeads.map(l => ({
                id: `crm-lead-${l.id}`,
                type: 'crm_lead' as const,
                title: l.name,
                date: new Date(l.nextFollowUp!),
                description: l.company || l.source,
                originalData: l,
                colorClass: 'bg-blue-500' // Azul para CRM
            })),
            ...customEvents.map(c => ({
                id: `crm-event-${c.id}`,
                type: 'crm_event' as const,
                title: c.title,
                date: new Date(c.date),
                location: c.location,
                description: c.description,
                originalData: c,
                colorClass: 'bg-purple-500' // Roxo para Eventos Manuais
            })),
            ...googleEvents.map(g => {
                const dateObj = g.start.dateTime ? new Date(g.start.dateTime) : new Date(g.start.date + 'T00:00:00');
                return {
                    id: `google-${g.id}`,
                    type: 'google' as const,
                    title: g.summary,
                    date: dateObj,
                    location: g.location,
                    description: g.description,
                    originalData: g,
                    colorClass: 'bg-green-500' // Verde para Google
                };
            })
        ];

        // Filtra apenas o que é relevante para o range (opcional, mas bom para performance visual)
        const filtered = unified.filter(e => 
            e.date >= fetchStart && e.date <= fetchEnd
        );

        setUnifiedEvents(filtered);
        setLoading(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchAllEvents();
    }, [currentTenant, currentDate]); // Recarrega se mudar o mês ou tenant

    const handleConnectGoogle = async () => {
        try {
            await googleCalendar.requestToken();
            fetchAllEvents();
        } catch (e) {
            alert('Não foi possível conectar ao Google. Verifique o console.');
        }
    };

    const handleDisconnectGoogle = () => {
        googleCalendar.logout();
        setIsGoogleConnected(false);
        fetchAllEvents();
    };

    // Filtra eventos para o dia selecionado
    const selectedDayEvents = unifiedEvents.filter(e => 
        e.date.getDate() === selectedDate.getDate() &&
        e.date.getMonth() === selectedDate.getMonth() &&
        e.date.getFullYear() === selectedDate.getFullYear()
    ).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Renderiza células do calendário
    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Padding days (previous month)
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-24 md:h-32 bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5"></div>);
        }

        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const isToday = new Date().toDateString() === date.toDateString();
            const isSelected = selectedDate.toDateString() === date.toDateString();
            
            const dayEvents = unifiedEvents.filter(e => 
                e.date.getDate() === i &&
                e.date.getMonth() === currentDate.getMonth() &&
                e.date.getFullYear() === currentDate.getFullYear()
            );

            days.push(
                <div 
                    key={i} 
                    onClick={() => setSelectedDate(date)}
                    className={`h-24 md:h-32 border border-gray-100 dark:border-white/5 p-2 relative cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/5
                        ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-inset ring-blue-500' : 'bg-white dark:bg-[#0A1F2E]'}
                    `}
                >
                    <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                            ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-700 dark:text-slate-300'}
                        `}>
                            {i}
                        </span>
                    </div>
                    
                    {/* Dots/Bars for events */}
                    <div className="mt-2 space-y-1 overflow-hidden max-h-[calc(100%-2rem)]">
                        {dayEvents.slice(0, 3).map((evt, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-[9px] font-bold truncate px-1.5 py-0.5 rounded-md bg-opacity-10 dark:bg-opacity-20" style={{ backgroundColor: evt.type === 'google' ? '#dcfce7' : evt.type === 'crm_lead' ? '#dbeafe' : '#f3e8ff' }}>
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${evt.colorClass}`}></div>
                                <span className="truncate text-slate-600 dark:text-slate-300">{evt.title}</span>
                            </div>
                        ))}
                        {dayEvents.length > 3 && (
                            <div className="text-[9px] text-slate-400 font-bold pl-1">+ {dayEvents.length - 3} mais</div>
                        )}
                    </div>
                </div>
            );
        }

        return days;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in pb-4">
            
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex gap-1 bg-gray-100 dark:bg-white/10 rounded-lg p-1 ml-2">
                            <button onClick={handlePrevMonth} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded-md transition-all"><ChevronLeft size={16} /></button>
                            <button onClick={handleToday} className="px-3 text-xs font-bold hover:bg-white dark:hover:bg-white/10 rounded-md transition-all">Hoje</button>
                            <button onClick={handleNextMonth} className="p-1 hover:bg-white dark:hover:bg-white/10 rounded-md transition-all"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Google Status Indicator */}
                    {isGoogleConnected ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-200 dark:border-green-800">
                            <GoogleIcon /> Sincronizado
                        </div>
                    ) : (
                        <button 
                            onClick={handleConnectGoogle}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 transition-all text-slate-500"
                        >
                            <GoogleIcon /> Conectar
                        </button>
                    )}

                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-900 dark:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                    >
                        <CalendarPlus size={16} /> Novo
                    </button>
                    
                    <button onClick={fetchAllEvents} className="p-2 bg-gray-100 dark:bg-white/10 rounded-xl hover:text-blue-500 transition-colors">
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main Content: Split View (Calendar + Day Detail) */}
            <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
                
                {/* Calendar Grid */}
                <div className="flex-1 bg-white dark:bg-[#0A1F2E] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                            <div key={d} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {d}
                            </div>
                        ))}
                    </div>
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Side Panel: Selected Day Agenda */}
                <div className="w-full lg:w-[350px] bg-white dark:bg-[#0A1F2E] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col shrink-0">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5">
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white leading-none">
                            {selectedDate.getDate()}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long' })}
                        </p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {selectedDayEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                                <CalendarDays size={48} className="mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">Sem compromissos</p>
                            </div>
                        ) : (
                            selectedDayEvents.map(evt => (
                                <div key={evt.id} className="group relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 transition-colors py-1">
                                    <div className={`absolute -left-[5px] top-3 w-2.5 h-2.5 rounded-full ${evt.colorClass} ring-4 ring-white dark:ring-[#0A1F2E]`}></div>
                                    
                                    <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl hover:bg-white dark:hover:bg-white/10 hover:shadow-md transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/5 cursor-pointer">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                                evt.type === 'google' ? 'bg-green-100 text-green-700' :
                                                evt.type === 'crm_lead' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                {evt.type === 'google' ? 'Google' : evt.type === 'crm_lead' ? 'CRM Lead' : 'Evento'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">
                                                {evt.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1">
                                            {evt.title}
                                        </h4>
                                        {evt.description && (
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-2">{evt.description}</p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            {evt.location && (
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                                                    <MapPin size={10} /> {evt.location}
                                                </div>
                                            )}
                                            {evt.type === 'google' && (evt.originalData as GoogleEvent).htmlLink && (
                                                <a href={(evt.originalData as GoogleEvent).htmlLink} target="_blank" rel="noreferrer" className="ml-auto text-blue-500 hover:text-blue-600">
                                                    <ExternalLink size={12} />
                                                </a>
                                            )}
                                            {evt.type === 'crm_lead' && (
                                                <button onClick={() => navigate('/leads', { state: { leadId: (evt.originalData as Lead).id } })} className="ml-auto text-blue-500 hover:text-blue-600 text-[10px] font-bold uppercase flex items-center gap-1">
                                                    Ver Lead <ChevronRight size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <EventModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={() => {
                    // Espera 1s para propagação do Google e recarrega
                    setTimeout(fetchAllEvents, 1000);
                }} 
            />
        </div>
    );
};

export default Agenda;
