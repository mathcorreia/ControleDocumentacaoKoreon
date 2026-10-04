import React from 'react';
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
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { formatCurrency } from '../../utils/utils';

// Dados estáticos para o gráfico (pode ser movido para o db.ts futuramente)
const chartData = [
  { name: 'Jan', vendas: 4000, lucro: 2400 },
  { name: 'Fev', vendas: 3000, lucro: 1398 },
  { name: 'Mar', vendas: 2000, lucro: 9800 },
  { name: 'Abr', vendas: 2780, lucro: 3908 },
  { name: 'Mai', vendas: 1890, lucro: 4800 },
  { name: 'Jun', vendas: 2390, lucro: 3800 },
];

export default function DashboardView({ db }: { db: any }) {
  // Lógica de cálculo em tempo real baseada no localStorage
  const totalRevenue = db.servicos.reduce((acc: number, s: any) => acc + (s.valorContratado || 0), 0);
  const receivedAmount = db.pagamentos
    .filter((p: any) => p.status === 'Pago')
    .reduce((acc: number, p: any) => acc + (p.valorParcela || 0), 0);
  
  const overdueCount = db.pagamentos.filter((p: any) => 
    p.status === 'Atrasado' || (p.status === 'Pendente' && new Date(p.dataVencimento) < new Date())
  ).length;

  const cards = [
    { label: 'Total de Clientes', value: db.clientes.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Contratos Ativos', value: db.servicos.filter((s: any) => s.status !== 'Concluído').length, icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Parcelas Vencidas', value: overdueCount, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Faturamento Total', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Visão Geral CRM</h2>
          <p className="text-[#98989d]">Estatísticas consolidadas do banco de dados local.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-[#1c1c1e] p-2 rounded-xl border border-[#333336]">
            <Calendar size={18} className="text-[#98989d]" />
            <span className="text-sm font-medium text-white">Últimos 30 dias</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-xl", card.bg)}>
                <card.icon className={card.color} size={24} />
              </div>
            </div>
            <p className="text-[#98989d] text-sm font-medium">{card.label}</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{card.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336]">
          <h3 className="font-bold text-lg text-white mb-8">Desempenho de Vendas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333336" />
                <XAxis dataKey="name" tick={{fill: '#94A3B8', fontSize: 12}} />
                <YAxis tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip contentStyle={{ background: '#1c1c1e', border: '1px solid #333336', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="vendas" stroke="#4F46E5" strokeWidth={3} fill="url(#colorVendas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336]">
          <h3 className="font-bold text-lg text-white mb-6">Resumo Financeiro</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#0f0f11] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <ArrowDownRight size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#98989d]">Recebido</p>
                  <p className="font-bold text-white">{formatCurrency(receivedAmount)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0f0f11] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs text-[#98989d]">Pendente</p>
                  <p className="font-bold text-white">{formatCurrency(totalRevenue - receivedAmount)}</p>
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