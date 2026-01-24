
import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Client } from '../../types';
import { X, UserPlus, DollarSign, Calendar, Clock, CheckCircle2, Building, Mail, Phone, Pencil, Repeat, Briefcase } from 'lucide-react';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    client?: Client | null;
}

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

const ClientModal: React.FC<ClientModalProps> = ({ isOpen, onClose, onSaveSuccess, client }) => {
    const [contractModel, setContractModel] = useState<'Recurring' | 'OneOff'>('Recurring');
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        contractValue: 0,
        contractStartDate: new Date().toISOString().split('T')[0],
        contractDuration: 12,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (client) {
                setContractModel(client.contractModel || 'Recurring');
                setFormData({
                    name: client.name,
                    companyName: client.companyName || '',
                    email: client.email,
                    phone: client.phone,
                    contractValue: client.contractValue,
                    contractStartDate: client.contractStartDate ? client.contractStartDate.split('T')[0] : new Date().toISOString().split('T')[0],
                    contractDuration: client.contractDuration || 12,
                    notes: client.notes || ''
                });
            } else {
                setContractModel('Recurring');
                setFormData({
                    name: '',
                    companyName: '',
                    email: '',
                    phone: '',
                    contractValue: 0,
                    contractStartDate: new Date().toISOString().split('T')[0],
                    contractDuration: 12,
                    notes: ''
                });
            }
        }
    }, [isOpen, client]);

    if (!isOpen) return null;

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.name.trim()) {
            setError('O nome do cliente é obrigatório.');
            return;
        }
        if (!formData.phone.trim()) {
            setError('O Telefone/WhatsApp é obrigatório para o cadastro.');
            return;
        }

        setLoading(true);
        try {
            if (client) {
                await db.updateClient(client.id, { ...formData, contractModel: contractModel });
            } else {
                await db.addClient({
                    ...formData,
                    status: 'Active',
                    contractModel: contractModel,
                    healthScore: 100,
                    tasks: [
                        { id: 'm1', title: 'Revisão de contrato migrado', completed: false, priority: 'Normal', subtasks: [] },
                        { id: 'm2', title: 'Validar dados de faturamento', completed: false, priority: 'High', subtasks: [] }
                    ],
                    activities: [
                        { 
                            id: 'a1', 
                            type: 'system_alert', 
                            content: `Cadastro manual realizado (${contractModel === 'Recurring' ? 'Assinatura' : 'Único'}).`, 
                            timestamp: new Date().toISOString(), 
                            user: 'Admin' 
                        }
                    ]
                });
            }
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            setError('Ocorreu um erro ao salvar o cliente. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-0 md:p-6 animate-fade-in">
            <form 
                onSubmit={handleSubmit}
                className="bg-white dark:bg-[#0A1F2E] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl rounded-none md:rounded-[2.5rem] shadow-2xl flex flex-col animate-scale-up border-0 md:border border-white/10 overflow-hidden relative"
            >
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-[#0A1F2E] shrink-0 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-blue-500/20">
                            {client ? <Pencil size={20} /> : <UserPlus size={20} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                {client ? 'Editar Cliente' : 'Novo Cliente'}
                            </h2>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">
                                {client ? 'Atualize os dados da conta' : 'Cadastro manual de contrato'}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2.5 text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-[#F8FAFC] dark:bg-[#020617]">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm font-bold animate-fade-in flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Responsável Principal <span className="text-red-500">*</span></label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    placeholder="Nome Completo"
                                />
                                <UserPlus size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Contato (WhatsApp) <span className="text-red-500">*</span></label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    placeholder="(11) 99999-9999"
                                />
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">E-mail Corporativo</label>
                            <div className="relative group">
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    placeholder="email@empresa.com"
                                />
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2 space-y-2">
                             <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Empresa / Razão Social</label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    placeholder="Nome da Empresa"
                                />
                                <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-white/5">
                        <div className="flex justify-between items-center">
                             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Termos Contratuais</h3>
                             <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setContractModel('Recurring')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-2 transition-all ${contractModel === 'Recurring' ? 'bg-white dark:bg-[#0A1F2E] shadow-sm text-blue-600 dark:text-white ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Repeat size={14} /> Assinatura
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setContractModel('OneOff'); setFormData(prev => ({ ...prev, contractDuration: 1 })); }}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide flex items-center gap-2 transition-all ${contractModel === 'OneOff' ? 'bg-white dark:bg-[#0A1F2E] shadow-sm text-blue-600 dark:text-white ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Briefcase size={14} /> Único
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">
                                    {contractModel === 'Recurring' ? 'Valor Mensal (MRR)' : 'Valor do Projeto/Venda'}
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="number" 
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({...formData, contractValue: Number(e.target.value)})}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    />
                                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                                </div>
                            </div>

                            {contractModel === 'Recurring' ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Fidelidade (Meses)</label>
                                        <div className="flex gap-1">
                                            {[3, 6, 12].map(months => (
                                                <button
                                                    key={months}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, contractDuration: months})}
                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border transition-all ${formData.contractDuration === months ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-transparent text-slate-400 border-slate-200 hover:border-slate-300'}`}
                                                >
                                                    {months}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative group">
                                        <input 
                                            type="number"
                                            min="1"
                                            value={formData.contractDuration}
                                            onChange={(e) => setFormData({...formData, contractDuration: Number(e.target.value)})}
                                            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white"
                                        />
                                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none uppercase">Meses</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 opacity-50 pointer-events-none">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Duração</label>
                                    <div className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-400">
                                        Pontual (1 Mês)
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">
                                    {contractModel === 'Recurring' ? 'Início do Faturamento' : 'Data da Venda'}
                                </label>
                                <div className="relative group">
                                    <input 
                                        type="date" 
                                        value={formData.contractStartDate}
                                        onChange={(e) => setFormData({...formData, contractStartDate: e.target.value})}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    />
                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-white/50 dark:bg-[#0A1F2E] shrink-0 backdrop-blur-md">
                    <button type="button" onClick={onClose} className="px-6 py-3.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all">Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-8 py-3.5 text-xs font-black text-white bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95 flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : <><CheckCircle2 size={18} /> {client ? 'Salvar Alterações' : 'Confirmar Cadastro'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClientModal;
