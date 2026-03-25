import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, CheckCircle2, Clock, AlertCircle, UserCheck, Wallet } from 'lucide-react';
import { Contract } from '../types';
import { formatCurrency, cn } from '../utils/utils';

export default function ContractsView() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/contracts')
      .then(res => res.json())
      .then(data => {
        setContracts(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Contratos</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>)
        ) : contracts.map((contract) => (
          <div key={contract.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <FileText size={24} />
              </div>
              <span className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                contract.status === 'ativo' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
              )}>
                {contract.status}
              </span>
            </div>

            <div className="space-y-4 flex-grow">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cliente</p>
                <h3 className="font-bold text-lg">{contract.client?.name || 'Cliente Desconhecido'}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Valor Total</p>
                  <p className="font-bold text-indigo-600">{formatCurrency(contract.totalValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Parcelas</p>
                  <p className="font-bold">{contract.installmentsCount}x</p>
                </div>
              </div>

              {contract.client?.referralReceived && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <UserCheck size={14} />
                    <p className="text-[10px] font-bold uppercase tracking-wider">Indicação / Afiliado</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-amber-900">
                      {contract.client.referralReceived.affiliate?.name || contract.client.referralReceived.referrer?.name}
                    </p>
                    <div className="flex items-center gap-1 text-amber-600">
                      <Wallet size={12} />
                      <p className="text-xs font-bold">{formatCurrency(contract.client.referralReceived.commissionValue)}</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-amber-600 italic">
                    {contract.client.referralReceived.commissionType === 'upfront' 
                      ? 'Comissão paga no fechamento' 
                      : `Comissão parcelada em ${contract.client.referralReceived.commissionInstallments}x`}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex -space-x-2">
                  {contract.installments?.slice(0, 4).map((inst, i) => (
                    <div 
                      key={inst.id} 
                      className={cn(
                        "w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold",
                        inst.status === 'pago' ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                      )}
                    >
                      {inst.number}
                    </div>
                  ))}
                  {(contract.installments?.length || 0) > 4 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                      +{(contract.installments?.length || 0) - 4}
                    </div>
                  )}
                </div>
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-bold flex items-center gap-1">
                  Detalhes
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
