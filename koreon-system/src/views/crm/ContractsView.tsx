import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { formatCurrency, cn } from '../../utils/utils';

export default function ContractsView({ db }: { db: any }) {
  // Mapeia os serviços (contratos) do banco de dados local
  const contracts = db.servicos.map((srv: any) => {
    const client = db.clientes.find((c: any) => c.id === srv.clienteId);
    return { ...srv, client };
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Contratos Ativos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {contracts.map((contract: any) => (
          <div key={contract.id} className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336]">
            <div className="flex justify-between mb-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><FileText size={24} /></div>
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500">
                {contract.status}
              </span>
            </div>
            <p className="text-xs text-[#98989d] uppercase font-bold">Cliente</p>
            <h3 className="font-bold text-white mb-4">{contract.client?.nome || 'Não identificado'}</h3>
            <div className="grid grid-cols-2 gap-4 border-t border-[#333336] pt-4">
              <div>
                <p className="text-xs text-[#98989d]">Valor</p>
                <p className="font-bold text-indigo-400">{formatCurrency(contract.valorContratado)}</p>
              </div>
              <div>
                <p className="text-xs text-[#98989d]">Progresso</p>
                <p className="font-bold text-white">{contract.progresso}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}