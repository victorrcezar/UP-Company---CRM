
import React, { useState, useEffect } from 'react';
import { User, Bell, Users, Link as LinkIcon, Shield, Save, Camera, Mail, Phone, Building, Globe, Check, AlertCircle, MessageCircle, Calendar, Upload, Plus, ExternalLink, Zap, Info, Play, RefreshCw, Key, ShieldCheck, X, Pencil, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { googleSync } from '../services/googleSync';
import { db } from '../services/mockDb';

const IntegrationsSettings = () => {
    const { currentTenant, updateTenantProfile } = useAuth();
    const [scriptUrl, setScriptUrl] = useState(currentTenant?.googleScriptUrl || '');
    const [clientId, setClientId] = useState(currentTenant?.googleClientId || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        setScriptUrl(currentTenant?.googleScriptUrl || '');
        setClientId(currentTenant?.googleClientId || '');
    }, [currentTenant]);

    const handleSaveSettings = async () => {
        if (!currentTenant) return;
        setIsSaving(true);
        await updateTenantProfile({ 
            googleScriptUrl: scriptUrl,
            googleClientId: clientId
        });
        setIsSaving(false);
    };

    const handleTestSync = async () => {
        setIsTesting(true);
        setTestResult(null);
        const success = await googleSync.testConnection(scriptUrl);
        setTimeout(() => {
            setTestResult(success ? 'success' : 'error');
            setIsTesting(false);
        }, 1500);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Seção Agenda - Escrita (Script) */}
            <div className="bg-white dark:bg-up-deep border border-gray-200 dark:border-gray-700 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-blue-50/30 dark:bg-blue-900/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Zap size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-up-dark dark:text-white uppercase tracking-tight">1. Enviar Follow-ups para Agenda</h4>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">Sincronização Automática</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL do Google Apps Script</label>
                        <input 
                            type="text" 
                            value={scriptUrl}
                            onChange={(e) => setScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/.../exec"
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-up-dark/80 border border-gray-200 dark:border-gray-600 rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-up-dark/40 rounded-xl">
                        <p className="text-xs text-gray-500">Testar se a URL está recebendo dados:</p>
                        <button 
                            onClick={handleTestSync}
                            className="text-[10px] font-black uppercase text-blue-500 hover:underline"
                        >
                            {isTesting ? 'Sincronizando...' : 'Enviar Evento de Teste'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Seção Agenda - Leitura (OAuth) */}
            <div className="bg-white dark:bg-up-deep border border-gray-200 dark:border-gray-700 rounded-[2rem] overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-purple-50/30 dark:bg-purple-900/10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                            <Key size={24} />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-up-dark dark:text-white uppercase tracking-tight">2. Ver Agenda Google no CRM</h4>
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase">Integração OAuth 2.0</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Google Client ID (Web Application)</label>
                        <input 
                            type="text" 
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            placeholder="123456789-abc.apps.googleusercontent.com"
                            className="w-full px-5 py-4 bg-gray-50 dark:bg-up-dark/80 border border-gray-200 dark:border-gray-600 rounded-2xl text-xs font-mono outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                        />
                    </div>

                    <div className="p-6 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl space-y-3">
                        <p className="text-xs font-bold text-purple-800 dark:text-purple-400 flex items-center gap-2">
                            <Info size={16} /> Como obter esse ID?
                        </p>
                        <ol className="text-[11px] text-purple-700/80 dark:text-purple-400/60 list-decimal ml-4 space-y-1">
                            <li>Acesse o <b>Google Cloud Console</b>.</li>
                            <li>Vá em <b>APIs e Serviços &gt; Credenciais</b>.</li>
                            <li>Clique em <b>Criar Credenciais &gt; ID do cliente OAuth</b>.</li>
                            <li>Tipo de aplicativo: <b>Aplicativo da Web</b>.</li>
                            <li>Em "Origens JavaScript autorizadas", adicione a URL deste CRM.</li>
                            <li>Copie o <b>ID do cliente</b> e cole acima.</li>
                        </ol>
                    </div>
                </div>
            </div>

            <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full bg-up-dark text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-3"
            >
                {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
                Salvar Configurações de Integração
            </button>
        </div>
    );
};

const ProfileSettings = () => {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
        setName(user.name);
        setEmail(user.email);
    }
  }, [user]);

  const handleSaveProfile = async () => {
      if (!name || !email) return;
      setIsSaving(true);
      
      // Simular um pequeno delay de rede
      await new Promise(r => setTimeout(r, 600));

      await updateUserProfile({ name, email });
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative group mx-auto md:mx-0">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-up-deep to-up-dark flex items-center justify-center text-white text-3xl font-bold shadow-2xl ring-4 ring-white dark:ring-slate-700">
                    {name.charAt(0)}
                </div>
                <button className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-up-dark border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg text-gray-500 hover:text-up-accent hover:scale-110 transition-all">
                    <Camera size={18} />
                </button>
            </div>
            
            <div className="flex-1 w-full space-y-6">
                 <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl flex items-start gap-3">
                    <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Edição de Perfil</p>
                        <p className="text-xs text-blue-600/80 dark:text-blue-400/70 mt-1">Alterações aqui refletem em todo o sistema e nas notificações enviadas.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase ml-1">Nome Completo</label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
                                placeholder="Seu Nome"
                            />
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase ml-1">E-mail</label>
                        <div className="relative">
                            <input 
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
                                placeholder="seu@email.com"
                            />
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg
                            ${showSuccess 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-up-dark text-white hover:bg-up-accent hover:text-up-dark'
                            }
                            ${isSaving ? 'opacity-70 cursor-wait' : ''}
                        `}
                    >
                        {isSaving ? (
                            <RefreshCw size={16} className="animate-spin" />
                        ) : showSuccess ? (
                            <Check size={16} />
                        ) : (
                            <Save size={16} />
                        )}
                        {isSaving ? 'Salvando...' : showSuccess ? 'Salvo!' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

const NotificationSettings = () => {
    const [prefs, setPrefs] = useState({ email: true, whatsapp: true });
    const Toggle = ({ checked, onChange }: any) => (
        <button onClick={onChange} className={`w-11 h-6 rounded-full relative transition-colors ${checked ? 'bg-up-dark' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></span>
        </button>
    );
    return (
        <div className="space-y-6">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <div className="py-4 flex items-center justify-between">
                    <div><h4 className="text-sm font-bold dark:text-white">Notificações por E-mail</h4><p className="text-xs text-gray-500">Alertas de novos leads.</p></div>
                    <Toggle checked={prefs.email} onChange={() => setPrefs({...prefs, email: !prefs.email})} />
                </div>
                <div className="py-4 flex items-center justify-between">
                    <div><h4 className="text-sm font-bold dark:text-white">Alertas de WhatsApp</h4><p className="text-xs text-gray-500">Sincronização de conversas.</p></div>
                    <Toggle checked={prefs.whatsapp} onChange={() => setPrefs({...prefs, whatsapp: !prefs.whatsapp})} />
                </div>
            </div>
        </div>
    );
};

