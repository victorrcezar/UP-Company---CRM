
import React, { useState, useEffect } from 'react';
import { Lead, Client, Task } from '../../types';
import { X, UserCheck, ArrowRight, Building, Calendar, DollarSign, FileText, Clock, Sparkles, CheckCircle2, CreditCard, Repeat, Briefcase } from 'lucide-react';

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
    const [contractModel, setContractModel] = useState<'Recurring' | 'OneOff'>('Recurring');
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        contractValue: 0,
        contractStartDate: '',
        contractDuration: 12, // Agora é number, padrão 12
        notes: ''
    });

    useEffect(() => {
        if (lead && isOpen) {
            setStep('form');
            setContractModel('Recurring');
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
            contractModel: contractModel,
            convertedFromLeadId: lead.id,
            healthScore: 100,
            contractStartDate: formData.contractStartDate,
            contractDuration: formData.contractDuration,
            tasks: [
                { id: 'ob1', title: 'Enviar kit de boas-vindas', completed: false, priority: 'High', subtasks: [] },
                { id: 'ob2', title: 'Agendar reunião de Kick-off', completed: false, priority: 'Urgent', subtasks: [] },
                { id: 'ob3', title: 'Configurar acessos no sistema', completed: false, priority: 'Normal', subtasks: [] }
            ],
            activities: [
                { 
                    id: 'act1', 
                    type: 'contract_update', 
                    content: `Conversão realizada! Lead originado via ${lead.source}. Modelo: ${contractModel === 'Recurring' ? 'Assinatura' : 'Pagamento Único'}.`, 
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
                        <p className="text-sm text-gray-400 uppercase font-black tracking-widest mb-1">
                            {contractModel === 'Recurring' ? 'Nova Receita Recorrente' : 'Receita Única'}
                        </p>
                        <p className="text-3xl font-black text-up-accent">
                            R$ {formData.contractValue.toLocaleString('pt-BR')}
                            {contractModel === 'Recurring' && <span className="text-lg text-white/50">/mês</span>}
                        </p>
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
            <div className="bg-white dark:bg-up-deep w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-scale-up border border-gray-100 dark:border-gray-700 overflow-hidden">
                
                <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-up-dark/20 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-up-dark text-up-accent p-2.5 rounded-xl shadow-xl shadow-up-dark/10">
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-up-dark dark:text-white uppercase tracking-tight leading-none">Formalizar Cliente</h2>
                            <p className="text-[10px] text-gray-500 font-bold mt-1">Configure os termos da nova conta ativa.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 p-4 bg-gray-50 dark:bg-up-dark/40 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Lead Original</p>
                            <p className="font-bold text-sm text-up-dark dark:text-white truncate">{lead.name}</p>
                        </div>
                        <div className="bg-up-accent/10 p-2 rounded-full text-up-accent shrink-0">
                            <ArrowRight size={16} strokeWidth={3} />
                        </div>
                        <div className="flex-1 p-4 bg-green-500/5 dark:bg-green-500/10 rounded-2xl border border-green-500/20">
                            <p className="text-[9px] text-green-500 font-black uppercase tracking-widest mb-1">Status da Conta</p>
                            <p className="font-bold text-sm text-green-600 dark:text-green-400">Ativação Imediata</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <CreditCard size={14} className="text-up-accent" /> Configuração Financeira e Contato
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">Modelo de Contrato</label>
                                <div className="flex p-1 bg-gray-50 dark:bg-up-dark/50 rounded-xl border border-gray-200 dark:border-gray-600">
                                    <button
                                        type="button"
                                        onClick={() => setContractModel('Recurring')}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${contractModel === 'Recurring' ? 'bg-white dark:bg-up-deep shadow-sm text-up-dark dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Repeat size={14} /> Assinatura Mensal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContractModel('OneOff')}
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${contractModel === 'OneOff' ? 'bg-white dark:bg-up-deep shadow-sm text-up-dark dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <Briefcase size={14} /> Pagamento Único
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">Entidade / Nome da Conta</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">Telefone / WhatsApp</label>
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">
                                    {contractModel === 'Recurring' ? 'Valor Mensal (MRR)' : 'Valor do Projeto'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({...formData, contractValue: Number(e.target.value)})}
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                    />
                                    <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>

                            {contractModel === 'Recurring' ? (
                                <div className="space-y-2">
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
                                            className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                        />
                                        <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-up-accent" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 pointer-events-none uppercase">Meses</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 opacity-50 pointer-events-none">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">Fidelidade</label>
                                    <div className="w-full px-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-400">
                                        Não aplicável
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase ml-1 mb-1.5">
                                    {contractModel === 'Recurring' ? 'Início do Faturamento' : 'Data de Fechamento'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.contractStartDate}
                                        onChange={(e) => setFormData({...formData, contractStartDate: e.target.value})}
                                        className="w-full pl-10 pr-4 py-3.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold focus:ring-4 focus:ring-up-accent/10 focus:border-up-accent transition-all outline-none"
                                    />
                                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-up-accent" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-up-dark text-white p-5 rounded-2xl flex items-start gap-4 shadow-xl">
                        <Sparkles className="text-up-accent shrink-0 mt-1" size={20} />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-up-accent mb-1">Ações Automáticas</p>
                            <p className="text-[10px] text-blue-100 leading-relaxed">Ao confirmar, o sistema atualizará seu dashboard de receita e criará o registro oficial do cliente.</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-up-dark/20 shrink-0">
                    <button onClick={onClose} className="px-6 py-3 text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">Desistir</button>
                    <button onClick={handleSubmit} className="px-8 py-3 text-xs font-black text-up-dark bg-up-accent rounded-xl shadow-xl shadow-up-accent/20 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest">
                        <UserCheck size={18} /> Confirmar Venda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConvertLeadModal;
