
import React, { useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Filter, Search, MoreVertical, 
  Calendar, CheckCircle2, Clock, AlertCircle, ArrowUpRight, Plus, 
  MessageCircle, Send, ShieldAlert, CreditCard, CheckSquare, AlertTriangle
} from 'lucide-react';
import { Pagamento, StatusPagamento } from '../types';

interface FinanceiroViewProps {
  db: any;
  setDb: (db: any) => void;
}

const FinanceiroView: React.FC<FinanceiroViewProps> = ({ db }) => {
  const [filtro, setFiltro] = useState<StatusPagamento | 'TODOS'>('TODOS');
  const [activeView, setActiveView] = useState<'geral' | 'boletos'>('geral');
  const [filtroBoleto, setFiltroBoleto] = useState<'EM_DIA' | 'ATRASO' | 'INADIMPLENTE' | 'PAGAS'>('EM_DIA');

  const pagamentosFiltradosGeral = db.pagamentos.filter((p: Pagamento) => 
    filtro === 'TODOS' || p.status === filtro
  );

  const pagamentosBoleto = useMemo(() => {
    return (db.pagamentos || []).filter((p: Pagamento) => {
      const isPaid = p.status === StatusPagamento.PAGO;
      const isOverdue = p.status === StatusPagamento.ATRASADO || (p.status === StatusPagamento.PENDENTE && new Date(p.dataVencimento) < new Date());
      const diffTime = Math.abs(new Date().getTime() - new Date(p.dataVencimento).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (filtroBoleto === 'PAGAS') return isPaid;
      if (filtroBoleto === 'EM_DIA') return !isPaid && !isOverdue;
      if (filtroBoleto === 'ATRASO') return isOverdue && diffDays <= 30;
      if (filtroBoleto === 'INADIMPLENTE') return isOverdue && diffDays > 30;
      return false;
    });
  }, [db.pagamentos, filtroBoleto]);

  const totalRecebido = db.pagamentos
    .filter((p: any) => p.status === StatusPagamento.PAGO)
    .reduce((acc: number, curr: any) => acc + curr.valorParcela, 0);

  const totalPendente = db.pagamentos
    .filter((p: any) => p.status === StatusPagamento.PENDENTE)
    .reduce((acc: number, curr: any) => acc + curr.valorParcela, 0);

  const totalAtrasado = db.pagamentos
    .filter((p: any) => p.status === StatusPagamento.ATRASADO || (p.status === StatusPagamento.PENDENTE && new Date(p.dataVencimento) < new Date()))
    .reduce((acc: number, curr: any) => acc + curr.valorParcela, 0);

  const formatCurrency = (val: number) => 
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleCobrancaWhats = (pag: Pagamento) => {
    const cliente = db.clientes.find((c: any) => c.id === pag.clienteId);
    if (!cliente) return;

    const fone = cliente.telefone.replace(/\D/g, '');
    let msg = "";

    const valorStr = formatCurrency(pag.valorParcela);
    const vencStr = new Date(pag.dataVencimento).toLocaleDateString('pt-BR');

    if (filtroBoleto === 'EM_DIA') {
      msg = `Olá, ${cliente.nome}. Sua parcela ${pag.numParcela} no valor de ${valorStr} está próxima do vencimento (${vencStr}).\n\nPara manter seu procedimento ativo e sem interrupções, realize o pagamento via PIX: (CHAVE PIX AQUI).`;
    } else if (filtroBoleto === 'ATRASO') {
      msg = `Olá, ${cliente.nome}. Notamos que sua parcela ${pag.numParcela} de ${valorStr} encontra-se em atraso.\n\nRegularize o pagamento via PIX: (CHAVE PIX AQUI) para evitar o bloqueio dos serviços contratados e a suspensão do seu processo.`;
    } else if (filtroBoleto === 'INADIMPLENTE') {
      msg = `Olá, ${cliente.nome}. URGENTE: Sua parcela ${pag.numParcela} de ${valorStr} está em INADIMPLÊNCIA.\n\nO procedimento será SUSPENSO imediatamente e o valor em débito poderá ser PROTESTADO em cartório, conforme cláusula contratual. Regularize agora via PIX: (CHAVE PIX AQUI).`;
    }

    const url = `https://wa.me/${fone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex gap-4 p-1.5 bg-slate-100 w-fit rounded-3xl mb-4">
        <button 
          onClick={() => setActiveView('geral')}
          className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'geral' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Visão Geral
        </button>
        <button 
          onClick={() => setActiveView('boletos')}
          className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeView === 'boletos' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Controle de Boletos / Parcelas
        </button>
      </div>

      {activeView === 'geral' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <MetricCard title="Total Recebido" value={formatCurrency(totalRecebido)} icon={CheckCircle2} color="bg-emerald-500" />
            <MetricCard title="A Receber (Persistido)" value={formatCurrency(totalPendente)} icon={Clock} color="bg-blue-600" />
            <MetricCard title="Inadimplência Real" value={formatCurrency(totalAtrasado)} icon={AlertCircle} color="bg-red-500" urgent />
          </div>

          <div className="bg-white rounded-[45px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Fluxo de Caixa de Contratos</h3>
                <p className="text-sm text-slate-400 font-bold mt-2 italic">Valores reais extraídos dos contratos individuais persistidos</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {['TODOS', 'Pago', 'Pendente', 'Atrasado'].map(st => (
                  <button 
                    key={st}
                    onClick={() => setFiltro(st as any)}
                    className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                      filtro === st ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-10 py-6">Cliente</th>
                    <th className="px-10 py-6">Contrato</th>
                    <th className="px-10 py-6">Parcela</th>
                    <th className="px-10 py-6">Valor</th>
                    <th className="px-10 py-6">Vencimento</th>
                    <th className="px-10 py-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pagamentosFiltradosGeral.map((pag: Pagamento) => {
                    const cliente = db.clientes.find((c: any) => c.id === pag.clienteId);
                    const servico = db.servicos.find((s: any) => s.id === pag.servicoId);
                    return (
                      <tr key={pag.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-10 py-6 font-black text-slate-800">{cliente?.nome}</td>
                        <td className="px-10 py-6 text-[10px] font-black text-blue-600 uppercase tracking-widest">{servico?.tipo}</td>
                        <td className="px-10 py-6 text-xs font-black text-slate-500">{pag.numParcela} / {pag.qtdParcelas}</td>
                        <td className="px-10 py-6 font-black text-slate-900">{formatCurrency(pag.valorParcela)}</td>
                        <td className="px-10 py-6 text-sm font-bold text-slate-400">{pag.dataVencimento}</td>
                        <td className="px-10 py-6 text-right">
                           {/* // FIX: Removed redundant status check to avoid type overlap error in line 148 */}
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${
                             pag.status === StatusPagamento.PAGO ? 'bg-emerald-50 text-emerald-600' : 
                             (new Date(pag.dataVencimento) < new Date()) ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                           }`}>{pag.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="animate-in slide-in-from-right-10 duration-500 space-y-8">
           <div className="flex flex-wrap gap-4">
              {[
                { id: 'EM_DIA', label: 'Parcelas em Dia', icon: CheckCircle2, color: 'text-blue-600' },
                { id: 'ATRASO', label: 'Parcelas em Atraso', icon: Clock, color: 'text-amber-600' },
                { id: 'INADIMPLENTE', label: 'Inadimplentes', icon: ShieldAlert, color: 'text-red-600' },
                { id: 'PAGAS', label: 'Pagas', icon: DollarSign, color: 'text-emerald-600' }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => setFiltroBoleto(t.id as any)}
                  className={`px-8 py-6 rounded-[35px] border-2 transition-all flex items-center gap-4 ${
                    filtroBoleto === t.id ? 'bg-white border-blue-600 shadow-xl scale-105' : 'bg-slate-50 border-transparent text-slate-400'
                  }`}
                >
                  <t.icon className={filtroBoleto === t.id ? t.color : ''} size={24} />
                  <span className="font-black uppercase text-[10px] tracking-[0.2em]">{t.label}</span>
                </button>
              ))}
           </div>

           <div className="bg-white rounded-[45px] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-10 py-6">Cliente</th>
                      <th className="px-10 py-6">Serviço / Parcela</th>
                      <th className="px-10 py-6">Vencimento</th>
                      <th className="px-10 py-6">Valor Parcela</th>
                      <th className="px-10 py-6">Comprovante</th>
                      <th className="px-10 py-6 text-right">Automação Cobrança</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pagamentosBoleto.length > 0 ? pagamentosBoleto.map((p: Pagamento) => {
                      const cliente = db.clientes.find((c: any) => c.id === p.clienteId);
                      const servico = db.servicos.find((s: any) => s.id === p.servicoId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-10 py-6">
                             <p className="font-black text-slate-800">{cliente?.nome}</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cliente?.documento}</p>
                          </td>
                          <td className="px-10 py-6">
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{servico?.tipo}</p>
                             <p className="text-xs font-bold text-slate-500">Parcela {p.numParcela} de {p.qtdParcelas}</p>
                          </td>
                          <td className="px-10 py-6 text-sm font-bold text-slate-400">{p.dataVencimento}</td>
                          <td className="px-10 py-6 font-black text-slate-900">{formatCurrency(p.valorParcela)}</td>
                          <td className="px-10 py-6">
                            {p.comprovanteId ? (
                              <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[9px] uppercase">
                                {/* // FIX: Corrected missing import for CheckSquare icon */}
                                <CheckSquare size={14} /> Anexado
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-red-400 font-black text-[9px] uppercase">
                                {/* // FIX: Corrected missing import for AlertTriangle icon */}
                                <AlertTriangle size={14} /> Ausente
                              </span>
                            )}
                          </td>
                          <td className="px-10 py-6 text-right">
                             {filtroBoleto !== 'PAGAS' && (
                               <button 
                                onClick={() => handleCobrancaWhats(p)}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 flex items-center gap-2 ml-auto shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
                               >
                                <MessageCircle size={14} /> Cobrar WhatsApp
                               </button>
                             )}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={6} className="px-10 py-20 text-center text-slate-300 font-black uppercase text-xs tracking-widest">Nenhuma parcela neste status.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, urgent }: any) => (
  <div className={`p-10 rounded-[50px] bg-white border-2 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all ${urgent ? 'border-red-100 ring-4 ring-red-50/50' : 'border-white'}`}>
    <div className="flex items-start justify-between relative z-10">
      <div className="space-y-3">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
        <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{value}</h4>
      </div>
      <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-current/30 ${color}`}>
        <Icon size={32} />
      </div>
    </div>
  </div>
);

export default FinanceiroView;
