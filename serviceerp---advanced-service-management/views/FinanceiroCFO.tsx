
import React, { useState, useMemo, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, PieChart, Landmark,
  AlertTriangle, BarChart3, Clock, Flame, ShieldAlert,
  Target, Zap, Activity, Filter, Plus, Trash2, ArrowRight,
  LandmarkIcon, Calendar, Info, CheckCircle2, ChevronRight, Ban
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell 
} from 'recharts';
import { StatusPagamento, Pagamento, TipoServicoStrict, ServicoContratado } from '../../types';

interface ContaPagar {
  id: string;
  descricao: string;
  categoria: 'Fixos' | 'Variáveis' | 'Serviços' | 'Marketing';
  valor: number;
  vencimento: string;
  pago: boolean;
}

const FinanceiroCFO: React.FC<{ db: any }> = ({ db }) => {
  const [activeSubTab, setActiveSubTab] = useState<'monitor' | 'faturamento' | 'boletos' | 'performance' | 'executivo'>('executivo');
  const [expenses, setExpenses] = useState<ContaPagar[]>(() => {
    const saved = localStorage.getItem('service_erp_cfo_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('service_erp_cfo_expenses', JSON.stringify(expenses));
  }, [expenses]);

  const addExpense = (exp: Omit<ContaPagar, 'id'>) => {
    setExpenses([...expenses, { ...exp, id: `exp_${Date.now()}` }]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const toggleExpense = (id: string) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, pago: !e.pago } : e));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* CFO Sub-Navigation */}
      <div className="flex gap-2 p-1.5 bg-slate-200/50 w-fit rounded-[24px] border border-[#333336] shadow-sm overflow-x-auto">
        <CfoTabButton active={activeSubTab === 'executivo'} onClick={() => setActiveSubTab('executivo')} icon={BarChart3} label="Dashboard Executivo" />
        <CfoTabButton active={activeSubTab === 'monitor'} onClick={() => setActiveSubTab('monitor')} icon={Landmark} label="Monitoramento Financeiro" />
        <CfoTabButton active={activeSubTab === 'faturamento'} onClick={() => setActiveSubTab('faturamento')} icon={TrendingUp} label="Faturamento e Resultados" />
        <CfoTabButton active={activeSubTab === 'boletos'} onClick={() => setActiveSubTab('boletos')} icon={Target} label="Gestão de Boletos" />
        <CfoTabButton active={activeSubTab === 'performance'} onClick={() => setActiveSubTab('performance')} icon={Zap} label="Performance de Produtos" />
      </div>

      <div className="min-h-[600px]">
        {activeSubTab === 'monitor' && <MonitoramentoSubTab db={db} expenses={expenses} onAdd={addExpense} onDelete={deleteExpense} onToggle={toggleExpense} />}
        {activeSubTab === 'faturamento' && <FaturamentoSubTab db={db} expenses={expenses} />}
        {activeSubTab === 'boletos' && <BoletosSubTab db={db} />}
        {activeSubTab === 'performance' && <PerformanceSubTab db={db} />}
        {activeSubTab === 'executivo' && <ExecutivoSubTab db={db} expenses={expenses} />}
      </div>
    </div>
  );
};

const CfoTabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all whitespace-nowrap ${
      active ? 'bg-[#1c1c1e] text-blue-600 shadow-xl shadow-blue-500/10' : 'text-[#98989d] hover:text-[#e5e5ea]'
    }`}
  >
    <Icon size={16} /> {label}
  </button>
);

// --- 1. MONITORAMENTO FINANCEIRO ---
const MonitoramentoSubTab = ({ db, expenses, onAdd, onDelete, onToggle }: any) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ descricao: '', categoria: 'Fixos' as any, valor: '', vencimento: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...form, valor: Number(form.valor), pago: false });
    setForm({ descricao: '', categoria: 'Fixos', valor: '', vencimento: '' });
    setShowAdd(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-400">
      {/* Accounts Receivable */}
      <div className="bg-[#1c1c1e] p-8 rounded-[40px] border border-[#333336] shadow-sm flex flex-col h-full">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white tracking-tighter">Contas a Receber (Contratos)</h3>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Landmark size={20} /></div>
         </div>
         <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
               <thead className="bg-[#0f0f11] text-[10px] font-black text-[#98989d] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Cliente / Contrato</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#333336]">
                  {db.pagamentos.slice(-8).reverse().map((p: Pagamento) => {
                    const cliente = db.clientes.find((c: any) => c.id === p.clienteId);
                    const servico = db.servicos.find((s: any) => s.id === p.servicoId);
                    const isLate = p.status !== StatusPagamento.PAGO && new Date(p.dataVencimento) < new Date();
                    return (
                      <tr key={p.id} className="hover:bg-[#0f0f11]/50">
                        <td className="px-6 py-4">
                           <p className="text-sm font-black text-white line-clamp-1">{cliente?.nome}</p>
                           <p className="text-[9px] font-bold text-[#98989d] uppercase tracking-widest">{servico?.tipo}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-[#98989d]">{new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-sm font-black text-white">R$ {p.valorParcela.toLocaleString('pt-BR')}</td>
                        <td className="px-6 py-4 text-right">
                           <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                             p.status === StatusPagamento.PAGO ? 'bg-emerald-50 text-emerald-600' :
                             isLate ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
                           }`}>{p.status === StatusPagamento.PAGO ? 'PAGO' : isLate ? 'ATRASADO' : 'PENDENTE'}</span>
                        </td>
                      </tr>
                    )
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* Accounts Payable */}
      <div className="bg-[#1c1c1e] p-8 rounded-[40px] border border-[#333336] shadow-sm flex flex-col h-full relative">
         <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white tracking-tighter">Contas a Pagar (Custos Op)</h3>
            <button onClick={() => setShowAdd(true)} className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10">
               <Plus size={20} />
            </button>
         </div>

         {showAdd && (
            <div className="absolute inset-0 bg-[#1c1c1e]/95 backdrop-blur-sm z-10 p-10 flex flex-col justify-center rounded-[40px]">
               <form onSubmit={handleSubmit} className="space-y-6">
                  <h4 className="text-lg font-black text-white uppercase tracking-tighter">Lançar Despesa</h4>
                  <input required placeholder="Descrição" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="w-full px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold" />
                  <div className="grid grid-cols-2 gap-4">
                     <input required type="number" placeholder="Valor (R$)" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} className="px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold" />
                     <input required type="date" value={form.vencimento} onChange={e => setForm({...form, vencimento: e.target.value})} className="px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold" />
                  </div>
                  <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value as any})} className="w-full px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold">
                     <option value="Fixos">Custos Fixos</option>
                     <option value="Variáveis">Custos Variáveis</option>
                     <option value="Serviços">Custos de Serviços</option>
                     <option value="Marketing">Custos de Marketing</option>
                  </select>
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 bg-[#0f0f11] text-[#98989d] font-black uppercase text-xs tracking-widest rounded-2xl">Cancelar</button>
                     <button type="submit" className="flex-[2] py-4 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-500/20">Registrar Saída</button>
                  </div>
               </form>
            </div>
         )}

         <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
               <thead className="bg-[#0f0f11] text-[10px] font-black text-[#98989d] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Descrição / Cat</th>
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#333336]">
                  {expenses.length > 0 ? expenses.map((e: ContaPagar) => (
                    <tr key={e.id} className="hover:bg-[#0f0f11]/50 group">
                      <td className="px-6 py-4">
                         <p className={`text-sm font-black ${e.pago ? 'text-slate-300 line-through' : 'text-white'}`}>{e.descricao}</p>
                         <p className="text-[9px] font-bold text-[#98989d] uppercase tracking-widest">{e.categoria}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-[#98989d]">{new Date(e.vencimento).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-sm font-black text-white">R$ {e.valor.toLocaleString('pt-BR')}</td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2 h-full">
                         <button onClick={() => onToggle(e.id)} className={`p-2 rounded-xl transition-all ${e.pago ? 'text-emerald-500 bg-emerald-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}>
                            {e.pago ? <CheckCircle2 size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-[#333336]" />}
                         </button>
                         <button onClick={() => onDelete(e.id)} className="p-2 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={20} /></button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Nenhuma despesa lançada</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

// --- 2. FATURAMENTO E RESULTADOS ---
const FaturamentoSubTab = ({ db, expenses }: any) => {
  const faturamentoTotal = db.pagamentos.filter((p: any) => p.status === StatusPagamento.PAGO).reduce((acc: number, p: any) => acc + p.valorParcela, 0);
  const custosTotais = expenses.reduce((acc: number, e: any) => acc + e.valor, 0);
  const lucroLiquido = faturamentoTotal - custosTotais;
  const margem = faturamentoTotal > 0 ? (lucroLiquido / faturamentoTotal) * 100 : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-400">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricBox label="Faturamento Pago" value={`R$ ${faturamentoTotal.toLocaleString('pt-BR')}`} icon={TrendingUp} color="text-blue-600" bg="bg-blue-50" />
          <MetricBox label="Custos de Operação" value={`R$ ${custosTotais.toLocaleString('pt-BR')}`} icon={TrendingDown} color="text-red-600" bg="bg-red-50" />
          <MetricBox label="Lucro Líquido" value={`R$ ${lucroLiquido.toLocaleString('pt-BR')}`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" />
          <MetricBox label="Margem Líquida" value={`${margem.toFixed(1)}%`} icon={PieChart} color="text-indigo-600" bg="bg-indigo-50" />
       </div>

       <div className="bg-[#1c1c1e] p-10 rounded-[45px] border border-[#333336] shadow-sm">
          <h3 className="text-xl font-black text-white mb-10 flex items-center gap-3"><Activity className="text-blue-600" /> Fluxo de Performance Mensal</h3>
          <div className="h-96">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[
                  { mes: 'Janeiro', rev: 12000, exp: 8000 },
                  { mes: 'Fevereiro', rev: 15500, exp: 8200 },
                  { mes: 'Março', rev: 11200, exp: 7500 },
                  { mes: 'Abril', rev: 18900, exp: 9000 },
                  { mes: 'Maio (Atual)', rev: faturamentoTotal, exp: custosTotais },
                ]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                   <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                   <Area type="monotone" dataKey="rev" name="Receita" stroke="#2563eb" fillOpacity={0.1} fill="#2563eb" />
                   <Area type="monotone" dataKey="exp" name="Despesas" stroke="#ef4444" fillOpacity={0.05} fill="#ef4444" />
                </AreaChart>
             </ResponsiveContainer>
          </div>
       </div>
    </div>
  );
};

// --- 3. MONITORAMENTO DE BOLETOS ---
const BoletosSubTab = ({ db }: any) => {
  const installments = db.pagamentos;
  const overdue = installments.filter((p: any) => p.status !== StatusPagamento.PAGO && new Date(p.dataVencimento) < new Date());
  const delinquent = overdue.filter((p: any) => {
    const diff = Math.abs(new Date().getTime() - new Date(p.dataVencimento).getTime());
    return (diff / (1000 * 60 * 60 * 24)) > 30;
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-left-4 duration-400">
       <div className="bg-red-900 p-10 rounded-[45px] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10"><ShieldAlert size={140} /></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
             <div>
                <h3 className="text-3xl font-black tracking-tight">Risco de Inadimplência Crítica</h3>
                <p className="text-sm font-bold text-red-300 uppercase tracking-widest mt-1">Identificados {delinquent.length} registros com mais de 30 dias de atraso</p>
             </div>
             <div className="text-left md:text-right">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Receita Perdida Estimada</p>
                <p className="text-4xl font-black">R$ {delinquent.reduce((acc: number, p: any) => acc + p.valorParcela, 0).toLocaleString('pt-BR')}</p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#1c1c1e] p-8 rounded-[40px] border border-[#333336] shadow-sm">
             <h4 className="text-lg font-black text-white mb-6 flex items-center gap-2"><Clock className="text-amber-500" /> Parcelas em Atraso (&lt; 30d)</h4>
             <div className="space-y-4">
                {overdue.filter((p: any) => !delinquent.includes(p)).map((p: any) => (
                   <div key={p.id} className="p-6 bg-amber-50 rounded-[28px] border border-amber-100 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-amber-900">{db.clientes.find((c: any) => c.id === p.clienteId)?.nome}</p>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Vencimento: {new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <p className="text-lg font-black text-amber-800">R$ {p.valorParcela.toLocaleString('pt-BR')}</p>
                   </div>
                ))}
             </div>
          </div>
          <div className="bg-[#1c1c1e] p-8 rounded-[40px] border border-red-100 shadow-sm">
             <h4 className="text-lg font-black text-red-600 mb-6 flex items-center gap-2"><Flame className="text-red-500" /> Inadimplentes Críticos (&gt; 30d)</h4>
             <div className="space-y-4">
                {delinquent.map((p: any) => (
                   <div key={p.id} className="p-6 bg-red-50 rounded-[28px] border border-red-100 flex items-center justify-between group">
                      <div>
                        <p className="text-sm font-black text-red-900">{db.clientes.find((c: any) => c.id === p.clienteId)?.nome}</p>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest animate-pulse">Ação Jurídica Recomendada</p>
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-black text-red-800">R$ {p.valorParcela.toLocaleString('pt-BR')}</p>
                         <button className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-all underline">Bloquear Acesso</button>
                      </div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
};

// --- 4. PERFORMANCE DE PRODUTOS ---
const PerformanceSubTab = ({ db }: any) => {
  const performanceData = useMemo(() => {
    return Object.values(TipoServicoStrict).map(tipo => {
      const srvs = db.servicos.filter((s: ServicoContratado) => s.tipo === tipo);
      const revTotal = srvs.reduce((acc: number, s: any) => acc + s.valorContratado, 0);
      const revPago = db.pagamentos.filter((p: any) => p.status === StatusPagamento.PAGO && db.servicos.find((s: any) => s.id === p.servicoId)?.tipo === tipo).reduce((acc: number, p: any) => acc + p.valorParcela, 0);
      // Custos específicos (extraídos das listas operacionais se houver)
      const custoOp = db.listas.filter((l: any) => l.tipoServico === tipo).reduce((acc: number, l: any) => acc + (l.custoAcao || 0), 0);
      const margem = revPago > 0 ? ((revPago - custoOp) / revPago) * 100 : 0;
      return { tipo, revTotal, revPago, custoOp, margem };
    }).sort((a, b) => b.revPago - a.revPago);
  }, [db]);

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-400">
       <div className="bg-[#1c1c1e] rounded-[45px] border border-[#333336] shadow-sm overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-[#0f0f11] text-[10px] font-black text-[#98989d] uppercase tracking-widest">
                <tr>
                   <th className="px-10 py-6">Produto / Serviço</th>
                   <th className="px-10 py-6 text-center">Faturado (Contratos)</th>
                   <th className="px-10 py-6 text-center">Recebido (Real)</th>
                   <th className="px-10 py-6 text-center">Custo Direto</th>
                   <th className="px-10 py-6 text-center">Margem</th>
                   <th className="px-10 py-6 text-right">Performance</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-[#333336]">
                {performanceData.map(p => (
                  <tr key={p.tipo} className="hover:bg-[#0f0f11]/50 group">
                    <td className="px-10 py-7">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.margem < 15 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                             <Zap size={18} />
                          </div>
                          <span className="text-sm font-black text-white">{p.tipo}</span>
                       </div>
                    </td>
                    <td className="px-10 py-7 text-center text-sm font-bold text-[#98989d]">R$ {p.revTotal.toLocaleString('pt-BR')}</td>
                    <td className="px-10 py-7 text-center text-sm font-black text-white">R$ {p.revPago.toLocaleString('pt-BR')}</td>
                    <td className="px-10 py-7 text-center text-sm font-bold text-red-400">R$ {p.custoOp.toLocaleString('pt-BR')}</td>
                    <td className="px-10 py-7 text-center">
                       <span className={`text-sm font-black ${p.margem < 20 ? 'text-red-600' : 'text-emerald-600'}`}>{p.margem.toFixed(1)}%</span>
                    </td>
                    <td className="px-10 py-7 text-right">
                       {p.margem < 15 ? (
                         <span className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-lg border border-red-100">Margem Baixa</span>
                       ) : (
                         <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100">Escalável</span>
                       )}
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
       </div>
    </div>
  );
};

// --- 5. DASHBOARD EXECUTIVO ---
const ExecutivoSubTab = ({ db, expenses }: any) => {
  const faturamento = db.pagamentos.filter((p: any) => p.status === StatusPagamento.PAGO).reduce((acc: number, p: any) => acc + p.valorParcela, 0);
  const custos = expenses.reduce((acc: number, e: any) => acc + e.valor, 0);
  const burnRateDiario = custos / 30;
  const cashRunway = burnRateDiario > 0 ? (faturamento - custos) / burnRateDiario : 999;

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ExecMetric label="Caixa Atual" value={`R$ ${(faturamento - custos).toLocaleString('pt-BR')}`} icon={LandmarkIcon} color="text-white" bg="bg-[#1c1c1e]" />
          <ExecMetric label="Burn Rate Diário" value={`R$ ${burnRateDiario.toFixed(2)}`} icon={Flame} color="text-red-600" bg="bg-[#1c1c1e]" />
          <ExecMetric label="Cash Runway" value={`${cashRunway.toFixed(0)} Dias`} icon={Clock} color={cashRunway < 30 ? 'text-red-600' : 'text-emerald-600'} bg="bg-[#1c1c1e]" />
          <ExecMetric label="Ponto de Equilíbrio" value={`R$ ${custos.toLocaleString('pt-BR')}`} icon={Target} color="text-blue-600" bg="bg-[#1c1c1e]" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#1c1c1e] p-10 rounded-[45px] border border-[#333336] shadow-sm h-[450px]">
             <h3 className="text-xl font-black text-white mb-10 flex items-center gap-3"><LandmarkIcon className="text-blue-600" /> Fluxo de Caixa (Previsão vs Real)</h3>
             <div className="h-full">
                <ResponsiveContainer width="100%" height="80%">
                   <BarChart data={[
                     { label: 'Jan', ent: 12, sai: 8 },
                     { label: 'Fev', ent: 15, sai: 8.2 },
                     { label: 'Mar', ent: 11, sai: 7.5 },
                     { label: 'Abr', ent: 18, sai: 9 },
                     { label: 'Mai', ent: faturamento / 1000, sai: custos / 1000 },
                   ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none' }} />
                      <Bar dataKey="ent" name="Entradas (k)" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} />
                      <Bar dataKey="sai" name="Saídas (k)" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={24} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="bg-slate-900 p-10 rounded-[45px] text-white flex flex-col justify-between">
             <div>
                <h3 className="text-xl font-black tracking-tighter mb-4 border-b border-slate-800 pb-4">CFO Executive Summary</h3>
                <div className="space-y-6">
                   <SummaryRow label="Concentração de Receita" value="Alta (35%)" urgent />
                   <SummaryRow label="Eficiência de Cobrança" value="89.2%" />
                   <SummaryRow label="ROE Operacional" value="1.8x" />
                   <SummaryRow label="Risco de Inadimplência" value="Baixo" />
                </div>
             </div>
             <div className="mt-8 p-6 bg-slate-800/50 rounded-3xl border border-slate-700/50">
                <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest leading-relaxed">
                   Alerta Estratégico: O custo de marketing variou +15% no último período sem crescimento proporcional no faturamento pago. Recomenda-se revisão de CAC.
                </p>
             </div>
          </div>
       </div>
    </div>
  );
};

const MetricBox = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className={`p-8 rounded-[40px] ${bg} flex flex-col items-center text-center gap-3 transition-all hover:scale-105 cursor-default`}>
     <div className={`w-14 h-14 bg-[#1c1c1e] rounded-2xl flex items-center justify-center shadow-sm ${color}`}>
        <Icon size={28} />
     </div>
     <div>
        <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-xl font-black ${color}`}>{value}</p>
     </div>
  </div>
);

const ExecMetric = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className={`${bg} p-8 rounded-[40px] border border-[#333336] shadow-sm flex flex-col gap-4`}>
     <div className={`w-12 h-12 bg-[#0f0f11] rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={24} />
     </div>
     <div>
        <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-black ${color} tracking-tighter`}>{value}</p>
     </div>
  </div>
);

const SummaryRow = ({ label, value, urgent }: any) => (
  <div className="flex justify-between items-center">
     <span className="text-xs font-bold text-[#98989d] uppercase tracking-widest">{label}</span>
     <span className={`text-sm font-black ${urgent ? 'text-red-500' : 'text-emerald-400'}`}>{value}</span>
  </div>
);

export default FinanceiroCFO;
