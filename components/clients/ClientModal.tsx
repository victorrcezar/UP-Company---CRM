
import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Client } from '../../types';
import { X, UserPlus, DollarSign, Calendar, Clock, CheckCircle2, Building, Mail, Phone, Pencil, Repeat, Briefcase } from 'lucide-react';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    client?: Client | null; // Prop opcional para edição
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
        contractDuration: 12, // Agora é number
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Efeito para preencher o formulário se estiver editando
    useEffect(() => {
        if (isOpen) {
            if (client) {
                // Modo Edição
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
                // Modo Criação (Limpar campos)
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
                // ATUALIZAR
                await db.updateClient(client.id, {
                    ...formData,
                    contractModel: contractModel
                });
            } else {
                // CRIAR
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in">
            <form 
                onSubmit={handleSubmit}
                className="bg-white dark:bg-up-deep w-full max-w-2xl rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-scale-up border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
                <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-up-dark/20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-up-dark text-up-accent p-2.5 rounded-xl shadow-xl">
                            {client ? <Pencil size={20} /> : <UserPlus size={20} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-up-dark dark:text-white uppercase tracking-tight leading-none">
                                {client ? 'Editar Cliente' : 'Novo Cliente Direto'}
                            </h2>
                            <p className="text-[10px] text-gray-500 font-bold mt-1">
                                {client ? 'Atualize os dados contratuais.' : 'Cadastro manual de contrato.'}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">Nome Completo do Responsável <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    placeholder="Ex: Roberto Meira"
                                />
                                <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">Telefone / WhatsApp <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    placeholder="(11) 99999-9999"
                                />
                                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">E-mail Principal</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    placeholder="roberto@empresa.com"
                                />
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">Empresa / Razão Social</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    placeholder="Ex: Meira e Sá Advogados"
                                />
                                <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 pt-5 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Termos Contratuais</h3>
                             <div className="flex p-1 bg-gray-50 dark:bg-up-dark/50 rounded-lg border border-gray-200 dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => setContractModel('Recurring')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide flex items-center gap-1 transition-all ${contractModel === 'Recurring' ? 'bg-white dark:bg-up-deep shadow-sm text-up-dark dark:text-white' : 'text-gray-400'}`}
                                >
                                    <Repeat size={12} /> Assinatura
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setContractModel('OneOff')}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide flex items-center gap-1 transition-all ${contractModel === 'OneOff' ? 'bg-white dark:bg-up-deep shadow-sm text-up-dark dark:text-white' : 'text-gray-400'}`}
                                >
                                    <Briefcase size={12} /> Único
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">
                                    {contractModel === 'Recurring' ? 'Valor Mensal (MRR)' : 'Valor Único'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({...formData, contractValue: Number(e.target.value)})}
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    />
                                    <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>

                            {contractModel === 'Recurring' ? (
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Fidelidade (Meses)</label>
                                        <div className="flex gap-1">
                                            {[3, 6, 12].map(months => (
                                                <button
                                                    key={months}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, contractDuration: months})}
                                                    className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-all ${formData.contractDuration === months ? 'bg-up-dark text-white border-up-dark' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
                                                >
                                                    {months}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            min="1"
                                            value={formData.contractDuration}
                                            onChange={(e) => setFormData({...formData, contractDuration: Number(e.target.value)})}
                                            className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                        />
                                        <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-up-accent" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none uppercase">Meses</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="opacity-50 pointer-events-none">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">Fidelidade</label>
                                    <div className="w-full px-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-400">
                                        N/A
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">
                                    {contractModel === 'Recurring' ? 'Início do Faturamento' : 'Data da Venda'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.contractStartDate}
                                        onChange={(e) => setFormData({...formData, contractStartDate: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    />
                                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-up-dark/20 shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-8 py-3 text-xs font-black text-up-dark bg-up-accent rounded-xl shadow-xl shadow-up-accent/20 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : <><CheckCircle2 size={18} /> {client ? 'Salvar' : 'Confirmar'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClientModal;
