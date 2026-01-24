
import React, { useEffect, useState } from 'react';
import { db } from '../services/mockDb';
import { DashboardStats, Lead } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, Users, DollarSign, Target, Calendar, Clock, ChevronRight, Zap, TrendingUp, CheckCircle2, PieChart as PieIcon, ArrowRight, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899'];

// Skeleton Component for Loading State
const DashboardSkeleton = () => (
    <div className="space-y-6 animate-pulse max-w-[1600px] mx-auto">
        <div className="flex justify-between items-end">
            <div className="space-y-2">
                <div className="h-8 w-64 skeleton rounded-xl"></div>
                <div className="h-4 w-48 skeleton rounded-lg"></div>
            </div>
            <div className="h-10 w-40 skeleton rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
                <div key={i} className="h-32 skeleton rounded-[1.5rem]"></div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 skeleton rounded-[2rem]"></div>
            <div className="h-80 skeleton rounded-[2rem]"></div>
        </div>
        <div className="h-64 skeleton rounded-[2rem]"></div>
    </div>
);

const StatCard = ({ title, value, subValue, trend, icon: Icon, color, delay }: any) => (
  <div 
    className="bg-white dark:bg-up-surface p-5 rounded-[1.5rem] shadow-sm hover:shadow-glow border border-slate-100 dark:border-slate-800/50 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 group cursor-default opacity-0 animate-slide-up"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">{title}</p>
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-opacity-100 ring-4 ring-transparent group-hover:ring-current group-hover:ring-opacity-5 transition-all duration-500`}>
        <Icon size={20} className="text-current" />
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center text-[10px] font-black uppercase tracking-widest">
        <span className="text-green-500 flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-lg"><ArrowUpRight size={12} className="mr-1" />{trend}</span>
      </div>
      {subValue && (
          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">{subValue}</span>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [followUps, setFollowUps] = useState<Lead[]>([]);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [flowData, setFlowData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentTenant } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Simulate network delay for skeleton showcase
      await new Promise(r => setTimeout(r, 800));
      
      const s = await db.getStats();
      const f = await db.getUpcomingFollowUps();
      const leads = await db.getLeads();
      
      setStats(s);
      setFollowUps(f.slice(0, 4));

      // 1. Process Source Data (Pie Chart)
      const sources: {[key: string]: number} = {};
      leads.forEach(l => {
        sources[l.source] = (sources[l.source] || 0) + 1;
      });
      setSourceData(Object.keys(sources).map(key => ({ name: key, value: sources[key] })));

      // 2. Process Flow Data (Area Chart) - Last 5 weeks
      const processedFlow = [];
      const today = new Date();
      
      // Generate last 5 buckets (reverse order: 4 weeks ago to today)
      for (let i = 4; i >= 0; i--) {
          const start = new Date(today);
          start.setDate(today.getDate() - (i * 7) - 6); // 7 day window ending on reference day
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(today);
          end.setDate(today.getDate() - (i * 7));
          end.setHours(23, 59, 59, 999);

          const count = leads.filter(l => {
              const leadDate = new Date(l.createdAt);
              return leadDate >= start && leadDate <= end;
          }).length;

          // Label logic
          let label = '';
          if (i === 0) label = 'Atual';
          else if (i === 1) label = 'Sem Passada';
          else label = `${i} sem atrás`;

          processedFlow.push({
              name: label,
              leads: count,
              dateRange: `${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}`
          });
      }
      setFlowData(processedFlow);

      setLoading(false);
    };
    fetchData();
  }, [currentTenant]);

  if (loading || !stats) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-slide-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1 font-medium">Visão geral da performance comercial.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
                onClick={() => navigate('/leads', { state: { openCreateModal: true } })} 
                className="w-full md:w-auto bg-up-accent text-white px-6 py-3 rounded-xl text-xs font-black hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 uppercase tracking-widest hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
            >
                <Zap size={16} className="fill-white" />
                Novo Lead
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* USANDO activeLeads (Oportunidades em aberto) */}
        <StatCard 
            title="Oportunidades" 
            value={stats.activeLeads} 
            trend={stats.activeLeads > 0 ? "+Ativo" : "-"} 
            icon={Briefcase} 
            color="text-blue-500 bg-blue-500" 
            delay={100} 
        />
        
        {/* Mostrando Vendas Totais como sub-valor */}
        <StatCard 
            title="Receita (MRR)" 
            value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}`} 
            subValue={`${stats.closedDeals} Vendas`}
            trend="+100%" 
            icon={DollarSign} 
            color="text-green-500 bg-green-500" 
            delay={200} 
        />
        
        <StatCard 
            title="Conversão" 
            value={`${stats.conversionRate}%`} 
            trend="Funil Geral" 
            icon={Target} 
            color="text-purple-500 bg-purple-500" 
            delay={300} 
        />
        
        <StatCard 
            title="Ticket Médio" 
            value={`R$ ${stats.averageTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} 
            trend="Este Mês" 
            icon={TrendingUp} 
            color="text-orange-500 bg-orange-500" 
            delay={400} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-up-surface p-5 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/50 opacity-0 animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span> Fluxo de Demanda
            </h3>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div> Tempo Real
            </div>
          </div>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowData}>
                <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={15} />
                <YAxis hide />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)' }} 
                    cursor={{ stroke: '#3B82F6', strokeWidth: 2 }} 
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                    labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                            return `${label} (${payload[0].payload.dateRange})`;
                        }
                        return label;
                    }}
                />
                <Area 
                    type="monotone" 
                    dataKey="leads" 
                    stroke="#3B82F6" 
                    strokeWidth={4} 
                    fill="url(#colorLeads)" 
                    animationDuration={2000}
                    animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-up-surface p-5 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/50 flex flex-col opacity-0 animate-slide-up" style={{ animationDelay: '600ms' }}>
            <h3 className="text-xs font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2 uppercase tracking-[0.2em]">
                <PieIcon size={16} className="text-up-accent" /> Canais de Entrada
            </h3>
            <div className="flex-1 h-56 relative">
                {sourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={sourceData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={65} 
                                outerRadius={85} 
                                paddingAngle={6} 
                                dataKey="value" 
                                stroke="none"
                                cornerRadius={6}
                            >
                                {sourceData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                        <PieIcon size={48} className="mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase">Sem dados</p>
                    </div>
                )}
                {/* Center Text */}
                {sourceData.length > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.totalLeads}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                    </div>
                )}
            </div>
            <div className="mt-8 space-y-3">
                {sourceData.length > 0 ? sourceData.slice(0, 3).map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest group cursor-default">
                        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            {s.name}
                        </div>
                        <span className="bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-md min-w-[30px] text-center text-slate-900 dark:text-white">{s.value}</span>
                    </div>
                )) : (
                    <p className="text-center text-[10px] text-slate-400 font-medium">Cadastre um lead para ver a análise.</p>
                )}
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-up-surface p-5 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800/50 opacity-0 animate-slide-up" style={{ animationDelay: '700ms' }}>
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-[0.2em]">
                <Clock size={16} className="text-up-accent" /> Agenda Prioritária
            </h3>
            <button onClick={() => navigate('/agenda')} className="flex items-center gap-2 text-[10px] font-black text-up-accent uppercase tracking-widest hover:underline group">
                Ver Completa <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {followUps.length > 0 ? followUps.map((lead, idx) => (
                <div 
                    key={lead.id} 
                    onClick={() => navigate('/leads', { state: { leadId: lead.id } })} 
                    className="group flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-[1.5rem] border border-transparent hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300"
                    style={{ animationDelay: `${750 + (idx * 50)}ms` }}
                >
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-up-surface flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm shrink-0 group-hover:scale-110 group-hover:border-blue-500/20 transition-all">
                        <span className="text-[9px] font-black text-blue-500 uppercase leading-none">{new Date(lead.nextFollowUp!).toLocaleDateString('pt-BR', { month: 'short' }).replace('.','')}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">{new Date(lead.nextFollowUp!).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-blue-500 transition-colors">{lead.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">{lead.company || lead.source}</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <ChevronRight size={14} />
                    </div>
                </div>
            )) : (
                <div className="col-span-full py-16 text-center text-slate-400">
                    <CheckCircle2 size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Tudo em dia por aqui!</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
