
import React from 'react';
import { Lead } from '../../types';
import { Trash2, Edit, UserCheck } from 'lucide-react';

interface LeadListProps {
  leads: Lead[];
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (e: React.MouseEvent, id: string, name: string) => void;
  onConvertLead?: (lead: Lead) => void;
}

const WhatsAppLogo = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
);

const LeadList: React.FC<LeadListProps> = ({ leads, onEditLead, onDeleteLead, onConvertLead }) => {

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">Novo</span>;
      case 'Contacted': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">Contatado</span>;
      case 'Qualified': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-200">Qualificado</span>;
      case 'Closed': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">Fechado</span>;
      case 'Lost': return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">Perdido</span>;
      default: return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{status}</span>;
    }
  };

  if (leads.length === 0) {
      return (
          <div className="bg-white dark:bg-up-deep rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center text-gray-400">
              <p className="text-sm">Nenhum lead encontrado.</p>
          </div>
      );
  }

  return (
    <>
      <div className="hidden md:block bg-white dark:bg-up-deep rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-up-dark/50 border-b border-gray-100 dark:border-gray-700">
              <tr className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-6">Lead</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Valor</th>
                <th className="py-4 px-6">Tags</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  onClick={() => onEditLead(lead)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group cursor-pointer"
                >
                  <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-semibold shrink-0">
                            {lead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-up-dark dark:text-white text-sm truncate">{lead.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{lead.email}</p>
                        </div>
                      </div>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(lead.status)}</td>
                  <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {lead.value ? `R$ ${lead.value.toLocaleString()}` : '-'}
                      </span>
                  </td>
                  <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1">
                      {lead.tags.map((tag, idx) => (
                          <span key={idx} className={`text-[10px] px-2 py-0.5 rounded border ${tag.color}`}>
                            {tag.name}
                          </span>
                      ))}
                      </div>
                  </td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <a 
                            href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <WhatsAppLogo />
                        </a>
                        {onConvertLead && ['Qualified', 'Closed', 'Interested'].includes(lead.status) && (
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onConvertLead(lead); }}
                                className="p-2 text-white bg-green-500 hover:bg-green-600 rounded-lg"
                                title="Converter"
                            >
                                <UserCheck size={16} />
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onEditLead(lead); }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => onDeleteLead(e, lead.id, lead.name)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            title="Excluir"
                        >
                            <Trash2 size={16} />
                        </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {leads.map((lead) => (
            <div 
                key={lead.id} 
                onClick={() => onEditLead(lead)}
                className="bg-white dark:bg-up-deep rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold">
                            {lead.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-sm dark:text-white">{lead.name}</h3>
                            <p className="text-[10px] text-gray-400">{lead.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <a 
                            href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg"
                        >
                            <WhatsAppLogo />
                        </a>
                        <button 
                            type="button"
                            onClick={(e) => onDeleteLead(e, lead.id, lead.name)}
                            className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                    {getStatusBadge(lead.status)}
                    <span className="text-xs font-bold text-green-600">R$ {lead.value?.toLocaleString()}</span>
                </div>
            </div>
        ))}
      </div>
    </>
  );
};

export default LeadList;
