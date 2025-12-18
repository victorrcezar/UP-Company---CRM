import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Lead, Tag, Client } from '../types';
import { Plus, CheckCircle, X, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Imported Components
import LeadFilters from '../components/leads/LeadFilters';
import LeadList from '../components/leads/LeadList';
import LeadModal from '../components/leads/LeadModal';
import TagManagerModal from '../components/leads/TagManagerModal';
import ConvertLeadModal from '../components/leads/ConvertLeadModal';

// Toast Component
const Toast = ({ message, onClose, onAction }: { message: string, onClose: () => void, onAction?: () => void }) => (
  <div className="fixed bottom-6 right-6 z-[60] bg-up-dark text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-4 animate-fade-in border border-gray-700">
    <div className="bg-green-500/20 p-1 rounded-full">
        <CheckCircle size={16} className="text-green-400" />
    </div>
    <span className="text-sm font-medium">{message}</span>
    {onAction && (
      <button 
        onClick={onAction}
        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors font-bold flex items-center gap-1"
      >
        Visualizar
      </button>
    )}
    <button onClick={onClose} className="text-gray-400 hover:text-white ml-2">
      <X size={14} />
    </button>
  </div>
);

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [systemTags, setSystemTags] = useState<Tag[]>([]); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean, message: string, leadId?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [showClosed, setShowClosed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Conversion State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { currentTenant } = useAuth();

  useEffect(() => {
    fetchLeads();
    fetchSystemTags();
  }, [currentTenant]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await db.getLeads();
      setLeads(data);
    } catch (error) {
      console.error("Erro ao carregar leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemTags = async () => {
      const tags = await db.getTags();
      setSystemTags(tags);
  };

  useEffect(() => {
    let result = leads;
    if (!showClosed) {
        result = result.filter(l => l.status !== 'Closed');
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(lower) || 
        l.email.toLowerCase().includes(lower) || 
        l.phone.includes(lower)
      );
    }
    if (selectedTags.length > 0) {
      result = result.filter(l => 
        l.tags.some(t => selectedTags.includes(t.name))
      );
    }
    if (selectedStatuses.length > 0) {
      result = result.filter(l => selectedStatuses.includes(l.status));
    }
    setFilteredLeads(result);
  }, [leads, searchQuery, selectedTags, selectedStatuses, showClosed]);

  useEffect(() => {
    if (location.state) {
        if (location.state.leadId) {
            setEditingLeadId(location.state.leadId);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        } else if (location.state.openCreateModal) {
            setEditingLeadId(null);
            setIsModalOpen(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }
  }, [location.state, navigate]);

  const handleSaveSuccess = (savedLead: Lead) => {
      setIsModalOpen(false);
      fetchLeads();
      if (!editingLeadId) {
          setToast({
              show: true,
              message: `Lead "${savedLead.name}" criado com sucesso!`,
              leadId: savedLead.id
          });
          setTimeout(() => setToast(null), 5000);
      }
  };

  const handleDeleteLead = async (e: React.MouseEvent, id: string, name: string) => {
      // Parar propagação é vital aqui
      e.stopPropagation();
      e.preventDefault();
      
      const confirmed = window.confirm(`Deseja mesmo excluir "${name}"?`);
      
      if (confirmed) {
          const prevLeads = [...leads];
          // Atualização Otimista
          setLeads(prev => prev.filter(l => l.id !== id));
          
          try {
              await db.deleteLead(id);
              setToast({ show: true, message: "Lead removido com sucesso." });
              setTimeout(() => setToast(null), 3000);
          } catch (err) {
              console.error(err);
              setLeads(prevLeads); // Reverte se falhar
              alert("Erro ao excluir lead no banco de dados.");
          }
      }
  };

  const handleOpenConvert = (lead: Lead) => {
      setLeadToConvert(lead);
      setIsConvertModalOpen(true);
  };

  const handleConfirmConversion = async (clientData: Omit<Client, 'id' | 'tenantId'>) => {
      if (!leadToConvert) return;
      await db.addClient(clientData);
      await db.updateLead(leadToConvert.id, { status: 'Closed' });
      setIsConvertModalOpen(false);
      fetchLeads();
      setToast({
          show: true,
          message: `${clientData.name} agora é oficialmente um Cliente!`,
      });
      setTimeout(() => setToast(null), 5000);
  };

  const toggleStatus = (status: string) => {
      setSelectedStatuses(prev => prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]);
  };
  const toggleTag = (tag: string) => {
      setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  return (
    <div className="animate-fade-in relative">
      {toast && toast.show && (
          <Toast 
            message={toast.message} 
            onClose={() => setToast(null)} 
            onAction={toast.leadId ? () => { setEditingLeadId(toast.leadId!); setIsModalOpen(true); setToast(null); } : undefined} 
          />
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-up-dark dark:text-white">Gerenciamento de Leads</h1>
          <p className="text-gray-500 text-sm mt-1">Visualize e gerencie seus prospecções ativas.</p>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowClosed(!showClosed)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${showClosed ? 'bg-up-accent/10 border-up-accent text-up-accent' : 'bg-white dark:bg-up-deep border-gray-200 dark:border-gray-700 text-gray-500'}`}
            >
                {showClosed ? <Eye size={18} /> : <EyeOff size={18} />}
                {showClosed ? 'Ocultar Concluídos' : 'Exibir Concluídos'}
            </button>
            <button 
                onClick={() => { setEditingLeadId(null); setIsModalOpen(true); }}
                className="bg-up-dark text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-opacity-90 shadow-lg shadow-up-dark/20 transition-all active:scale-95"
            >
                <Plus size={18} /> Novo Lead
            </button>
        </div>
      </div>

      <LeadFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatuses={selectedStatuses}
        toggleStatus={toggleStatus}
        resetStatuses={() => setSelectedStatuses([])}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        resetTags={() => setSelectedTags([])}
        systemTags={systemTags}
        onOpenTagManager={() => setIsTagManagerOpen(true)}
      />

      {loading && leads.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-400">
          <RefreshCw size={40} className="animate-spin text-up-accent" />
          <p className="text-xs font-black uppercase tracking-widest">Sincronizando Banco de Dados...</p>
        </div>
      ) : (
        <LeadList 
          leads={filteredLeads}
          onEditLead={(lead) => { setEditingLeadId(lead.id); setIsModalOpen(true); }}
          onDeleteLead={handleDeleteLead}
          onConvertLead={handleOpenConvert}
        />
      )}

      <LeadModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadId={editingLeadId}
        onSaveSuccess={handleSaveSuccess}
      />

      <ConvertLeadModal 
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        lead={leadToConvert}
        onConfirm={handleConfirmConversion}
      />

      <TagManagerModal 
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        systemTags={systemTags}
        onTagsUpdated={(tags) => { setSystemTags(tags); fetchLeads(); }}
      />
    </div>
  );
};

export default Leads;