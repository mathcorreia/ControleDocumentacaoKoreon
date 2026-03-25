
import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, Filter, Search, MoreVertical, 
  Calendar, CheckCircle2, Clock, AlertCircle, ArrowUpRight, Plus
} from 'lucide-react';
/* Fix imports: updated types and enums to match types.ts */
import { Pagamento as Payment, StatusPagamento as PaymentStatus } from '../../types';

interface FinancialViewProps {
  db: any;
  setDb: (db: any) => void;
}

const FinancialView: React.FC<FinancialViewProps> = ({ db }) => {
  /* Fix: updated default ALL filter and enum usage */
  const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  /* Fix property: db.pagamentos */
  const filteredPayments = (db.pagamentos || []).filter((p: Payment) => 
    filter === 'ALL' || p.status === filter
  );

  /* Fix properties: PaymentStatus.PAGO, valorParcela */
  const totalCollected = db.pagamentos
    .filter((p: any) => p.status === PaymentStatus.PAGO)
    .reduce((acc: number, curr: any) => acc + curr.valorParcela, 0);

  /* Fix properties: PaymentStatus.PENDENTE, valorParcela */
  const pendingAmount = db.pagamentos
    .filter((p: any) => p.status === PaymentStatus.PENDENTE)
    .reduce((acc: number, curr: any) => acc + curr.valorParcela, 0);

  /* Fix properties: PaymentStatus.ATRASADO, valorParcela */
  const overdueAmount = db.pagamentos
    .filter((p: any) => p.status === PaymentStatus.ATRASADO)
    .reduce((acc: number, curr: any) => acc + curr.valorParcela, 0);

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Collected" value={totalCollected} icon={CheckCircle2} color="bg-emerald-500" />
        <MetricCard title="Awaiting Payment" value={pendingAmount} icon={Clock} color="bg-blue-500" />
        <MetricCard title="Overdue Balance" value={overdueAmount} icon={AlertCircle} color="bg-red-500" urgent />
      </div>

      <div className="bg-[#1c1c1e] rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
            <p className="text-sm text-gray-500 mt-1">Detailed overview of all installments and payments</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Fix enums: StatusPagamento values */}
            {['ALL', PaymentStatus.PAGO, PaymentStatus.PENDENTE, PaymentStatus.ATRASADO].map(st => (
              <button 
                key={st}
                onClick={() => setFilter(st as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === st ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
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
              <tr className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-8 py-5">Client</th>
                <th className="px-8 py-5">Service</th>
                <th className="px-8 py-5">Installment</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Due Date</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.map((payment: Payment) => {
                /* Fix properties: db.clientes, db.servicos */
                const client = db.clientes.find((c: any) => c.id === payment.clienteId);
                const service = db.servicos.find((s: any) => s.id === payment.servicoId);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <p className="font-bold text-gray-900">{client?.nome}</p>
                    </td>
                    <td className="px-8 py-5 text-sm text-gray-500">{service?.tipo}</td>
                    <td className="px-8 py-5">
                      {/* Fix properties: numParcela, qtdParcelas */}
                      <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                        {payment.numParcela} / {payment.qtdParcelas}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {/* Fix property: valorParcela */}
                      <p className="font-bold text-gray-900">${payment.valorParcela.toFixed(2)}</p>
                    </td>
                    <td className="px-8 py-5">
                      {/* Fix property: dataVencimento */}
                      <p className="text-sm text-gray-500 flex items-center gap-1.5"><Calendar size={14} /> {payment.dataVencimento}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        payment.status === PaymentStatus.PAGO ? 'bg-emerald-50 text-emerald-600' :
                        payment.status === PaymentStatus.ATRASADO ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg">
                        <ArrowUpRight size={18} />
                      </button>
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
};

const MetricCard = ({ title, value, icon: Icon, color, urgent }: any) => (
  <div className={`p-8 rounded-3xl bg-[#1c1c1e] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-all ${urgent ? 'ring-2 ring-red-50' : ''}`}>
    <div className={`absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform ${color.replace('bg-', 'text-')}`}>
      <Icon size={120} />
    </div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-2">{title}</p>
        <h4 className="text-3xl font-bold text-gray-900 tracking-tight">${value.toLocaleString()}</h4>
      </div>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default FinancialView;
