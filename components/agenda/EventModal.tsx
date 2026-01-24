
import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, CheckSquare, RefreshCw } from 'lucide-react';
import { db } from '../../services/mockDb';
import { googleCalendar } from '../../services/googleCalendar';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [syncGoogle, setSyncGoogle] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dateTimeString = `${date}T${time}:00`;
            const startDate = new Date(dateTimeString);
            const endDate = new Date(startDate.getTime() + 60 * 60000); // 1 hora de duração padrão

            if (syncGoogle && googleCalendar.isConnected()) {
                await googleCalendar.createEvent({
                    summary: title,
                    description: description,
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                    location: location
                });
                // Não precisamos salvar localmente se sincronizar, pois o fetchEvents do Google vai pegar.
                // Mas para garantir feedback imediato se a API falhar ou demorar, podemos salvar também.
                // Por simplicidade, vamos salvar localmente como backup se não sincronizar.
            } else {
                await db.addCustomEvent({
                    title,
                    description,
                    date: startDate.toISOString(),
                    location,
                    isGoogleSynced: false
                });
            }

            onSuccess();
            onClose();
            // Reset form
            setTitle('');
            setDescription('');
            setDate('');
            setTime('');
            setLocation('');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar evento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[80] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#0A1F2E] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-white/10 animate-scale-up">
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-[#0A1F2E] shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Novo Evento</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">Adicionar à Agenda</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Título do Evento</label>
                        <input 
                            required
                            type="text" 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                            placeholder="Ex: Reunião de Equipe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Data</label>
                            <input 
                                required
                                type="date" 
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Hora</label>
                            <input 
                                required
                                type="time" 
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Local / Link</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Sala de Reunião ou Google Meet"
                            />
                            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Descrição</label>
                        <textarea 
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                            placeholder="Detalhes adicionais..."
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 cursor-pointer" onClick={() => setSyncGoogle(!syncGoogle)}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${syncGoogle ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                            {syncGoogle && <CheckSquare size={14} className="text-white" />}
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sincronizar com Google Agenda</span>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Criar Evento'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
