
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
        contractDuration: 12,
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
            contractDuration: contractModel === 'OneOff' ? 1 : formData.contractDuration,
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
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[70] flex items-center justify-center p-4 animate-fade-in">
                <div className="max-w-md w-full text-center space-y-8 animate-scale-up relative">
                    <div className="relative inline-block">
                        <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] relative z-10">
                            <CheckCircle2 size={64} className="text-white" />
                        </div>
                        <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping"></div>
                        <div className="absolute -top-4 -right-4 animate-bounce z-20">
                            <Sparkles size={40} className="text-yellow-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">SUCESSO!</h2>
                        <p className="text-slate-300 text-lg font-medium">Você acaba de conquistar um novo cliente.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md">
                        <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-2">
                            {contractModel === 'Recurring' ? 'Nova Receita Recorrente' : 'Receita Única'}
                        </p>
                        <p className="text-5xl font-black text-emerald-400 tracking-tighter">
                            R$ {formData.contractValue.toLocaleString('pt-BR')}
                            {contractModel === 'Recurring' && <span className="text-lg text-white/50 font-medium">/mês</span>}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg shadow-white/10"
                    >
                        Continuar Operação
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-0 md:p-6 animate-fade-in">
            {/* Modal */}
            <div className="bg-[#F8FAFC] dark:bg-[#0A1F2E] w-full h-full md:h-auto md:max-h-[95vh] md:max-w-2xl rounded-none md:rounded-[2.5rem] shadow-2xl flex flex-col animate-scale-up border-0 md:border border-white/10 overflow-hidden relative">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-[#0A1F2E] shrink-0 backdrop-blur-md z-20">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white p-3 rounded-2xl shadow-lg shadow-emerald-500/20">
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Formalizar Cliente</h2>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">Configure os termos da nova conta</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2.5 text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all">
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-[#F8FAFC] dark:bg-[#020617]">
                    {/* Hero Context */}
                    <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div className="flex-1 p-2">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Lead Original</p>
                            <p className="font-bold text-base text-slate-900 dark:text-white truncate">{lead.name}</p>
                        </div>
                        <div className="bg-emerald-500/10 p-2 rounded-full text-emerald-500 shrink-0">
                            <ArrowRight size={20} strokeWidth={3} />
                        </div>
                        <div className="flex-1 p-2 text-right">
                            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-1">Nova Fase</p>
                            <p className="font-bold text-base text-emerald-600 dark:text-emerald-400">Cliente Ativo</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <CreditCard size={14} className="text-blue-500" /> Termos do Contrato
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Modelo de Contrato</label>
                                <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setContractModel('Recurring')}
                                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${contractModel === 'Recurring' ? 'bg-white dark:bg-[#0A1F2E] shadow-sm text-blue-600 dark:text-white ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <Repeat size={14} /> Assinatura Mensal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setContractModel('OneOff'); setFormData(prev => ({ ...prev, contractDuration: 1 })); }}
                                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${contractModel === 'OneOff' ? 'bg-white dark:bg-[#0A1F2E] shadow-sm text-blue-600 dark:text-white ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <Briefcase size={14} /> Pagamento Único
                                    </button>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Entidade / Nome da Conta</label>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
                                />
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Telefone / WhatsApp</label>
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">
                                    {contractModel === 'Recurring' ? 'Valor Mensal (MRR)' : 'Valor do Projeto/Venda'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={formData.contractValue}
                                        onChange={(e) => setFormData({...formData, contractValue: Number(e.target.value)})}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
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
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            min="1" 
                                            value={formData.contractDuration}
                                            onChange={(e) => setFormData({...formData, contractDuration: Number(e.target.value)})}
                                            className="w-full pl-12 pr-12 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
                                        />
                                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none uppercase">Meses</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2 opacity-50 pointer-events-none">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Duração</label>
                                    <div className="w-full px-4 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-400">
                                        Pontual (1 Mês)
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">
                                    {contractModel === 'Recurring' ? 'Início do Faturamento' : 'Data da Venda'}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={formData.contractStartDate}
                                        onChange={(e) => setFormData({...formData, contractStartDate: e.target.value})}
                                        className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none dark:text-white"
                                    />
                                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 dark:bg-blue-600 text-white p-6 rounded-3xl flex items-start gap-4 shadow-xl">
                        <Sparkles className="text-yellow-400 shrink-0 mt-1" size={24} />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-white/90 mb-1">Automação Inteligente</p>
                            <p className="text-xs text-white/70 leading-relaxed font-medium">Ao confirmar, o sistema atualizará seu dashboard de receita e criará o registro oficial do cliente automaticamente.</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-white/50 dark:bg-[#0A1F2E] shrink-0 backdrop-blur-md z-20">
                    <button onClick={onClose} className="px-6 py-3.5 text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all">Desistir</button>
                    <button onClick={handleSubmit} className="px-8 py-3.5 text-xs font-black text-white bg-emerald-500 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest hover:bg-emerald-400">
                        <UserCheck size={18} /> Confirmar Venda
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConvertLeadModal;
