
import React from 'react';
import { 
  Users, Briefcase, TrendingUp, AlertCircle, 
  CheckCircle2, Clock, DollarSign, ArrowRight, ShieldAlert, Zap, Ban, TrendingDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { StatusServico, StatusPagamento, NivelRisco } from '../../types';

interface DashboardProps {
  db: any;
}

const DashboardView: React.FC<DashboardProps> = ({ db }) => {
  const totalClientes = db.clientes.length;
  const servicosAtivos = db.servicos.filter((s: any) => s.status !== StatusServico.CONCLUIDO).length;
  
  // Risk Metrics
  const highRiskCount = db.clientes.filter((c: any) => c.riskLevel === NivelRisco.ALTO).length;
  const revenueAtRisk = db.pagamentos
    .filter((p: any) => (p.status === StatusPagamento.ATRASADO || (p.status === StatusPagamento.PENDENTE && new Date(p.dataVencimento) < new Date())))
    .reduce((acc: number, curr: any) => acc + curr.valorParcela, 0);

  const blockedServicesCount = db.servicos.filter((s: any) => s.status === StatusServico.SUSPENSO).length;
  const upsellEligibleCount = db.clientes.filter((c: any) => c.riskLevel === NivelRisco.BAIXO).length;

  const statusData = [
    { name: 'Início', count: db.servicos.filter((s: any) => s.status === StatusServico.INICIO).length },
    { name: 'Andamento', count: db.servicos.filter((s: any) => s.status === StatusServico.EM_ANDAMENTO).length },
    { name: 'Fase Final', count: db.servicos.filter((s: any) => s.status === StatusServico.FASE_FINAL).length },
    { name: 'Concluído', count: db.servicos.filter((s: any) => s.status === StatusServico.CONCLUIDO).length },
  ];

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* RISK COMMAND CENTER (NEW) */}
      <div className="bg-[#1c1c1e] p-8 rounded-[45px] border-2 border-red-50 shadow-xl">
        <div className="flex items-center gap-3 mb-8">
           <ShieldAlert className="text-red-600" size={28} />
           <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Risk Command Center</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <RiskMetric label="Alto Risco (Bloqueados)" value={highRiskCount} icon={Ban} color="text-red-600" bg="bg-red-50" />
            <RiskMetric label="Receita em Risco (Atraso)" value={`R$ ${revenueAtRisk.toLocaleString('pt-BR')}`} icon={TrendingDown} color="text-amber-600" bg="bg-amber-50" />
            <RiskMetric label="Serviços Suspensos" value={blockedServicesCount} icon={Lock} color="text-slate-600" bg="bg-[#0f0f11]" />
            <RiskMetric label="Elegíveis para Upsell" value={upsellEligibleCount} icon={Zap} color="text-emerald-600" bg="bg-emerald-50" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard icon={Users} label="Total de Clientes" value={totalClientes} color="bg-blue-600" />
        <MetricCard icon={Briefcase} label="Serviços Ativos" value={servicosAtivos} color="bg-emerald-500" />
        <MetricCard icon={Clock} label="Ações em Atraso" value={db.servicos.filter((s: any) => s.status === StatusServico.ATRASADO).length} color="bg-amber-500" urgent />
        <MetricCard icon={DollarSign} label="Pagamentos Pendentes" value={db.pagamentos.filter((p: any) => p.status !== StatusPagamento.PAGO).length} color="bg-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-[#1c1c1e] p-8 rounded-3xl shadow-sm border border-[#333336]">
          <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
            <TrendingUp size={24} className="text-blue-600" /> Distribuição de Status Operacional
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-[#1c1c1e] p-8 rounded-3xl shadow-sm border border-[#333336] flex flex-col">
          <h3 className="text-xl font-black text-white mb-8">Mix de Serviços Ativos</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={[
                    { name: 'Limpa Nome', value: db.servicos.filter((s: any) => s.tipo === 'Limpa Nome').length },
                    { name: 'Score', value: db.servicos.filter((s: any) => s.tipo === 'Aumento de Score').length },
                    { name: 'Outros', value: db.servicos.filter((s: any) => !['Limpa Nome', 'Aumento de Score'].includes(s.tipo)).length },
                  ]} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                  {[0,1,2].map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const RiskMetric = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className={`${bg} p-6 rounded-3xl flex items-center gap-4 transition-all hover:scale-105 cursor-default`}>
        <div className={`w-12 h-12 rounded-2xl bg-[#1c1c1e] flex items-center justify-center ${color} shadow-sm`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest">{label}</p>
            <p className={`text-lg font-black ${color}`}>{value}</p>
        </div>
    </div>
);

const MetricCard = ({ icon: Icon, label, value, color, urgent }: any) => (
  <div className={`p-8 rounded-3xl bg-[#1c1c1e] shadow-sm border-2 transition-all hover:shadow-xl ${urgent ? 'border-red-100' : 'border-white'}`}>
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-[11px] font-black text-[#98989d] uppercase tracking-widest">{label}</p>
        <h4 className="text-3xl font-black text-white">{value}</h4>
      </div>
      <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shadow-current/20`}>
        <Icon size={28} />
      </div>
    </div>
  </div>
);

const Lock = ({ size, className }: any) => <AlertCircle size={size} className={className} />;

export default DashboardView;
