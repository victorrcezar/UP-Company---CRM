
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Lead, LeadStatus, Client } from '../types';
import { Plus, DollarSign, AlertTriangle, Edit, Clock, Search, ChevronRight, UserCheck, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ConvertLeadModal from '../components/leads/ConvertLeadModal';

const PIPELINE_COLUMNS: { id: LeadStatus; title: string; color: string; barColor: string }[] = [
  { id: 'New', title: 'Novo Lead', color: 'bg-blue-500/10 text-blue-500', barColor: 'bg-blue-500' },
  { id: 'Contacted', title: 'Contatado', color: 'bg-purple-500/10 text-purple-500', barColor: 'bg-purple-500' },
  { id: 'Discussion', title: 'Em Negociação', color: 'bg-yellow-500/10 text-yellow-500', barColor: 'bg-yellow-500' },
  { id: 'Interested', title: 'Interessado', color: 'bg-orange-500/10 text-orange-500', barColor: 'bg-orange-500' },
  { id: 'Qualified', title: 'Proposta', color: 'bg-teal-500/10 text-teal-500', barColor: 'bg-teal-500' },
  { id: 'Closed', title: 'Venda', color: 'bg-green-500/10 text-green-500', barColor: 'bg-green-500' },
];

const WhatsAppLogo = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const getDaysSince = (dateString: string) => {
  const diff = new Date().getTime() - new Date(dateString).getTime();
  return Math.floor(diff / (1000 * 3600 * 24));
};

const Pipeline = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<LeadStatus | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentTenant } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadLeads(); }, [currentTenant]);

  const loadLeads = async () => {
    setLoading(true);
    const data = await db.getLeads();
    setLeads(data);
    setLoading(false);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = async (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedLeadId) return;
    const lead = leads.find(l => l.id === draggedLeadId);
    if (!lead) return;
    if (status === 'Closed') {
        setLeadToConvert(lead);
        setIsConvertModalOpen(true);
    } else {
        const updatedLeads = leads.map(l => l.id === draggedLeadId ? { ...l, status } : l);
        setLeads(updatedLeads);
        await db.updateLead(draggedLeadId, { status });
    }
    setDraggedLeadId(null);
  };

  const handleConfirmConversion = async (clientData: Omit<Client, 'id' | 'tenantId'>) => {
      if (!leadToConvert) return;
      await db.addClient(clientData);
      await db.updateLead(leadToConvert.id, { status: 'Closed' });
      setIsConvertModalOpen(false);
      loadLeads();
  };

  const filteredLeads = leads.filter(l => 
    !searchQuery || l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100dvh-5rem)] md:h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 px-1">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Fluxo Comercial</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Visualize sua força de vendas por estágios.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                    type="text" 
                    placeholder="Filtrar..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-up-surface border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all md:w-64 dark:text-white"
                />
            </div>
            <button 
                onClick={() => navigate('/leads', { state: { openCreateModal: true } })}
                className="bg-slate-900 dark:bg-up-accent dark:text-white text-white px-6 py-2.5 rounded-xl text-xs font-black hover:opacity-90 transition-all uppercase tracking-widest shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
                <Plus size={14} /> Novo
            </button>
        </div>
      </div>

      {/* Kanban Board Container - Mobile Horizontal Scroll Fix */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
        <div className="flex gap-5 h-full min-w-[1700px] px-1 md:px-0">
          {PIPELINE_COLUMNS.map((col) => {
            const columnLeads = filteredLeads.filter(l => l.status === col.id);
            const totalValue = columnLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);
            const isDragOver = dragOverColumn === col.id;
            
            return (
              <div 
                key={col.id}
                className={`w-[280px] md:w-[320px] flex flex-col bg-slate-100/50 dark:bg-slate-900/20 rounded-[2rem] border transition-all duration-300
                    ${isDragOver 
                        ? 'border-blue-500 ring-4 ring-blue-500/10 scale-[1.01] bg-blue-50/50 dark:bg-blue-900/10' 
                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700/50'
                    }
                `}
                onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.id); }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Header */}
                <div className="p-5 pb-3 sticky top-0 bg-transparent z-10 backdrop-blur-sm rounded-t-[2rem]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${col.barColor} shadow-[0_0_8px_currentColor]`}></span>
                        {col.title}
                    </h3>
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px] font-black text-slate-400 border border-slate-100 dark:border-slate-700">
                      {columnLeads.length}
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-slate-300 tracking-tight mt-3 pb-3 border-b border-slate-200/50 dark:border-slate-700/50 flex justify-between items-end">
                      <span>R$ {totalValue.toLocaleString('pt-BR')}</span>
                      {columnLeads.length > 0 && <div className="h-1 flex-1 mx-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"><div className={`h-full ${col.barColor} opacity-50`} style={{ width: '60%' }}></div></div>}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 px-3 pb-4 overflow-y-auto space-y-3 custom-scrollbar">
                  {loading ? (
                       [1,2].map(i => <div key={i} className="h-32 rounded-[1.5rem] bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />)
                  ) : (
                    columnLeads.map((lead, idx) => {
                        const daysActive = getDaysSince(lead.createdAt);
                        const isStagnant = daysActive > 10 && lead.status !== 'Closed';
                        return (
                            <div
                                key={lead.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, lead.id)}
                                className={`group relative bg-white dark:bg-up-surface p-5 rounded-[1.5rem] shadow-sm border border-slate-100 dark:border-slate-800/50 cursor-grab active:cursor-grabbing transition-all hover:shadow-xl hover:-translate-y-1 hover:border-blue-500/30 animate-scale-up`}
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        #{lead.id.slice(-4)}
                                    </span>
                                    {isStagnant && <AlertTriangle size={14} className="text-orange-500 animate-pulse" title="Parado há mais de 10 dias" />}
                                    <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-5" />
                                </div>
                                
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1 leading-snug pr-4">{lead.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 truncate">{lead.company || lead.source}</p>
                                
                                <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-800/50">
                                    <span className="text-xs font-black text-green-600 dark:text-green-500 tracking-tight">
                                        R$ {(lead.value || 0).toLocaleString('pt-BR', { notation: "compact" })}
                                    </span>
                                    <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${daysActive > 5 ? 'text-red-400' : 'text-slate-400'}`}>
                                        <Clock size={12} /> {daysActive === 0 ? 'Hoje' : `${daysActive}d`}
                                    </div>
                                </div>

                                {/* Hover Actions Overlay */}
                                <div className="absolute inset-0 bg-slate-900/90 dark:bg-black/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 z-10 pointer-events-none group-hover:pointer-events-auto">
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Ações Rápidas</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => navigate('/leads', { state: { leadId: lead.id } })} className="w-10 h-10 rounded-full bg-white text-slate-900 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg" title="Editar">
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => { setLeadToConvert(lead); setIsConvertModalOpen(true); }}
                                            className="w-10 h-10 rounded-full bg-green-500 text-white hover:bg-green-400 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                                            title="Converter Venda"
                                        >
                                            <UserCheck size={16} />
                                        </button>
                                        <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#25D366] text-white hover:bg-[#128C7E] flex items-center justify-center transition-all hover:scale-110 shadow-lg" title="WhatsApp">
                                            <WhatsAppLogo />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConvertLeadModal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} lead={leadToConvert} onConfirm={handleConfirmConversion} />
    </div>
  );
};

export default Pipeline;
