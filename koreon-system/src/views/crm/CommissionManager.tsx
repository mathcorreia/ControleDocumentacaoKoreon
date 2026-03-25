import React, { useEffect, useState } from 'react';
import { 
  UserCheck, Wallet, CheckCircle2, Clock, 
  Search, Filter, Download, ExternalLink,
  CreditCard, Banknote, Receipt
} from 'lucide-react';
import { formatCurrency, cn } from '../utils/utils';

interface Commission {
  id: string;
  createdAt: string;
  status: 'pendente' | 'pago';
  commission: number;
  commissionValue: number;
  commissionType: string;
  commissionInstallments: number;
  paidAt?: string;
  paymentMethod?: string;
  affiliate?: { name: string };
  referrer?: { name: string };
  referredClient: { name: string };
}

export default function CommissionManager() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = () => {
    setLoading(true);
    fetch('/api/financial/commissions')
      .then(res => res.json())
      .then(data => {
        setCommissions(data);
        setLoading(false);
      });
  };

  const handlePay = (id: string) => {
    const paymentMethod = prompt("Forma de pagamento (Pix, Transferência, Dinheiro):", "Pix");
    if (!paymentMethod) return;

    setPaying(id);
    fetch(`/api/financial/commissions/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod })
    })
    .then(res => res.json())
    .then(() => {
      fetchCommissions();
      setPaying(null);
    });
  };

  const totalPending = commissions
    .filter(c => c.status === 'pendente')
    .reduce((acc, c) => acc + c.commission, 0);
  
  const totalPaid = commissions
    .filter(c => c.status === 'pago')
    .reduce((acc, c) => acc + c.commission, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Comissões</h2>
          <p className="text-slate-500 text-sm">Controle de pagamentos para afiliados e indicadores</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium">
          <Download size={18} />
          Exportar Lista
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pendente</p>
          </div>
          <h3 className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pago</p>
          </div>
          <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserCheck size={20} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comissões Geradas</p>
          </div>
          <h3 className="text-2xl font-bold text-indigo-600">{commissions.length}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Afiliado / Indicador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente Indicado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4"><div className="h-8 bg-slate-50 rounded"></div></td>
                  </tr>
                ))
              ) : commissions.map((comm) => (
                <tr key={comm.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {(comm.affiliate?.name || comm.referrer?.name || '?')[0]}
                      </div>
                      <p className="text-sm font-bold text-slate-800">
                        {comm.affiliate?.name || comm.referrer?.name || 'Sistema'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{comm.referredClient?.name || 'Cliente Desconhecido'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-indigo-600">{formatCurrency(comm.commission)}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {comm.commissionType === 'upfront' ? 'À Vista' : `${comm.commissionInstallments}x`}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      comm.status === 'pago' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      {comm.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {comm.status === 'pago' ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <CreditCard size={12} />
                          <span className="text-xs font-medium">{comm.paymentMethod}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {comm.paidAt ? new Date(comm.paidAt).toLocaleDateString('pt-BR') : '-'}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Aguardando</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {comm.status === 'pendente' ? (
                      <button 
                        onClick={() => handlePay(comm.id)}
                        disabled={paying === comm.id}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {paying === comm.id ? 'Processando...' : 'Marcar como Pago'}
                      </button>
                    ) : (
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <Receipt size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
