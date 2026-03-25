import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  ArrowUpRight, ArrowDownRight, PieChart as PieChartIcon, 
  BarChart3, Download, Filter, Wallet, Clock
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { formatCurrency, cn } from '../../utils/utils';

interface FinancialStats {
  grossRevenue: number;
  netRevenue: number;
  totalReceived: number;
  totalPending: number;
  monthReceived: number;
  monthExpenses: number;
  monthProfit: number;
  dayProfit: number;
  commissionsPending: number;
  expensesPending: number;
  currentBalance: number;
  charts: {
    monthlyRevenue: any[];
    cashFlow: any[];
    categoryData: any[];
  };
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinancialDashboard() {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/financial/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4,5,6,7,8].map(i => (
          <div key={i} className="h-32 bg-[#0f0f11] animate-pulse rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const revenueData = stats.charts.monthlyRevenue;
  const cashFlowData = stats.charts.cashFlow;
  const categoryData = stats.charts.categoryData;

  const handleExport = () => {
    alert("Gerando Balanço Financeiro completo em PDF... Aguarde.");
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold">Painel Financeiro</h2>
          <p className="text-[#98989d] text-sm">Visão geral da saúde financeira da empresa</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 bg-[#1c1c1e] border border-[#333336] rounded-lg text-slate-600 hover:bg-[#0f0f11] transition-colors">
            <Filter size={18} />
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Download size={18} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Faturamento Bruto" 
          value={stats.grossRevenue} 
          icon={<DollarSign className="text-indigo-600" />}
          trend="+12%"
          trendUp={true}
        />
        <StatCard 
          title="Faturamento Líquido" 
          value={stats.netRevenue} 
          icon={<TrendingUp className="text-emerald-600" />}
          trend="+8%"
          trendUp={true}
        />
        <StatCard 
          title="Recebimentos do Mês" 
          value={stats.monthReceived} 
          icon={<Calendar className="text-amber-600" />}
          trend="+5%"
          trendUp={true}
        />
        <StatCard 
          title="Saldo a Receber" 
          value={stats.totalPending} 
          icon={<BarChart3 className="text-blue-600" />}
        />
        <StatCard 
          title="Despesas do Mês" 
          value={stats.monthExpenses} 
          icon={<TrendingDown className="text-rose-600" />}
          trend="+15%"
          trendUp={false}
        />
        <StatCard 
          title="Lucro do Mês" 
          value={stats.monthProfit} 
          icon={<ArrowUpRight className="text-emerald-600" />}
        />
        <StatCard 
          title="Comissões a Pagar" 
          value={stats.commissionsPending} 
          icon={<PieChartIcon className="text-orange-600" />}
        />
        <StatCard 
          title="Despesas Pendentes" 
          value={stats.expensesPending} 
          icon={<Clock className="text-rose-400" />}
        />
        <StatCard 
          title="Saldo Disponível" 
          value={stats.currentBalance} 
          icon={<Wallet className="text-indigo-600" />}
          highlight={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Faturamento Mensal">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => [formatCurrency(val), 'Faturamento']}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Fluxo de Caixa (Entradas vs Saídas)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `R$${val/1000}k`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="entrada" stroke="#10b981" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="saida" stroke="#ef4444" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Despesas por Categoria">
          <div className="flex items-center justify-center h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Crescimento de Vendas">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp, highlight }: { 
  title: string, 
  value: number, 
  icon: React.ReactNode, 
  trend?: string, 
  trendUp?: boolean,
  highlight?: boolean
}) {
  return (
    <div className={cn(
      "p-6 rounded-2xl border transition-all",
      highlight ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-[#1c1c1e] border-[#333336] shadow-sm"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-2 rounded-lg",
          highlight ? "bg-[#1c1c1e]/20" : "bg-[#0f0f11]"
        )}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold",
            trendUp ? (highlight ? "text-emerald-300" : "text-emerald-600") : (highlight ? "text-rose-300" : "text-rose-600")
          )}>
            {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      <p className={cn(
        "text-xs font-bold uppercase tracking-wider mb-1",
        highlight ? "text-white/70" : "text-[#98989d]"
      )}>
        {title}
      </p>
      <h3 className="text-2xl font-bold">{formatCurrency(value)}</h3>
    </div>
  );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
      <h3 className="font-bold text-white mb-6">{title}</h3>
      {children}
    </div>
  );
}
