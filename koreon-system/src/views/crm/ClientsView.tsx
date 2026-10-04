import React, { useState } from 'react';
import { Filter, MoreHorizontal, Phone, Eye, Trash2 } from 'lucide-react';
import { formatCurrency, formatPhone, cn } from '../../utils/utils';
import ClientDetailsView from './ClientDetailsView';
import { saveDB } from '../../db';

export default function ClientsView({ db, setDb, searchQuery }: { db: any, setDb: any, searchQuery: string }) {
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtra os clientes localmente a partir do db
  const clients = db.clientes.filter((c: any) => 
    c.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.documento.includes(searchQuery)
  );

  const handleDelete = (id: string) => {
    const newDb = { ...db, clientes: db.clientes.filter((c: any) => c.id !== id) };
    setDb(newDb);
    saveDB(newDb);
    setDeletingId(null);
  };

  if (selectedClient) {
    return <ClientDetailsView client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Clientes (CRM)</h2>
        <button className="p-2 bg-[#1c1c1e] border border-[#333336] rounded-lg text-[#98989d]">
          <Filter size={20} />
        </button>
      </div>

      <div className="bg-[#1c1c1e] rounded-2xl border border-[#333336] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0f0f11] border-b border-[#333336]">
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase">Financeiro</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333336]">
            {clients.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-[#98989d]">Nenhum cliente no banco de dados.</td></tr>
            ) : (
              clients.map((client: any) => (
                <tr key={client.id} className="hover:bg-[#0f0f11] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{client.nome}</p>
                    <p className="text-xs text-[#98989d]">{formatPhone(client.telefone)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-900/20 text-blue-400">
                      {client.prioridade || 'Normal'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    Score de Risco: {client.riskScore}%
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelectedClient(client)} className="p-2 text-indigo-400"><Eye size={18} /></button>
                      <button onClick={() => setDeletingId(client.id)} className="p-2 text-red-400"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}