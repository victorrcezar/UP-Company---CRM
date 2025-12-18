import React, { useRef, useState, useEffect } from 'react';
import { Search, Filter, ListFilter, Settings, Check, ChevronDown, X } from 'lucide-react';
import { Tag } from '../../types';

interface LeadFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatuses: string[];
  toggleStatus: (status: string) => void;
  resetStatuses: () => void;
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  resetTags: () => void;
  systemTags: Tag[];
  onOpenTagManager: () => void;
}

const STATUS_OPTIONS = [
    { id: 'New', label: 'Novo', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'Contacted', label: 'Contatado', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'Discussion', label: 'Em Conversa', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'Interested', label: 'Interessado', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'Qualified', label: 'Qualificado', color: 'bg-teal-100 text-teal-700 border-teal-200' },
    { id: 'Closed', label: 'Fechado', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'Lost', label: 'Perdido', color: 'bg-red-100 text-red-700 border-red-200' },
];

const LeadFilters: React.FC<LeadFiltersProps> = ({
  searchQuery, setSearchQuery,
  selectedStatuses, toggleStatus, resetStatuses,
  selectedTags, toggleTag, resetTags,
  systemTags, onOpenTagManager
}) => {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const statusFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
            setIsFilterDropdownOpen(false);
        }
        if (statusFilterRef.current && !statusFilterRef.current.contains(event.target as Node)) {
            setIsStatusFilterOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white dark:bg-up-deep p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="w-full md:flex-1 relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome, email ou telefone..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-up-dark/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:border-up-accent focus:ring-2 focus:ring-up-accent/20 transition-all"
                />
            </div>
            
            <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0">
                {/* Multi-Select Status Filter Dropdown */}
                <div className="relative" ref={statusFilterRef}>
                    <button 
                        onClick={() => setIsStatusFilterOpen(!isStatusFilterOpen)}
                        className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm transition-colors whitespace-nowrap ${isStatusFilterOpen || selectedStatuses.length > 0 ? 'bg-purple-50 border-purple-200 text-purple-700 font-medium' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    >
                        <ListFilter size={16} /> 
                        Status
                        {selectedStatuses.length > 0 && (
                            <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{selectedStatuses.length}</span>
                        )}
                        <ChevronDown size={14} className={`transition-transform ${isStatusFilterOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isStatusFilterOpen && (
                        <div className="absolute right-0 md:left-0 md:right-auto top-full mt-2 w-56 bg-white dark:bg-up-deep rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-30 animate-fade-in overflow-hidden">
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-500 uppercase">Filtrar por Status</p>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                                {STATUS_OPTIONS.map((status) => {
                                    const isSelected = selectedStatuses.includes(status.id);
                                    return (
                                        <label key={status.id} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300 bg-white'}`}>
                                                {isSelected && <Check size={10} className="text-white" />}
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                onChange={() => toggleStatus(status.id)}
                                                className="hidden"
                                            />
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-up-dark/50 flex justify-between">
                                <button onClick={resetStatuses} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Limpar</button>
                                <button onClick={() => setIsStatusFilterOpen(false)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 font-medium">Pronto</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Multi-Select Tag Filter Dropdown */}
                <div className="relative" ref={filterRef}>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm transition-colors whitespace-nowrap ${isFilterDropdownOpen || selectedTags.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-600 font-medium' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Filter size={16} /> 
                            Tags
                            {selectedTags.length > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{selectedTags.length}</span>
                            )}
                            <ChevronDown size={14} className={`transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        <button 
                            onClick={onOpenTagManager}
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-gray-50 dark:bg-up-deep text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                            title="Gerenciar Tags do Sistema"
                        >
                            <Settings size={16} />
                            <span className="hidden sm:inline">Tags</span>
                        </button>
                    </div>

                    {/* Dropdown Content */}
                    {isFilterDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-up-deep rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-30 animate-fade-in overflow-hidden">
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-500 uppercase">Filtrar por Tags</p>
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                                {systemTags.length > 0 ? (
                                    systemTags.map((tag, idx) => {
                                        const isSelected = selectedTags.includes(tag.name);
                                        return (
                                            <label key={idx} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                                    {isSelected && <Check size={10} className="text-white" />}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => toggleTag(tag.name)}
                                                    className="hidden"
                                                />
                                                <span className={`text-sm ${isSelected ? 'text-up-dark dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>{tag.name}</span>
                                                <span className={`ml-auto w-2 h-2 rounded-full ${tag.color.split(' ')[0]}`}></span>
                                            </label>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-gray-400 text-center py-2">Nenhuma tag encontrada.</p>
                                )}
                            </div>
                            <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-up-dark/50 flex justify-between">
                                <button onClick={resetTags} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">Limpar</button>
                                <button onClick={() => setIsFilterDropdownOpen(false)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 font-medium">Pronto</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Selected Filters Display */}
        {(selectedTags.length > 0 || selectedStatuses.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                <span className="text-xs text-gray-400 mr-1">Filtros ativos:</span>
                
                {selectedStatuses.map(statusId => {
                    const statusObj = STATUS_OPTIONS.find(s => s.id === statusId);
                    return (
                        <button 
                            key={statusId}
                            onClick={() => toggleStatus(statusId)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border hover:opacity-80 transition-opacity ${statusObj?.color || 'bg-gray-100 border-gray-200 text-gray-600'}`}
                        >
                            {statusObj?.label || statusId}
                            <X size={12} />
                        </button>
                    );
                })}

                {selectedTags.map(tagName => (
                    <button 
                        key={tagName}
                        onClick={() => toggleTag(tagName)}
                        className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                        {tagName}
                        <X size={12} />
                    </button>
                ))}
                
                <button onClick={() => { resetTags(); resetStatuses(); }} className="text-xs text-gray-400 hover:text-red-500 underline ml-2">
                    Limpar tudo
                </button>
            </div>
        )}
      </div>
  );
};

export default LeadFilters;