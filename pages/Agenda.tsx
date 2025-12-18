
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Lead } from '../types';
import { googleCalendar, GoogleEvent } from '../services/googleCalendar';
import { 
    Calendar, Clock, ChevronRight, Building, ExternalLink, Globe, 
    CalendarDays, LogOut, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface UnifiedEvent {
    id: string;
    type: 'crm' | 'google';
    title: string;
    date: Date;
    description?: string;
    location?: string;
    originalData: Lead | GoogleEvent;
}

const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
    </svg>
);

const WhatsAppLogo = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const UnifiedEventCard: React.FC<{ event: UnifiedEvent }> = ({ event }) => {
    const isGoogle = event.type === 'google';
    const day = event.date.getDate();
    const month = event.date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
    const time = event.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (isGoogle) {
        const gEvent = event.originalData as GoogleEvent;
        return (
            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-gray-100 dark:border-white/10 flex mb-4 transition-all hover:bg-white/60 dark:hover:bg-white/10 group">
                <div className="flex w-full">
                    <div className="flex flex-col items-center justify-center px-5 border-r border-gray-100 dark:border-white/10 min-w-[80px] opacity-60">
                        <span className="text-xs font-bold text-gray-400">{month}</span>
                        <span className="text-2xl font-black text-up-dark dark:text-white">{day}</span>
                    </div>
                    <div className="flex-1 p-4 flex justify-between items-center">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-white dark:bg-up-deep px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/10 text-[10px] font-black text-gray-400 flex items-center gap-1">
                                    <GoogleIcon /> GOOGLE AGENDA
                                </span>
                                <div className="flex items-center text-xs text-gray-400 font-bold">
                                    <Clock size={12} className="mr-1" /> {time}
                                </div>
                            </div>
                            <h3 className="font-bold text-up-dark dark:text-white text-base">{event.title}</h3>
                            {event.location && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Globe size={12} /> {event.location}
                                </p>
                            )}
                        </div>
                        <div className="pr-4">
                            <a href={gEvent.htmlLink} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-up-accent transition-all">
                                <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const lead = event.originalData as Lead;
    return (
        <div className="bg-white dark:bg-up-deep rounded-2xl p-1 border-l-4 border-l-up-accent border-y border-r border-gray-100 dark:border-white/10 shadow-sm flex mb-4 transition-all hover:shadow-md group">
            <div className="flex w-full">
                <div className="flex flex-col items-center justify-center px-5 border-r border-gray-100 dark:border-white/10 min-w-[80px]">
                    <span className="text-xs font-bold text-gray-400">{month}</span>
                    <span className="text-2xl font-black text-up-dark dark:text-white">{day}</span>
                </div>
                <div className="flex-1 p-4 flex justify-between items-center">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-up-accent/10 text-up-accent px-2 py-0.5 rounded-md text-[10px] font-black uppercase border border-up-accent/20">
                                FOLLOW-UP CRM
                            </span>
                            <div className="flex items-center text-xs text-gray-400 font-bold">
                                <Clock size={12} className="mr-1" /> {time}
                            </div>
                        </div>
                        <h3 className="font-black text-up-dark dark:text-white text-lg">{lead.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Building size={12} /> {lead.source}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 pr-2">
                         <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 transition-all hover:bg-green-100 dark:hover:bg-green-500/20 hover:scale-110 shadow-sm">
                            <WhatsAppLogo />
                        </a>
                        <ChevronRight size={20} className="text-gray-300 group-hover:text-up-accent transition-colors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Agenda = () => {
    const [unifiedEvents, setUnifiedEvents] = useState<UnifiedEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { currentTenant } = useAuth();
    const navigate = useNavigate();

    const fetchAllEvents = async () => {
        setIsRefreshing(true);
        const crmLeads = await db.getAgendaItems();
        const connected = googleCalendar.isConnected();
        setIsGoogleConnected(connected);
        
        let googleEvents: GoogleEvent[] = [];
        if (connected) {
            googleEvents = await googleCalendar.fetchEvents();
        }

        const unified: UnifiedEvent[] = [
            ...crmLeads.map(l => ({
                id: `crm-${l.id}`,
                type: 'crm' as const,
                title: l.name,
                date: new Date(l.nextFollowUp!),
                originalData: l
            })),
            ...googleEvents.map(g => ({
                id: `google-${g.id}`,
                type: 'google' as const,
                title: g.summary,
                date: new Date(g.start.dateTime || g.start.date!),
                location: g.location,
                originalData: g
            }))
        ];

        unified.sort((a, b) => a.date.getTime() - b.date.getTime());
        setUnifiedEvents(unified);
        setLoading(false);
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchAllEvents();
    }, [currentTenant]);

    const handleConnectGoogle = async () => {
        if (!currentTenant?.googleClientId) {
            if (confirm('Você ainda não configurou seu Google Client ID. Deseja ir para as configurações agora?')) {
                navigate('/settings');
            }
            return;
        }

        try {
            await googleCalendar.requestToken(currentTenant.googleClientId);
            fetchAllEvents();
        } catch (e) {
            alert('Erro ao conectar. Verifique se o seu Client ID está correto.');
        }
    };

    const handleDisconnectGoogle = () => {
        googleCalendar.logout();
        setIsGoogleConnected(false);
        fetchAllEvents();
    };

    if (loading) return <div className="p-8 flex justify-center"><RefreshCw size={40} className="animate-spin text-up-accent" /></div>;

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <div className="flex items-center gap-3 text-up-dark dark:text-white mb-2">
                        <div className="w-12 h-12 bg-up-dark dark:bg-up-deep rounded-2xl flex items-center justify-center text-up-accent shadow-lg">
                            <CalendarDays size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">Agenda</h1>
                            <p className="text-gray-500 text-sm">Follow-ups do CRM + Eventos do Google.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isGoogleConnected ? (
                        <button 
                            onClick={handleDisconnectGoogle} 
                            className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                        >
                            <LogOut size={14} /> Desconectar Google
                        </button>
                    ) : (
                        <button 
                            onClick={handleConnectGoogle}
                            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-sm
                                ${!currentTenant?.googleClientId 
                                    ? 'bg-gray-100 text-gray-400 border border-dashed border-gray-300' 
                                    : 'bg-white dark:bg-up-deep border border-gray-200 dark:border-white/10 text-up-dark dark:text-white hover:border-blue-500'
                                }
                            `}
                        >
                            <GoogleIcon /> {!currentTenant?.googleClientId ? 'Configurar Client ID' : 'Conectar Google'}
                        </button>
                    )}
                    <button 
                        onClick={fetchAllEvents}
                        disabled={isRefreshing}
                        className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-2xl text-gray-400 hover:text-up-accent transition-all"
                    >
                        <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="space-y-12">
                {unifiedEvents.length > 0 ? (
                    ['Hoje', 'Próximos Dias'].map((section, idx) => {
                        const now = new Date();
                        now.setHours(0,0,0,0);
                        const tomorrow = new Date(now);
                        tomorrow.setDate(now.getDate() + 1);

                        const sectionEvents = unifiedEvents.filter(e => {
                            if (idx === 0) return e.date >= now && e.date < tomorrow;
                            return e.date >= tomorrow;
                        });

                        if (sectionEvents.length === 0) return null;

                        return (
                            <section key={section}>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200 dark:to-white/10"></div>
                                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">{section}</h2>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200 dark:to-white/10"></div>
                                </div>
                                <div className="space-y-2">
                                    {sectionEvents.map(event => (
                                        <UnifiedEventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </section>
                        );
                    })
                ) : (
                    <div className="text-center py-32 bg-gray-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                        <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-black text-up-dark dark:text-white uppercase tracking-tight">Nada agendado</h3>
                        <p className="text-sm text-gray-500 mt-2">Sua agenda está livre para novos negócios!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Agenda;
