import React, { useState } from 'react';
import { Tag } from '../../types';
import { X, Check, Save, PenTool, Trash2, Plus } from 'lucide-react';
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-up-deep w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-scale-up border border-gray-100 dark:border-gray-600">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-up-deep shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-up-dark dark:text-white">Gerenciar Tags</h2>
                        <p className="text-xs text-gray-500">Crie, edite ou remova tags do sistema.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Form Creator/Editor */}
                    <div className="bg-gray-50 dark:bg-up-dark/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            {editingTagOriginalName ? 'Editar Tag' : 'Nova Tag'}
                        </h3>
                        
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Nome</label>
                                <input 
                                    type="text" 
                                    value={managerTagName}
                                    onChange={(e) => setManagerTagName(e.target.value)}
                                    placeholder="Ex: Prioridade Alta"
                                    className="w-full px-3 py-2 bg-white dark:bg-up-deep border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 font-bold uppercase mb-1 block">Cor</label>
                                <div className="flex flex-wrap gap-2">
                                    {TAG_COLORS.map((col) => (
                                        <button
                                            key={col.id}
                                            onClick={() => setManagerTagColor(col.class)}
                                            className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center ${managerTagColor === col.class ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : 'opacity-70 hover:opacity-100'} ${col.class.split(' ')[0]}`}
                                        >
                                            {managerTagColor === col.class && <Check size={12} className="text-black/50" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                            {editingTagOriginalName && (
                                <button 
                                    onClick={handleCancelEditTag}
                                    className="flex-1 py-2 text-xs font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button 
                                onClick={handleSaveTagManager}
                                disabled={!managerTagName.trim()}
                                className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Save size={14} /> {editingTagOriginalName ? 'Atualizar' : 'Criar Tag'}
                            </button>
                        </div>
                    </div>

                    {/* Tags List */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tags Existentes ({systemTags.length})</h3>
                        <div className="space-y-2">
                            {systemTags.map((tag, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-up-deep border border-gray-100 dark:border-gray-700 rounded-xl hover:border-blue-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full ${tag.color.split(' ')[0]}`}></div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tag.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleStartEditTag(tag)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <PenTool size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteSystemTag(tag.name)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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