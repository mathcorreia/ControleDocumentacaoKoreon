import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  ArrowUpCircle, ArrowDownCircle, CheckCircle2, 
  Clock, AlertCircle, Wallet, DollarSign,
  Filter, Download
} from 'lucide-react';
import { formatCurrency, cn } from '../../utils/utils';

interface CalendarData {
  receivables: any[];
  payables: any[];
}

export default function AccountsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<CalendarData>({ receivables: [], payables: [] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'payables' | 'receivables'>('all');

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/financial/calendar?month=${month}&year=${year}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [month, year]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleMarkAsPaid = async (id: string, type: string) => {
    try {
      let url = '';
      let method = 'POST';
      if (type === 'expense') {
        url = `/api/expenses/${id}/pay`;
        method = 'PATCH';
      }
      else if (type === 'receivable' || type === 'installment') url = `/api/installments/${id}/pay`;
      else if (type === 'commission') url = `/api/financial/commissions/${id}/pay`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentDate: new Date().toISOString(), paymentMethod: 'Pix' })
      });

      if (res.ok) {
        fetchCalendar();
      } else {
        const error = await res.json();
        alert(`Erro: ${error.error || 'Não foi possível processar o pagamento'}`);
      }
    } catch (error) {
      alert("Erro de conexão ao processar pagamento.");
    }
  };

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const nextMonthDate = new Date(year, month + 1, 1);
  const nextMonthName = nextMonthDate.toLocaleString('pt-BR', { month: 'long' });

  const allItems = [
    ...data.receivables.map(r => ({ ...r, entryType: 'receivable', date: r.dueDate })),
    ...data.payables.map(p => ({ ...p, entryType: 'payable', date: p.dueDate }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filteredItems = allItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'payables') return item.entryType === 'payable';
    if (filter === 'receivables') return item.entryType === 'receivable';
    return true;
  });

  const totalReceivable = data.receivables
    .filter(r => r.status === 'pendente')
    .reduce((acc, r) => acc + r.value, 0);
  
  const totalPayable = data.payables
    .filter(p => p.status === 'pendente')
    .reduce((acc, p) => acc + p.value, 0);

  const [nextMonthStats, setNextMonthStats] = useState({ receivable: 0, payable: 0 });

  useEffect(() => {
    fetch(`/api/financial/calendar?month=${nextMonthDate.getMonth()}&year=${nextMonthDate.getFullYear()}`)
      .then(res => res.json())
      .then(json => {
        const rec = json.receivables.filter((r: any) => r.status === 'pendente').reduce((acc: number, r: any) => acc + r.value, 0);
        const pay = json.payables.filter((p: any) => p.status === 'pendente').reduce((acc: number, p: any) => acc + p.value, 0);
        setNextMonthStats({ receivable: rec, payable: pay });
      });
  }, [month, year]);

  return (
    <div className="space-y-6">
      {/* Next Month Quick Preview */}
      <div className="bg-indigo-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-indigo-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#1c1c1e]/20 rounded-xl">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h3 className="font-bold">Previsão para {nextMonthName}</h3>
            <p className="text-indigo-100 text-xs">Resumo do que está por vir no próximo mês</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">A Receber</p>
            <p className="text-xl font-bold">{formatCurrency(nextMonthStats.receivable)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-indigo-200 uppercase font-bold tracking-wider">A Pagar</p>
            <p className="text-xl font-bold">{formatCurrency(nextMonthStats.payable)}</p>
          </div>
          <button 
            onClick={() => setCurrentDate(nextMonthDate)}
            className="bg-[#1c1c1e] text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors"
          >
            Ver Detalhes
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#1c1c1e] border border-[#333336] rounded-xl p-1 shadow-sm">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-[#0f0f11] rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 py-1 flex flex-col items-center min-w-[120px]">
              <span className="text-sm font-bold capitalize">{monthName}</span>
              <span className="text-[10px] text-[#98989d] font-bold">{year}</span>
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-[#0f0f11] rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 p-1 bg-[#0f0f11] rounded-xl">
            <button 
              onClick={() => setFilter('all')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'all' ? "bg-[#1c1c1e] text-indigo-600 shadow-sm" : "text-[#98989d]")}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilter('receivables')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'receivables' ? "bg-[#1c1c1e] text-emerald-600 shadow-sm" : "text-[#98989d]")}
            >
              Receber
            </button>
            <button 
              onClick={() => setFilter('payables')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'payables' ? "bg-[#1c1c1e] text-rose-600 shadow-sm" : "text-[#98989d]")}
            >
              Pagar
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-[#98989d] uppercase font-bold tracking-wider">A Receber</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalReceivable)}</p>
          </div>
          <div className="text-right border-l border-[#333336] pl-6">
            <p className="text-[10px] text-[#98989d] uppercase font-bold tracking-wider">A Pagar</p>
            <p className="text-lg font-bold text-rose-600">{formatCurrency(totalPayable)}</p>
          </div>
          <div className="text-right border-l border-[#333336] pl-6">
            <p className="text-[10px] text-[#98989d] uppercase font-bold tracking-wider">Saldo Previsto</p>
            <p className="text-lg font-bold text-indigo-600">{formatCurrency(totalReceivable - totalPayable)}</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1c1c1e] rounded-2xl border border-[#333336] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f0f11] border-b border-[#333336]">
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Data Venc.</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Descrição / Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4"><div className="h-10 bg-[#0f0f11] rounded-lg"></div></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#98989d]">
                    Nenhum lançamento para este período.
                  </td>
                </tr>
              ) : filteredItems.map((item) => {
                const isOverdue = item.status === 'pendente' && new Date(item.date) < new Date();
                const isReceivable = item.entryType === 'receivable';
                
                return (
                  <tr key={item.id} className={cn(
                    "hover:bg-[#0f0f11] transition-colors",
                    isOverdue && item.status === 'pendente' ? "bg-rose-50/30" : ""
                  )}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#e5e5ea]">
                          {new Date(item.date).toLocaleDateString('pt-BR')}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-500 font-bold uppercase">Atrasado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        isReceivable ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {isReceivable ? <ArrowUpCircle size={12} /> : <ArrowDownCircle size={12} />}
                        {isReceivable ? 'Receber' : 'Pagar'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">
                          {item.description || item.contract?.client?.name || 'Lançamento'}
                        </span>
                        {isReceivable && (
                          <span className="text-[10px] text-[#98989d]">Parcela #{item.number}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-[#98989d] capitalize">{item.category || 'Geral'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        item.status === 'pago' ? "bg-emerald-50 text-emerald-600" :
                        isOverdue ? "bg-rose-100 text-rose-700" : "bg-amber-50 text-amber-600"
                      )}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn(
                        "text-sm font-bold",
                        isReceivable ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {isReceivable ? '+' : '-'} {formatCurrency(item.value)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        {item.status === 'pago' ? (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                            <CheckCircle2 size={16} />
                            Liquidado
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleMarkAsPaid(item.id, item.type || item.entryType)}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-lg transition-all shadow-sm font-bold text-xs",
                              isReceivable 
                                ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                                : "bg-rose-600 text-white hover:bg-rose-700"
                            )}
                          >
                            <CheckCircle2 size={16} />
                            {isReceivable ? 'Receber' : 'Pagar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
