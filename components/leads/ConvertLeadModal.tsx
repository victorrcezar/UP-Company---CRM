
import React, { useState, useEffect } from 'react';
import { Lead, Client, Task } from '../../types';
import { X, UserCheck, ArrowRight, Building, Calendar, DollarSign, FileText, Clock, Sparkles, CheckCircle2, CreditCard } from 'lucide-react';

interface ConvertLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onConfirm: (clientData: Omit<Client, 'id' | 'tenantId'>) => void;
}

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

const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({ isOpen, onClose, lead, onConfirm }) => {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        contractValue: 0,
        contractStartDate: '',
        contractDuration: 12 as 3 | 6 | 12,
        notes: ''
    });

    useEffect(() => {
        if (lead && isOpen) {
            setStep('form');
            setFormData({
                name: lead.name,
                companyName: lead.company || '',
                email: lead.email,
                phone: lead.phone,
                contractValue: lead.value || 0,
                contractStartDate: new Date().toISOString().split('T')[0],
                contractDuration: 12, 
                notes: lead.notes || ''
            });
        }
    }, [lead, isOpen]);

    if (!isOpen || !lead) return null;

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const handleSubmit = () => {
        const clientPayload: Omit<Client, 'id' | 'tenantId'> = {
            ...formData,
            status: 'Active',
            convertedFromLeadId: lead.id,
            healthScore: 100,
            contractStartDate: formData.contractStartDate,
            contractDuration: formData.contractDuration as 3 | 6 | 12,
            tasks: [
                { id: 'ob1', title: 'Enviar kit de boas-vindas', completed: false, priority: 'High', subtasks: [] },
                { id: 'ob2', title: 'Agendar reunião de Kick-off', completed: false, priority: 'Urgent', subtasks: [] },
                { id: 'ob3', title: 'Configurar acessos no sistema', completed: false, priority: 'Normal', subtasks: [] }
            ],
            activities: [
                { 
                    id: 'act1', 
                    type: 'contract_update', 
                    content: `Conversão realizada! Lead originado via ${lead.source}.`, 
                    timestamp: new Date().toISOString(), 
                    user: 'Sistema' 
                }
            ]
        };
        
        onConfirm(clientPayload);
        setStep('success');
    };

    if (step === 'success') {
        return (
            <div className="fixed inset-0 bg-up-dark/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4 animate-fade-in">
                <div className="max-w-md w-full text-center space-y-8 animate-scale-up">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 bg-up-accent rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(56,189,248,0.4)]">
                            <CheckCircle2 size={64} className="text-up-dark" />
                        </div>
                        <div className="absolute -top-4 -right-4 animate-bounce">
                            <Sparkles size={40} className="text-yellow-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white mb-2">PARABÉNS!</h2>
                        <p className="text-blue-200 text-lg font-medium">Você acaba de conquistar um novo cliente.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem]">
                        <p className="text-sm text-gray-400 uppercase font-black tracking-widest mb-1">Nova Receita Gerada</p>
                        <p className="text-3xl font-black text-up-accent">R$ {formData.contractValue.toLocaleString('pt-BR')}/mês</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-white text-up-dark rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-up-accent transition-all"
                    >
                        Continuar Operação
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-up-deep w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] animate-scale-up border border-gray-100 dark:border-gray-700 overflow-hidden">
                
                <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-up-dark/20">
                    <div className="flex items-center gap-4">
                        <div className="bg-up-dark text-up-accent p-3 rounded-2xl shadow-xl shadow-up-dark/10">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-up-dark dark:text-white uppercase tracking-tight">Formalizar Cliente</h2>
                            <p className="text-xs text-gray-500 font-bold">Configure os termos da nova conta ativa.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                    <div className="flex items-center gap-6">
                        <div className="flex-1 p-5 bg-gray-50 dark:bg-up-dark/40 rounded-3xl border border-gray-100 dark:border-gray-700">
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Lead Original</p>
                            <p className="font-bold text-sm text-up-dark dark:text-white">{lead.name}</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">{lead.source}</p>
                        </div>
                        <div className="bg-up-accent/10 p-3 rounded-full text-up-accent">
                            <ArrowRight size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1 p-5 bg-green-500/5 dark:bg-green-500/10 rounded-3xl border border-green-500/20">
                            <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-2">Status da Conta</p>
                            <p className="font-bold text-sm text-green-600 dark:text-green-400">Ativação Imediata</p>
                            <p className="text-[10px] text-green-500/60 font-bold mt-1 uppercase">Pronto para Onboarding</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <CreditCard size={14} className="text-up-accent" /> Configuração Financeira e Contato
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Entidade / Nome da Conta</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Telefone / WhatsApp</label>
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Valor da Recorrência (R$)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({...formData, contractValue: Number(e.target.value)})}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                    />
                                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Fidelidade do Contrato</label>
                                <div className="relative">
                                    <select 
                                        value={formData.contractDuration}
                                        onChange={(e) => setFormData({...formData, contractDuration: Number(e.target.value) as 3 | 6 | 12})}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none appearance-none"
                                    >
                                        <option value={3}>3 Meses (Trimestral)</option>
                                        <option value={6}>6 Meses (Semestral)</option>
                                        <option value={12}>12 Meses (Anual)</option>
                                    </select>
                                    <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-2">Data de Início do Faturamento</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.contractStartDate}
                                        onChange={(e) => setFormData({...formData, contractStartDate: e.target.value})}
                                        className="w-full pl-12 pr-6 py-4 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                    />
                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-up-dark text-white p-6 rounded-[2rem] flex items-start gap-4 shadow-xl">
                        <Sparkles className="text-up-accent shrink-0 mt-1" size={24} />
                        <div>
                            <p className="text-sm font-black uppercase tracking-widest text-up-accent mb-1">Ações Automáticas</p>
                            <p className="text-xs text-blue-100 leading-relaxed">Ao confirmar, o sistema criará automaticamente um **Plano de Onboarding** com 3 tarefas críticas e atualizará seu dashboard de receita.</p>
                        </div>
                    </div>
                </div>

                <div className="px-10 py-8 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4 bg-gray-50/50 dark:bg-up-dark/20">
                    <button onClick={onClose} className="px-8 py-3.5 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all">Desistir</button>
                    <button onClick={handleSubmit} className="px-10 py-3.5 text-xs font-black text-up-dark bg-up-accent rounded-2xl shadow-xl shadow-up-accent/20 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest">
                        <UserCheck size={18} /> Confirmar Venda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConvertLeadModal;
