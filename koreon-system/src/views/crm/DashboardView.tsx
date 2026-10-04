import React, { useEffect, useState } from 'react';
import { 
  Users, 
  FileCheck, 
  TrendingUp, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Clock,
  Bell
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import type { DashboardStats } from '../../types';
import { formatCurrency } from '../../utils/utils';

const data = [
  { name: 'Jan', vendas: 4000, lucro: 2400 },
  { name: 'Fev', vendas: 3000, lucro: 1398 },
  { name: 'Mar', vendas: 2000, lucro: 9800 },
  { name: 'Abr', vendas: 2780, lucro: 3908 },
  { name: 'Mai', vendas: 1890, lucro: 4800 },
  { name: 'Jun', vendas: 2390, lucro: 3800 },
];

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
    </div>
    <div className="h-96 bg-slate-200 rounded-2xl"></div>
  </div>;

  const cards = [
    { label: 'Total de Clientes', value: stats.totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Contratos Ativos', value: stats.closedContracts, icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Parcelas Vencidas', value: stats.overdueInstallments, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Faturamento Total', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Comissões Pendentes', value: formatCurrency(stats.pendingCommissions), icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Visão Geral</h2>
          <p className="text-[#98989d]">Bem-vindo de volta ao seu painel de controle.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              fetch('/api/billing/process', { method: 'POST' })
                .then(res => res.json())
                .then(data => alert(`Processado: ${data.processed} cobranças enviadas.`));
            }}
            className="flex items-center gap-2 bg-[#1c1c1e] p-2 px-4 rounded-xl border border-[#333336] shadow-sm hover:bg-[#0f0f11] text-sm font-bold text-indigo-600"
          >
            <Bell size={18} />
            Executar Cobrança
          </button>
          <div className="flex items-center gap-2 bg-[#1c1c1e] p-2 rounded-xl border border-[#333336] shadow-sm">
            <Calendar size={18} className="text-[#98989d]" />
            <span className="text-sm font-medium">Últimos 30 dias</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", card.bg)}>
                <card.icon className={card.color} size={24} />
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight size={12} />
                12%
              </span>
            </div>
            <p className="text-[#98989d] text-sm font-medium">{card.label}</p>
            <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg">Desempenho de Vendas</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
                <span className="text-xs text-[#98989d]">Faturamento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-[#98989d]">Lucro</span>
              </div>
            </div>
          </div>
          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="vendas" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorVendas)" />
                <Area type="monotone" dataKey="lucro" stroke="#10B981" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
          <h3 className="font-bold text-lg mb-6">Resumo Financeiro</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#0f0f11] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <ArrowDownRight size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#98989d]">Recebido</p>
                  <p className="font-bold">{formatCurrency(stats.receivedAmount)}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#98989d]">85%</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0f0f11] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#98989d]">Pendente</p>
                  <p className="font-bold">{formatCurrency(stats.totalRevenue - stats.receivedAmount)}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#98989d]">15%</span>
            </div>

            <div className="pt-4 border-t border-[#333336]">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-[#98989d]">Lucro Estimado</p>
                  <h4 className="text-2xl font-bold text-indigo-600">
                    {formatCurrency(stats.totalRevenue - stats.totalExpenses - stats.pendingCommissions)}
                  </h4>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600 font-medium">+5.4%</p>
                  <p className="text-[10px] text-[#98989d] uppercase tracking-wider">vs mês anterior</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
