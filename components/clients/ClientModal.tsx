
import React, { useState, useEffect } from 'react';
import { db } from '../../services/mockDb';
import { Client } from '../../types';
import { X, UserPlus, DollarSign, Calendar, Clock, CheckCircle2, Building, Mail, Phone, Pencil } from 'lucide-react';

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
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        contractValue: 0,
        contractStartDate: new Date().toISOString().split('T')[0],
        contractDuration: 12 as 3 | 6 | 12,
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Efeito para preencher o formulário se estiver editando
    useEffect(() => {
        if (isOpen) {
            if (client) {
                // Modo Edição
                setFormData({
                    name: client.name,
                    companyName: client.companyName || '',
                    email: client.email,
                    phone: client.phone,
                    contractValue: client.contractValue,
                    contractStartDate: client.contractStartDate ? client.contractStartDate.split('T')[0] : new Date().toISOString().split('T')[0],
                    contractDuration: client.contractDuration,
                    notes: client.notes || ''
                });
            } else {
                // Modo Criação (Limpar campos)
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
                    // Mantém os dados que não estão no formulário
                });
            } else {
                // CRIAR
                await db.addClient({
                    ...formData,
                    status: 'Active',
                    healthScore: 100,
                    tasks: [
                        { id: 'm1', title: 'Revisão de contrato migrado', completed: false, priority: 'Normal', subtasks: [] },
                        { id: 'm2', title: 'Validar dados de faturamento', completed: false, priority: 'High', subtasks: [] }
                    ],
                    activities: [
                        { 
                            id: 'a1', 
                            type: 'system_alert', 
                            content: 'Cadastro manual realizado (Migração/Direto).', 
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
                className="bg-white dark:bg-up-deep w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] animate-scale-up border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
                <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-up-dark/20">
                    <div className="flex items-center gap-4">
                        <div className="bg-up-dark text-up-accent p-3 rounded-2xl shadow-xl">
                            {client ? <Pencil size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-up-dark dark:text-white uppercase tracking-tight">
                                {client ? 'Editar Cliente' : 'Novo Cliente Direto'}
                            </h2>
                            <p className="text-xs text-gray-500 font-bold">
                                {client ? 'Atualize os dados contratuais e de contato.' : 'Pule o funil e cadastre o contrato diretamente.'}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Nome Completo do Responsável <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    placeholder="Ex: Roberto Meira"
                                />
                                <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Telefone / WhatsApp <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    placeholder="(11) 99999-9999"
                                />
                                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">E-mail Principal <span className="text-gray-300 font-normal italic">(Opcional)</span></label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    placeholder="roberto@empresa.com"
                                />
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        
                        <div className="md:col-span-2">
                             <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Empresa / Razão Social <span className="text-gray-300 font-normal italic">(Opcional)</span></label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    placeholder="Ex: Meira e Sá Advogados"
                                />
                                <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Termos Contratuais</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Valor da Recorrência (R$)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({...formData, contractValue: Number(e.target.value)})}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    />
                                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Duração do Plano</label>
                                <div className="relative">
                                    <select 
                                        value={formData.contractDuration}
                                        onChange={(e) => setFormData({...formData, contractDuration: Number(e.target.value) as 3 | 6 | 12})}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none appearance-none dark:text-white"
                                    >
                                        <option value={3}>3 Meses</option>
                                        <option value={6}>6 Meses</option>
                                        <option value={12}>12 Meses</option>
                                    </select>
                                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Início do Faturamento / Vigência</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.contractStartDate}
                                        onChange={(e) => setFormData({...formData, contractStartDate: e.target.value})}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none dark:text-white"
                                    />
                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-8 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4 bg-gray-50/50 dark:bg-up-dark/20">
                    <button type="button" onClick={onClose} className="px-8 py-3.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">Cancelar</button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="px-10 py-3.5 text-xs font-black text-up-dark bg-up-accent rounded-2xl shadow-xl shadow-up-accent/20 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest disabled:opacity-50"
                    >
                        {loading ? 'Processando...' : <><CheckCircle2 size={18} /> {client ? 'Salvar Alterações' : 'Salvar Cliente'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClientModal;
