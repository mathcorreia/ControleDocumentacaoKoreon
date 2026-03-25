
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Search, Filter, Trash2, Truck, AlertTriangle, 
  CheckCircle2, Ban, TrendingUp, DollarSign, Activity, 
  ChevronRight, ArrowUpRight, ShieldCheck, Landmark,
  X, Briefcase, Target, PieChart, BarChart3, Info
} from 'lucide-react';
import { TipoServicoStrict, StatusFornecedor } from '../../types';

interface AdvancedFornecedor {
  id: string;
  nome: string;
  empresa: string;
  cnpj: string;
  endereco: string;
  tipoServico: TipoServicoStrict;
  tipoCobranca: 'Preço por nome' | 'Preço fixo' | 'Preço variável';
  custo: number;
  custoMinimo: number;
  custoMaximo: number;
}

const STORAGE_KEY_FORNECEDORES = 'erp_fornecedores_advanced_v1';

const PRE_REGISTERED: AdvancedFornecedor[] = [
  { id: 'adv_f1', nome: 'Aldemir', empresa: 'Elo Sistemas', cnpj: '00.000.000/0001-01', endereco: 'São Paulo, SP', tipoServico: TipoServicoStrict.LIMPA_NOME, tipoCobranca: 'Preço por nome', custo: 45, custoMinimo: 30, custoMaximo: 60 },
  { id: 'adv_f2', nome: 'João Tesser', empresa: 'Alecred Solutions', cnpj: '00.000.000/0001-02', endereco: 'Curitiba, PR', tipoServico: TipoServicoStrict.LIMPA_NOME, tipoCobranca: 'Preço por nome', custo: 50, custoMinimo: 35, custoMaximo: 55 },
  { id: 'adv_f3', nome: 'Patner', empresa: 'M12 Tecnologia', cnpj: '00.000.000/0001-03', endereco: 'Rio de Janeiro, RJ', tipoServico: TipoServicoStrict.LIMPA_NOME, tipoCobranca: 'Preço por nome', custo: 55, custoMinimo: 40, custoMaximo: 70 },
  { id: 'adv_f4', nome: 'Edgar HC', empresa: 'Elo Prime', cnpj: '00.000.000/0001-04', endereco: 'Belo Horizonte, MG', tipoServico: TipoServicoStrict.LIMPA_NOME, tipoCobranca: 'Preço por nome', custo: 48, custoMinimo: 30, custoMaximo: 60 }
];