const TeamSettings = () => {
    const { user, availableTenants, createClient, updateSystemClient, deleteSystemClient } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
    
    // Form States
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formCompany, setFormCompany] = useState('');
    const [formCategory, setFormCategory] = useState('Outros');
    const [isLoading, setIsLoading] = useState(false);

    if (user?.role !== 'super_admin') {
        return <div className="p-8 text-center text-gray-400 text-sm">Gerenciamento de membros disponível no plano corporativo.</div>;
    }

    const openCreate = () => {
        setEditingTenantId(null);
        setFormName('');
        setFormEmail('');
        setFormCompany('');
        setFormCategory('Outros');
        setIsModalOpen(true);
    };

    const openEdit = async (tenantId: string) => {
        setIsLoading(true);
        setEditingTenantId(tenantId);
        
        // Reset form first
        setFormCompany('');
        setFormCategory('Outros');
        setFormName('');
        setFormEmail('');

        try {
            // Find Tenant info
            const tenant = availableTenants.find(t => t.id === tenantId);
            if (tenant) {
                setFormCompany(tenant.name);
                setFormCategory(tenant.category);
                
                // Find Admin info
                const admin = await db.getTenantAdmin(tenantId);
                if (admin) {
                    setFormName(admin.name);
                    setFormEmail(admin.email);
                }
            }
        } catch (error) {
            console.error("Error fetching tenant details:", error);
        } finally {
            setIsLoading(false);
            setIsModalOpen(true);
        }
    };

    const handleDelete = async (tenantId: string, tenantName: string) => {
        if (tenantId === 'up-admin') {
            alert('O ambiente principal do sistema não pode ser excluído.');
            return;
        }
        
        if (window.confirm(`Tem certeza que deseja EXCLUIR DEFINITIVAMENTE o cliente "${tenantName}"? Esta ação removerá todos os dados, leads e usuários associados.`)) {
            try {
                await deleteSystemClient(tenantId);
            } catch (error) {
                alert('Erro ao excluir cliente.');
                console.error(error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (editingTenantId) {
                // UPDATE
                await updateSystemClient(editingTenantId, {
                    name: formCompany,
                    category: formCategory,
                    adminName: formName, 
                    adminEmail: formEmail
                });
                alert('Dados atualizados com sucesso!');
            } else {
                // CREATE
                await createClient({
                    name: formName,
                    email: formEmail,
                    companyName: formCompany,
                    category: formCategory
                });
                alert('Novo cliente e ambiente criados com sucesso!');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert('Ocorreu um erro ao salvar.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h3 className="text-lg font-black text-up-dark dark:text-white">Gestão de Clientes</h3>
                    <p className="text-xs text-gray-500">Administre o acesso dos seus clientes ao CRM.</p>
                </div>
                <button 
                    onClick={openCreate}
                    className="bg-up-dark text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-up-accent hover:text-up-dark transition-all flex items-center gap-2"
                >
                    <Plus size={16} /> Novo Cliente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTenants.map(tenant => (
                    <div key={tenant.id} className="bg-gray-50 dark:bg-up-dark/30 border border-gray-100 dark:border-gray-700 p-5 rounded-2xl flex items-center gap-4 hover:border-blue-200 transition-colors group">
                        <div className="w-12 h-12 bg-white dark:bg-up-deep rounded-xl flex items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm shrink-0">
                            {tenant.logoUrl ? <img src={tenant.logoUrl} className="w-8 h-8 object-contain" alt={tenant.name} /> : <Building size={20} className="text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-up-dark dark:text-white truncate">{tenant.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md font-medium">{tenant.id}</span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold">{tenant.category}</span>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => openEdit(tenant.id)}
                                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Editar"
                            >
                                <Edit size={18} />
                            </button>
                            {tenant.id !== 'up-admin' && (
                                <button 
                                    onClick={() => handleDelete(tenant.id, tenant.name)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Excluir Cliente e Dados"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Criação/Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-up-deep w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-up-dark dark:text-white uppercase tracking-tight">
                                {editingTenantId ? `Editando: ${formCompany}` : 'Novo Ambiente'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        
                        {isLoading && !formCompany && editingTenantId ? (
                            <div className="py-10 flex justify-center"><RefreshCw className="animate-spin text-up-accent" size={30} /></div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nome da Empresa</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={formCompany}
                                        onChange={(e) => setFormCompany(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Ex: Clínica Bem Estar"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Categoria</label>
                                        <select 
                                            value={formCategory}
                                            onChange={(e) => setFormCategory(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none"
                                        >
                                            <option>Saúde</option>
                                            <option>Jurídico</option>
                                            <option>Varejo</option>
                                            <option>Serviços</option>
                                            <option>Tecnologia</option>
                                            <option>Outros</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nome do Gestor</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                            placeholder="Nome Completo"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">E-mail de Acesso (Login)</label>
                                    <input 
                                        type="email" 
                                        required
                                        value={formEmail}
                                        onChange={(e) => setFormEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="gestor@empresa.com"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={isLoading}
                                        className="w-full bg-up-dark text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-up-accent hover:text-up-dark transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <RefreshCw className="animate-spin" /> : <><ShieldCheck size={18} /> {editingTenantId ? 'Salvar Alterações' : 'Criar Acesso e Tenant'}</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const CompanySettings = () => <div className="p-8 text-center text-gray-400 text-sm">Dados da unidade vinculados ao contrato UP!.</div>;

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});
  const { user } = useAuth();

  const tabs = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'team', label: user?.role === 'super_admin' ? 'Gestão de Clientes' : 'Equipe', icon: Users },
    { id: 'integrations', label: 'Integrações', icon: LinkIcon },
    { id: 'company', label: 'Empresa', icon: Building },
  ];

  const handleGlobalSave = () => {
      // Esta função agora é mais um feedback visual global, 
      // pois as seções (Perfil, Integrações) têm seus próprios botões de salvar para garantir atomicidade.
      setToast({ show: true, msg: 'As configurações foram salvas.' });
      setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const renderContent = () => {
      switch(activeTab) {
          case 'profile': return <ProfileSettings />;
          case 'notifications': return <NotificationSettings />;
          case 'team': return <TeamSettings />;
          case 'integrations': return <IntegrationsSettings />;
          case 'company': return <CompanySettings />;
          default: return <ProfileSettings />;
      }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto relative pb-20">
        {toast.show && (
            <div className="fixed bottom-6 right-6 z-[60] bg-up-dark text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in border border-gray-700">
                <Check size={18} className="text-green-400" />
                <span className="text-sm font-bold">{toast.msg}</span>
            </div>
        )}

        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-2xl font-black text-up-dark dark:text-white uppercase tracking-tight">Configurações</h1>
                <p className="text-gray-500 text-sm mt-1">Personalize sua experiência no UP! CRM.</p>
            </div>
            <button 
                onClick={handleGlobalSave}
                className="bg-up-dark text-white px-6 py-2.5 rounded-xl text-sm font-black hover:bg-opacity-90 shadow-lg transition-all active:scale-95"
            >
                Salvar Alterações
            </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-white dark:bg-up-deep rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-24">
                    <nav className="flex flex-col p-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 text-left
                                    ${isActive 
                                        ? 'bg-up-dark text-white shadow-lg' 
                                        : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-up-accent' : 'text-gray-400'} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <div className="flex-1">
                <div className="bg-white dark:bg-up-deep rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-h-[500px]">
                    <div className="mb-8 pb-4 border-b border-gray-50 dark:border-gray-700">
                        <h2 className="text-xl font-black text-up-dark dark:text-white uppercase tracking-tight">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                    </div>
                    {renderContent()}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Settings;
