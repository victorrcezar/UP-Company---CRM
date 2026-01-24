
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Target, Instagram, ExternalLink, Heart, MessageCircle } from 'lucide-react';
import { db } from '../services/mockDb';
import { Lead } from '../types';
import { useAuth } from '../contexts/AuthContext';

// Cores do tema
const COLORS = ['#38BDF8', '#818CF8', '#34D399', '#FBBF24', '#F472B6', '#94A3B8'];
const FUNNEL_COLORS = ['#94A3B8', '#818CF8', '#FBBF24', '#34D399'];

const Reports = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'year'>('30d');
  const [loading, setLoading] = useState(true);
  const { currentTenant } = useAuth();

  // Estados para dados processados
  const [kpiData, setKpiData] = useState({ revenue: 0, totalLeads: 0, conversionRate: 0, avgTicket: 0 });
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [leadsByMonthData, setLeadsByMonthData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [timeRange, currentTenant]);

  const fetchData = async () => {
    setLoading(true);
    const data = await db.getLeads();
    setLeads(data);
    processMetrics(data);
    setLoading(false);
  };

  const processMetrics = (data: Lead[]) => {
    // 1. KPIs
    const closedLeads = data.filter(l => l.status === 'Closed');
    const totalRevenue = closedLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const conversion = data.length > 0 ? (closedLeads.length / data.length) * 100 : 0;
    const avgTicket = closedLeads.length > 0 ? totalRevenue / closedLeads.length : 0;

    setKpiData({
      revenue: totalRevenue,
      totalLeads: data.length,
      conversionRate: Math.round(conversion),
      avgTicket: avgTicket
    });

    // 2. Source Data (Pie Chart)
    const sources: {[key: string]: number} = {};
    data.forEach(l => {
      sources[l.source] = (sources[l.source] || 0) + 1;
    });
    const pieData = Object.keys(sources).map(key => ({ name: key, value: sources[key] }));
    setSourceData(pieData);

    // 3. Funnel Data (Bar Chart)
    const statusCounts = {
      'New': 0, 'Contacted': 0, 'Discussion': 0, 'Interested': 0, 'Qualified': 0, 'Closed': 0, 'Lost': 0
    };
    data.forEach(l => {
        if (statusCounts.hasOwnProperty(l.status)) {
            // @ts-ignore
            statusCounts[l.status]++;
        }
    });

    setFunnelData([
        { name: 'Novos', value: statusCounts['New'] + statusCounts['Contacted'] },
        { name: 'Em Negociação', value: statusCounts['Discussion'] + statusCounts['Interested'] + statusCounts['Qualified'] },
        { name: 'Fechados', value: statusCounts['Closed'] },
        { name: 'Perdidos', value: statusCounts['Lost'] }
    ]);

    // 4. Monthly Leads Acquisition (Bar Chart)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyCounts = new Array(12).fill(0);
    
    data.forEach(l => {
        const d = new Date(l.createdAt);
        // Garante que é deste ano se o filtro for 'year', ou processa tudo se for geral
        // Aqui simplificamos pegando o mês de todos os leads para demo
        monthlyCounts[d.getMonth()]++;
    });

    const monthlyChartData = months.map((m, i) => ({
        name: m,
        leads: monthlyCounts[i]
    }));
    setLeadsByMonthData(monthlyChartData);

    // 5. Mock Revenue History
    const monthsRange = timeRange === '30d' ? 4 : timeRange === '90d' ? 6 : 12;
    const mockHistory = [];
    for (let i = 0; i < monthsRange; i++) {
        mockHistory.push({
            name: `Período ${i + 1}`,
            revenue: Math.floor(Math.random() * (totalRevenue / 2)) + 1000,
            projected: Math.floor(Math.random() * (totalRevenue / 2)) + 2000
        });
    }
    setRevenueData(mockHistory);
  };

  const KPICard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
    <div className="bg-white dark:bg-up-deep p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between">
        <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-up-dark dark:text-white">{value}</h3>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className="text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded flex items-center">
                    <TrendingUp size={12} className="mr-1" /> +12%
                </span>
                vs. período anterior
            </p>
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
  );

  if (loading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-up-deep"></div></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-up-dark dark:text-white">Relatórios & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Análise detalhada da performance comercial.</p>
        </div>

        <div className="flex gap-2 bg-white dark:bg-up-deep p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <button 
                onClick={() => setTimeRange('30d')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${timeRange === '30d' ? 'bg-up-dark text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
                30 Dias
            </button>
            <button 
                onClick={() => setTimeRange('90d')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${timeRange === '90d' ? 'bg-up-dark text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
                Trimestre
            </button>
            <button 
                onClick={() => setTimeRange('year')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${timeRange === 'year' ? 'bg-up-dark text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
                Este Ano
            </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
            title="Receita Total" 
            value={`R$ ${kpiData.revenue.toLocaleString('pt-BR')}`} 
            icon={DollarSign}
            colorClass="bg-green-500 shadow-lg shadow-green-500/30"
        />
        <KPICard 
            title="Total de Leads" 
            value={kpiData.totalLeads} 
            icon={Users}
            colorClass="bg-blue-500 shadow-lg shadow-blue-500/30"
        />
        <KPICard 
            title="Taxa de Conversão" 
            value={`${kpiData.conversionRate}%`} 
            icon={Target}
            colorClass="bg-purple-500 shadow-lg shadow-purple-500/30"
        />
        <KPICard 
            title="Ticket Médio" 
            value={`R$ ${kpiData.avgTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} 
            icon={TrendingUp}
            colorClass="bg-orange-500 shadow-lg shadow-orange-500/30"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-up-deep p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-up-dark dark:text-white">Evolução Financeira</h3>
                  <button className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                      <Download size={14} /> Exportar CSV
                  </button>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0A1F2E', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#94A3B8' }}
                            formatter={(value: number) => [`R$ ${value.toLocaleString()}`, '']}
                        />
                        <Area type="monotone" dataKey="projected" stackId="1" stroke="#94A3B8" fill="url(#colorProj)" name="Projeção" />
                        <Area type="monotone" dataKey="revenue" stackId="2" stroke="#10B981" strokeWidth={3} fill="url(#colorRev)" name="Realizado" />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Source Distribution */}
          <div className="bg-white dark:bg-up-deep p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-up-dark dark:text-white mb-6">Origem dos Leads</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={sourceData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {sourceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip 
                             contentStyle={{ backgroundColor: '#0A1F2E', border: 'none', borderRadius: '8px', color: '#fff' }}
                             itemStyle={{ color: '#fff' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4 overflow-y-auto max-h-40 custom-scrollbar pr-2">
                  {sourceData.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="text-gray-600 dark:text-gray-300">{entry.name}</span>
                          </div>
                          <span className="font-bold text-up-dark dark:text-white">{entry.value}</span>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      {/* NEW SECTION: Monthly Leads & Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Monthly Leads Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-up-deep p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-up-dark dark:text-white mb-6">Volume de Aquisição (Leads por Mês)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsByMonthData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                        <Tooltip 
                            cursor={{fill: 'rgba(56, 189, 248, 0.1)'}}
                            contentStyle={{ backgroundColor: '#0A1F2E', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="leads" name="Novos Leads" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Funnel Conversion */}
          <div className="bg-white dark:bg-up-deep p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-up-dark dark:text-white mb-6">Funil de Conversão</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fill: '#64748B', fontSize: 11, fontWeight: 500}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ backgroundColor: '#0A1F2E', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="value" name="Leads" radius={[0, 4, 4, 0]} barSize={32}>
                            {funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* Instagram Widget */}
      <div className="grid grid-cols-1 gap-6">
          <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-orange-400 p-[1px] rounded-2xl shadow-sm flex flex-col h-full">
            <div className="bg-white dark:bg-up-deep rounded-2xl p-6 h-full flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-up-dark dark:text-white flex items-center gap-2">
                    <Instagram size={20} className="text-pink-600" /> Instagram Insights
                 </h3>
                 <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200 animate-pulse">
                    Ao Vivo
                 </span>
              </div>
              
              <div className="flex-1 flex flex-col">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                        <img 
                            src="https://ui-avatars.com/api/?name=IP&background=random&color=fff" 
                            alt="Profile" 
                            className="w-full h-full rounded-full border-2 border-white dark:border-up-deep object-cover" 
                        />
                    </div>
                    <div>
                        <a href="https://www.instagram.com/isapirschnerl/" target="_blank" rel="noreferrer" className="font-black text-lg text-up-dark dark:text-white hover:underline decoration-pink-500 decoration-2 underline-offset-2">
                            @isapirschnerl
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Isadora Pirschner | Fisioterapia</p>
                        <div className="flex gap-4 mt-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                            <span><span className="text-up-dark dark:text-white font-black">1.2k</span> seguidores</span>
                            <span><span className="text-up-dark dark:text-white font-black">450</span> seguindo</span>
                        </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-2 mb-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden relative group cursor-pointer">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 justify-center gap-2 text-white text-[10px] font-bold">
                                <span className="flex items-center gap-1"><Heart size={10} /> {20 + i * 5}</span>
                                <span className="flex items-center gap-1"><MessageCircle size={10} /> {2 + i}</span>
                            </div>
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <Instagram size={24} className="opacity-20" />
                            </div>
                        </div>
                    ))}
                 </div>

                 <div className="mt-auto">
                    <a 
                        href="https://www.instagram.com/isapirschnerl/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20"
                    >
                        Ver Feed Completo <ExternalLink size={14} />
                    </a>
                 </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Reports;