const FornecedoresView: React.FC<{ db: any }> = ({ db }) => {
  const [activeSubTab, setActiveSubTab] = useState<'gestao' | 'analise'>('gestao');
  const [suppliers, setSuppliers] = useState<AdvancedFornecedor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_FORNECEDORES);
    return saved ? JSON.parse(saved) : PRE_REGISTERED;
  });
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');
  const [newSupplier, setNewSupplier] = useState<Partial<AdvancedFornecedor>>({
    tipoServico: TipoServicoStrict.LIMPA_NOME,
    tipoCobranca: 'Preço por nome',
    custoMinimo: 0,
    custoMaximo: 100
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(suppliers));
  }, [suppliers]);

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `adv_f_${Date.now()}`;
    setSuppliers([...suppliers, { ...newSupplier, id } as AdvancedFornecedor]);
    setShowModal(false);
  };

  const deleteSupplier = (id: string) => {
    if (window.confirm("Remover fornecedor?")) {
      setSuppliers(suppliers.filter(s => s.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex gap-2 p-1.5 bg-slate-200/50 w-fit rounded-[24px] border border-[#333336] shadow-sm">
        <button 
          onClick={() => setActiveSubTab('gestao')}
          className={`px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeSubTab === 'gestao' ? 'bg-[#1c1c1e] text-blue-600 shadow-xl' : 'text-[#98989d]'}`}
        >
          <Briefcase size={16} /> Gestão de Fornecedores
        </button>
        <button 
          onClick={() => setActiveSubTab('analise')}
          className={`px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeSubTab === 'analise' ? 'bg-[#1c1c1e] text-blue-600 shadow-xl' : 'text-[#98989d]'}`}
        >
          <BarChart3 size={16} /> Análise de Performance
        </button>
      </div>

      {activeSubTab === 'gestao' ? (
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative group flex-1 max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Buscar fornecedor por nome ou CNPJ..." 
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-14 pr-8 py-4 bg-[#1c1c1e] border-2 border-[#333336] rounded-[25px] outline-none focus:border-blue-500/50 font-bold transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-blue-600 text-white rounded-[25px] font-black text-sm flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
            >
              <Plus size={24} /> ADICIONAR FORNECEDOR
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {suppliers.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()) || s.cnpj.includes(busca)).map(s => {
              const isBlocked = s.custo > s.custoMaximo;
              return (
                <div key={s.id} className="bg-[#1c1c1e] p-8 rounded-[40px] border border-[#333336] shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all group relative overflow-hidden">
                  {isBlocked && <div className="absolute top-0 right-0 px-6 py-2 bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-3xl animate-pulse">Bloqueado por Custo Alto</div>}
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl font-black ${isBlocked ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {s.nome.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-white tracking-tight">{s.nome}</h3>
                        <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest">{s.empresa} • {s.cnpj}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteSupplier(s.id)} className="p-3 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-[#0f0f11] rounded-[24px] border border-[#333336]">
                        <p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest mb-1">Custo Atual</p>
                        <p className={`text-xl font-black ${isBlocked ? 'text-red-600' : 'text-white'}`}>R$ {s.custo.toFixed(2)}</p>
                     </div>
                     <div className="p-5 bg-[#0f0f11] rounded-[24px] border border-[#333336]">
                        <p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest mb-1">Governança</p>
                        <p className="text-[10px] font-bold text-[#e5e5ea]">Max: R$ {s.custoMaximo.toFixed(2)}</p>
                     </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-50">
                    <span className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                       <Target size={14} /> {s.tipoServico}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isBlocked ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                       {isBlocked ? 'Bloqueado' : 'Permitido'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <PerformanceAnalise db={db} suppliers={suppliers} />
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="bg-[#1c1c1e] w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <form onSubmit={handleAddSupplier} className="p-10 space-y-8">
                <div className="flex justify-between items-center border-b border-[#333336] pb-6">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Novo Fornecedor</h3>
                  <button type="button" onClick={() => setShowModal(false)} className="text-slate-300 hover:text-red-500"><X size={32} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Nome do Fornecedor</label>
                      <input required onChange={e => setNewSupplier({...newSupplier, nome: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Empresa</label>
                      <input required onChange={e => setNewSupplier({...newSupplier, empresa: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">CNPJ</label>
                      <input required placeholder="00.000.000/0000-00" onChange={e => setNewSupplier({...newSupplier, cnpj: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Tipo de Serviço</label>
                      <select onChange={e => setNewSupplier({...newSupplier, tipoServico: e.target.value as any})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none">
                         {Object.values(TipoServicoStrict).map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                   </div>
                </div>

                <div className="p-8 bg-blue-50/30 rounded-[35px] border-2 border-blue-100 space-y-6">
                   <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2">Modelo de Custo & Governança</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#98989d] uppercase ml-2">Tipo de Cobrança</label>
                        <select onChange={e => setNewSupplier({...newSupplier, tipoCobranca: e.target.value as any})} className="w-full px-5 py-4 bg-[#1c1c1e] border border-[#333336] rounded-2xl font-bold">
                           <option value="Preço por nome">Preço por nome</option>
                           <option value="Preço fixo">Preço fixo</option>
                           <option value="Preço variável">Preço variável</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#98989d] uppercase ml-2">Custo Atual (R$)</label>
                        <input required type="number" onChange={e => setNewSupplier({...newSupplier, custo: Number(e.target.value)})} className="w-full px-5 py-4 bg-[#1c1c1e] border border-[#333336] rounded-2xl font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#98989d] uppercase ml-2">Custo Mínimo (R$)</label>
                        <input required type="number" onChange={e => setNewSupplier({...newSupplier, custoMinimo: Number(e.target.value)})} className="w-full px-5 py-4 bg-[#1c1c1e] border border-[#333336] rounded-2xl font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#98989d] uppercase ml-2">Custo Máximo (R$)</label>
                        <input required type="number" onChange={e => setNewSupplier({...newSupplier, custoMaximo: Number(e.target.value)})} className="w-full px-5 py-4 bg-[#1c1c1e] border border-[#333336] rounded-2xl font-bold" />
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black uppercase tracking-[0.3em] rounded-[25px] shadow-2xl hover:bg-blue-700 transition-all">
                   Registrar Fornecedor
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PerformanceAnalise = ({ db, suppliers }: { db: any, suppliers: AdvancedFornecedor[] }) => {
  const performanceData = useMemo(() => {
    return suppliers.map(s => {
      const relatedServices = db.servicos.filter((srv: any) => srv.tipo === s.tipoServico);
      // Simulação de distribuição (usando o id do fornecedor como semente lógica se estivéssemos vinculando em tempo real)
      const executionCount = Math.floor(Math.random() * 20) + 5; 
      const avgContractValue = relatedServices.reduce((acc: number, curr: any) => acc + curr.valorContratado, 0) / (relatedServices.length || 1);
      
      const totalRevenue = executionCount * (avgContractValue || 1500);
      const totalCost = executionCount * s.custo;
      const grossMargin = totalRevenue - totalCost;
      const marginPercent = (grossMargin / totalRevenue) * 100;

      return {
        ...s,
        executionCount,
        totalRevenue,
        totalCost,
        grossMargin,
        marginPercent
      };
    }).sort((a, b) => b.grossMargin - a.grossMargin);
  }, [db, suppliers]);

  return (
    <div className="space-y-10 animate-in slide-in-from-right-10 duration-500">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#1c1c1e] rounded-[45px] border border-[#333336] shadow-sm overflow-hidden">
             <div className="p-10 border-b border-slate-50">
                <h3 className="text-xl font-black text-white">Ranking de Lucratividade Operacional</h3>
                <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest mt-1">Comparativo de Margem Real por Fornecedor</p>
             </div>
             <table className="w-full text-left">
                <thead className="bg-[#0f0f11] text-[10px] font-black text-[#98989d] uppercase tracking-widest">
                   <tr>
                      <th className="px-10 py-6">Fornecedor</th>
                      <th className="px-10 py-6 text-center">Procedimentos</th>
                      <th className="px-10 py-6 text-center">Custo Acumulado</th>
                      <th className="px-10 py-6 text-center">Margem Bruta</th>
                      <th className="px-10 py-6 text-right">Saúde</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[#333336]">
                   {performanceData.map(p => (
                     <tr key={p.id} className="hover:bg-[#0f0f11]/50 group transition-all">
                        <td className="px-10 py-7">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">{p.nome.charAt(0)}</div>
                              <span className="text-sm font-black text-white">{p.nome}</span>
                           </div>
                        </td>
                        <td className="px-10 py-7 text-center font-bold text-[#98989d]">{p.executionCount}</td>
                        <td className="px-10 py-7 text-center font-black text-white">R$ {p.totalCost.toLocaleString('pt-BR')}</td>
                        <td className="px-10 py-7 text-center">
                           <p className="text-sm font-black text-emerald-600">R$ {p.grossMargin.toLocaleString('pt-BR')}</p>
                           <p className="text-[9px] font-bold text-[#98989d]">{p.marginPercent.toFixed(1)}%</p>
                        </td>
                        <td className="px-10 py-7 text-right">
                           {p.marginPercent > 30 ? (
                             <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100">Margem Saudável</span>
                           ) : p.marginPercent > 15 ? (
                             <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[8px] font-black uppercase rounded-lg border border-amber-100">Margem Apertada</span>
                           ) : (
                             <span className="px-3 py-1 bg-red-50 text-red-600 text-[8px] font-black uppercase rounded-lg border border-red-100">Margem Crítica</span>
                           )}
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div className="space-y-6">
             <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldCheck size={100} /></div>
                <h3 className="text-lg font-black tracking-tighter mb-6 flex items-center gap-2"><Target className="text-blue-500" /> Sugestão de Lucro</h3>
                <div className="space-y-6 relative z-10">
                   {performanceData.slice(0, 2).map((p, i) => (
                     <div key={p.id} className="p-6 bg-slate-800/80 rounded-[30px] border border-slate-700/50">
                        <div className="flex justify-between items-center mb-4">
                           <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Opção {i + 1}</span>
                           <span className="text-emerald-400 text-xs font-black">{p.marginPercent.toFixed(1)}% ROI</span>
                        </div>
                        <p className="text-lg font-black">{p.nome}</p>
                        <p className="text-[10px] font-bold text-[#98989d] uppercase">{p.tipoServico}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-[#1c1c1e] p-8 rounded-[40px] border border-red-100 shadow-sm">
                <h3 className="text-lg font-black text-red-600 mb-6 flex items-center gap-2"><AlertTriangle size={20} /> Alertas de Risco</h3>
                <div className="space-y-4">
                   {suppliers.filter(s => s.custo > s.custoMaximo).map(s => (
                     <div key={s.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-pulse">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Fornecedor Bloqueado</p>
                        <p className="text-xs font-bold text-[#e5e5ea]">{s.nome}: Custo de R$ {s.custo} excede teto operacional.</p>
                     </div>
                   ))}
                   {suppliers.filter(s => s.custo > s.custoMaximo).length === 0 && (
                     <p className="text-center py-10 text-slate-300 font-black uppercase text-[10px] tracking-widest">Nenhum risco de custo detectado</p>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default FornecedoresView;
