
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  ShieldCheck, AlertTriangle, TrendingDown, TrendingUp, Users, DollarSign, Briefcase, 
  Target, Award, Ban, Info, ChevronRight, Activity, ArrowUpRight
} from 'lucide-react';
import { StatusFornecedor, Fornecedor, NivelRisco, ListaProcessual } from '../../types';
import { calcularMargensLote, calcularRiscoLote } from '../../db';

interface CommandDashboardViewProps {
  db: any;
}

const CommandDashboardView: React.FC<CommandDashboardViewProps> = ({ db }) => {
  const fornecedores = (db.fornecedores || []) as Fornecedor[];
  const listas = (db.listas || []) as ListaProcessual[];

  const rankData = [...fornecedores].sort((a, b) => b.scoreAtual - a.scoreAtual).map((f, i) => ({
    name: f.nome.split(' (')[0],
    score: f.scoreAtual,
    status: f.status
  }));

  const listasComMetricas = listas.map(l => ({
    ...l,
    margens: calcularMargensLote(l.id),
    risco: calcularRiscoLote(l.id)
  })).sort((a, b) => new Date(b.dataInicio).getTime() - new Date(a.dataInicio).getTime());

  const COLORS_STATUS = {
    [StatusFornecedor.ATIVO]: '#10b981',
    [StatusFornecedor.OBSERVACAO]: '#f59e0b',
    [StatusFornecedor.BLOQUEADO]: '#ef4444'
  };

  const RISCO_COLORS = {
    [NivelRisco.BAIXO]: 'text-emerald-500 bg-emerald-50',
    [NivelRisco.MEDIO]: 'text-blue-500 bg-blue-50',
    [NivelRisco.ALTO]: 'text-amber-500 bg-amber-50',
    [NivelRisco.CRITICO]: 'text-red-600 bg-red-50 animate-pulse'
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tighter">Centro de Comando Executivo</h2>
          <p className="text-sm text-[#98989d] font-bold italic">Governança algorítmica e monitoramento de performance</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-[#1c1c1e] px-6 py-4 rounded-3xl border border-[#333336] flex items-center gap-4">
              <Target className="text-blue-600" size={24} />
              <div>
                <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest">Score Médio Rede</p>
                <p className="text-xl font-black text-white">78.3</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ranking de Fornecedores */}
        <div className="lg:col-span-2 bg-[#1c1c1e] p-8 rounded-[45px] border border-[#333336] shadow-sm">
           <h3 className="text-xl font-black text-white mb-8 flex items-center gap-3">
             <Award className="text-amber-500" /> Ranking Dinâmico de Performance (SLA 40% + Prazo 20%)
           </h3>
           <div className="h-80">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={rankData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 800}} width={120} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                 <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={32}>
                    {rankData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_STATUS[entry.status as StatusFornecedor] || '#cbd5e1'} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Status da Rede */}
        <div className="space-y-4">
           {fornecedores.map(f => (
             <div key={f.id} className="bg-[#1c1c1e] p-6 rounded-[32px] border border-[#333336] shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    f.status === StatusFornecedor.ATIVO ? 'bg-emerald-50 text-emerald-600' : 
                    f.status === StatusFornecedor.OBSERVACAO ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {f.status === StatusFornecedor.BLOQUEADO ? <Ban size={24} /> : <ShieldCheck size={24} />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-white uppercase tracking-tight line-clamp-1">{f.nome}</p>
                    <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest">{f.status}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-lg font-black text-white">{f.scoreAtual}</p>
                   {f.tendencia === 'up' ? <TrendingUp size={14} className="text-emerald-500 ml-auto" /> : f.tendencia === 'down' ? <TrendingDown size={14} className="text-red-500 ml-auto" /> : <Activity size={14} className="text-blue-500 ml-auto" />}
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-[#1c1c1e] rounded-[45px] border border-[#333336] shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
           <h3 className="text-xl font-black text-white">Métricas de Rentabilidade e Risco por Lote</h3>
           <p className="text-xs font-bold text-[#98989d] uppercase tracking-widest mt-1">Cálculo de margem líquida considerando custo operacional unitário (R$ 50,00)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0f0f11]/50 text-[10px] font-black text-[#98989d] uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Lote / ID</th>
                <th className="px-8 py-6">Fornecedor</th>
                <th className="px-8 py-6">Risco Calculado</th>
                <th className="px-8 py-6">Margem Bruta</th>
                <th className="px-8 py-6">Margem Líquida</th>
                <th className="px-8 py-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333336]">
               {listasComMetricas.map(l => (
                 <tr key={l.id} className="hover:bg-[#0f0f11]/50 transition-all group">
                   <td className="px-8 py-6">
                     <p className="text-sm font-black text-white tracking-tight">{l.nome}</p>
                     <p className="text-[10px] font-bold text-[#98989d]">{l.dataInicio}</p>
                   </td>
                   <td className="px-8 py-6">
                     <span className="text-xs font-black text-slate-600 uppercase">{l.fornecedor || '---'}</span>
                   </td>
                   <td className="px-8 py-6">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${RISCO_COLORS[l.risco]}`}>
                       {l.risco}
                     </span>
                   </td>
                   <td className="px-8 py-6">
                     <p className="text-sm font-black text-[#e5e5ea]">R$ {l.margens.bruta.toFixed(2)}</p>
                   </td>
                   <td className="px-8 py-6">
                     <div className="flex items-center gap-3">
                        <p className={`text-sm font-black ${l.margens.liquida < 0 ? 'text-red-500' : l.margens.liquida < 500 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          R$ {l.margens.liquida.toFixed(2)}
                        </p>
                        {l.margens.liquida < 0 && <AlertTriangle size={14} className="text-red-500" />}
                     </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                     <button className="p-2 text-slate-300 hover:text-blue-600 transition-all"><ArrowUpRight size={18} /></button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CommandDashboardView;
