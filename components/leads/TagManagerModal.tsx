
import React, { useState } from 'react';
import { Tag } from '../../types';
import { X, Check, Save, PenTool, Trash2, Plus, Tag as TagIcon } from 'lucide-react';
import { db } from '../../services/mockDb';

const TAG_COLORS = [
    { id: 'red', class: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'blue', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'green', class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'yellow', class: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'purple', class: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'gray', class: 'bg-gray-100 text-gray-700 border-gray-200' },
    { id: 'pink', class: 'bg-pink-100 text-pink-700 border-pink-200' },
    { id: 'cyan', class: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
    { id: 'indigo', class: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
];

interface TagManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    systemTags: Tag[];
    onTagsUpdated: (newTags: Tag[]) => void;
}

const TagManagerModal: React.FC<TagManagerModalProps> = ({ isOpen, onClose, systemTags, onTagsUpdated }) => {
    const [editingTagOriginalName, setEditingTagOriginalName] = useState<string | null>(null);
    const [managerTagName, setManagerTagName] = useState('');
    const [managerTagColor, setManagerTagColor] = useState(TAG_COLORS[1].class);

    if (!isOpen) return null;

    const handleStartEditTag = (tag: Tag) => {
        setManagerTagName(tag.name);
        setManagerTagColor(tag.color);
        setEditingTagOriginalName(tag.name);
    };

    const handleSaveTagManager = async () => {
        if (!managerTagName.trim()) return;
        
        const tagToSave: Tag = { name: managerTagName.trim(), color: managerTagColor };
        
        const updatedTags = await db.saveTag(tagToSave, editingTagOriginalName || undefined);
        onTagsUpdated(updatedTags);

        // Reset
        setManagerTagName('');
        setManagerTagColor(TAG_COLORS[1].class);
        setEditingTagOriginalName(null);
    };

    const handleDeleteSystemTag = async (tagName: string) => {
        if (window.confirm(`Tem certeza que deseja excluir a tag "${tagName}" do sistema? Ela será removida de todos os leads.`)) {
            const updatedTags = await db.deleteTag(tagName);
            onTagsUpdated(updatedTags);
        }
    };

    const handleCancelEditTag = () => {
        setManagerTagName('');
        setManagerTagColor(TAG_COLORS[1].class);
        setEditingTagOriginalName(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[70] flex items-center justify-center p-0 md:p-4 animate-fade-in">
            <div className="bg-[#F8FAFC] dark:bg-[#0A1F2E] w-full h-full md:h-auto md:max-h-[85vh] md:max-w-md rounded-none md:rounded-[2rem] shadow-2xl flex flex-col animate-scale-up border-0 md:border border-white/10 overflow-hidden">
                
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-[#0A1F2E] shrink-0 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-500/20 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                            <TagIcon size={18} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Gerenciar Tags</h2>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Organize seu fluxo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                    
                    {/* Form Creator/Editor */}
                    <div className="bg-white dark:bg-white/5 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            {editingTagOriginalName ? <PenTool size={12} /> : <Plus size={12} />}
                            {editingTagOriginalName ? 'Editar Tag Existente' : 'Criar Nova Tag'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <input 
                                    type="text" 
                                    value={managerTagName}
                                    onChange={(e) => setManagerTagName(e.target.value)}
                                    placeholder="Ex: Prioridade Alta"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-[#020617] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-400 font-black uppercase mb-2 block tracking-widest">Cor da Etiqueta</label>
                                <div className="flex flex-wrap gap-2">
                                    {TAG_COLORS.map((col) => (
                                        <button
                                            key={col.id}
                                            onClick={() => setManagerTagColor(col.class)}
                                            className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${managerTagColor === col.class ? 'ring-2 ring-offset-2 dark:ring-offset-[#0A1F2E] ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100 hover:scale-105'} ${col.class.split(' ')[0]}`}
                                        >
                                            {managerTagColor === col.class && <Check size={14} className="text-black/50" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            {editingTagOriginalName && (
                                <button 
                                    onClick={handleCancelEditTag}
                                    className="flex-1 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-white/5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button 
                                onClick={handleSaveTagManager}
                                disabled={!managerTagName.trim()}
                                className="flex-1 py-3 text-xs font-black text-white uppercase tracking-wider bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                <Save size={16} /> {editingTagOriginalName ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </div>

                    {/* Tags List */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tags do Sistema ({systemTags.length})</h3>
                        <div className="space-y-2">
                            {systemTags.map((tag, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${tag.color.split(' ')[0]}`}></div>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{tag.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleStartEditTag(tag)}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <PenTool size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSystemTag(tag.name)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TagManagerModal;
