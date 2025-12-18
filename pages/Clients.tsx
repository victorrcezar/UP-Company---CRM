
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { Client } from '../types';
import { Search, Handshake, DollarSign, Clock, MoreHorizontal, Mail, TrendingUp, Users, UserPlus, AlertTriangle, CalendarCheck, Trash2, RefreshCw, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ClientDetailsModal from '../components/clients/ClientDetailsModal';
import ClientModal from '../components/clients/ClientModal';

const WhatsAppLogo = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive' | 'Churn'>('Active');
  const [loading, setLoading] = useState(true);
  
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const { currentTenant } = useAuth();

  useEffect(() => {
    fetchClients();
  }, [currentTenant]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await db.getClients();
      setClients(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = clients;
    if (statusFilter !== 'All') result = result.filter(c => c.status === statusFilter);
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.email.toLowerCase().includes(q) || 
            c.phone.includes(q)
        );
    }
    setFilteredClients(result);
  }, [clients, searchQuery, statusFilter]);

  const handleDeleteClient = async (e: React.MouseEvent, id: string, name: string) => {
      e.preventDefault();
      e.stopPropagation(); // Impede abrir o modal de detalhes
      
      const confirmed = window.confirm(`ATENÇÃO: Deseja excluir permanentemente o cliente "${name}"?`);
      
      if (confirmed) {
          const prevClients = [...clients];
          // Atualização Otimista
          setClients(prev => prev.filter(c => c.id !== id));
          
          try {
              await db.deleteClient(id);
          } catch (error) {
              console.error("Erro ao deletar cliente:", error);
              setClients(prevClients); // Reverte se falhar
              alert("Erro ao excluir no banco de dados.");
          }
      }
  };

  const handleEditClient = (e: React.MouseEvent, client: Client) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingClient(client);
      setIsClientModalOpen(true);
  };

  const handleCreateNew = () => {
      setEditingClient(null);
      setIsClientModalOpen(true);
  };

  const handleSaveSuccess = () => {
      setIsClientModalOpen(false);
      setEditingClient(null);
      fetchClients();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 border border-green-200">Ativo</span>;
      case 'Inactive': return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-500 border border-gray-200">Inativo</span>;
      case 'Churn': return <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700 border border-red-200">Cancelado</span>;
      default: return null;
    }
  };

  // KPI Calculations
  const activeClients = clients.filter(c => c.status === 'Active');
  const mrr = activeClients.reduce((acc, c) => acc + (c.contractValue || 0), 0);
  const tcv = activeClients.reduce((acc, c) => acc + ((c.contractValue || 0) * (c.contractDuration || 1)), 0);

  if (loading && clients.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400">
        <RefreshCw size={48} className="animate-spin text-up-accent" />
        <p className="text-xs font-black uppercase tracking-widest">Acessando Nuvem...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-up-dark dark:text-white flex items-center gap-3 uppercase tracking-tight">
              <Handshake className="text-up-accent" size={32} /> Gestão de Clientes
          </h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe seus contratos, tarefas e recorrência.</p>
        </div>
        <button 
            type="button"
            onClick={handleCreateNew}
            className="bg-up-dark text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-opacity-90 shadow-lg shadow-up-dark/20 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest"
        >
            <UserPlus size={18} /> Novo Cliente
        </button>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-up-deep p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-green-600">
                      <TrendingUp size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recorrência Mensal (MRR)</p>
              </div>
              <div>
                  <h3 className="text-3xl font-black text-up-dark dark:text-white">R$ {mrr.toLocaleString('pt-BR')}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Faturamento mensal atual</p>
              </div>
          </div>

          <div className="bg-white dark:bg-up-deep p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600">
                      <Users size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Ativa</p>
              </div>
              <div>
                  <h3 className="text-3xl font-black text-up-dark dark:text-white">{activeClients.length} Clientes</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Contratos em vigor</p>
              </div>
          </div>

          <div className="bg-white dark:bg-up-deep p-6 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between h-40">
              <div className="flex justify-between items-start">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600">
                      <Handshake size={24} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor em Carteira (TCV)</p>
              </div>
              <div>
                  <h3 className="text-3xl font-black text-up-dark dark:text-white">R$ {tcv.toLocaleString('pt-BR')}</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Soma de todos os contratos ativos</p>
              </div>
          </div>
      </div>

      <div className="bg-white dark:bg-up-deep p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-up-accent/20"
              />
          </div>
          <div className="flex gap-1 bg-gray-50 dark:bg-up-dark/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
              {(['All', 'Active', 'Inactive', 'Churn'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${statusFilter === s ? 'bg-up-dark text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                      {s === 'All' ? 'Todos' : s === 'Active' ? 'Ativos' : s === 'Inactive' ? 'Inativos' : 'Churn'}
                  </button>
              ))}
          </div>
      </div>

      <div className="bg-white dark:bg-up-deep rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden relative">
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-up-dark/50 border-b border-gray-100 dark:border-gray-700">
                      <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <th className="px-6 py-4">Cliente / E-mail</th>
                          <th className="px-6 py-4">Recorrência</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {filteredClients.map((client) => (
                          <tr 
                            key={client.id} 
                            onClick={() => { setSelectedClientId(client.id); setIsDetailsOpen(true); }} 
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer"
                          >
                              <td className="px-6 py-5">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-up-dark text-up-accent flex items-center justify-center font-black">
                                          {client.name.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-bold text-up-dark dark:text-white text-sm">{client.name}</p>
                                          <p className="text-[10px] text-gray-500 font-bold uppercase">{client.companyName || client.email}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-5">
                                  <div className="font-black text-up-dark dark:text-white text-sm">
                                      R$ {client.contractValue.toLocaleString('pt-BR')}
                                  </div>
                              </td>
                              <td className="px-6 py-5">
                                  {getStatusBadge(client.status)}
                              </td>
                              <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-end gap-2">
                                      <a 
                                          href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                          title="WhatsApp"
                                          onClick={(e) => e.stopPropagation()}
                                      >
                                          <WhatsAppLogo />
                                      </a>
                                      
                                      <button 
                                          type="button"
                                          onClick={(e) => handleEditClient(e, client)}
                                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                          title="Editar Cliente"
                                      >
                                          <Edit size={20} />
                                      </button>
                                      
                                      <button 
                                          type="button"
                                          onClick={(e) => handleDeleteClient(e, client.id, client.name)}
                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                          title="Excluir"
                                      >
                                          <Trash2 size={20} />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      <ClientDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} clientId={selectedClientId} onUpdate={fetchClients} />
      
      <ClientModal 
        isOpen={isClientModalOpen} 
        onClose={() => { setIsClientModalOpen(false); setEditingClient(null); }} 
        onSaveSuccess={handleSaveSuccess} 
        client={editingClient}
      />
    </div>
  );
};

export default Clients;
