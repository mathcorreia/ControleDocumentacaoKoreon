import React, { useEffect, useState } from 'react';
import { Search, Filter, MoreHorizontal, Phone, Mail, User, Eye, Trash2 } from 'lucide-react';
import { Client } from '../types';
import { formatCurrency, formatCPF, formatPhone, cn } from '../utils/utils';
import ClientDetailsView from './ClientDetailsView';

interface ClientsViewProps {
  searchQuery: string;
}

export default function ClientsView({ searchQuery }: ClientsViewProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/clients?search=${searchQuery}`)
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      });
  }, [searchQuery]);

  if (selectedClient) {
    return <ClientDetailsView client={selectedClient} onBack={() => setSelectedClient(null)} />;
  }

  return (
    <div className="space-y-6">      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Clientes</h2>
        <div className="flex gap-2">
          <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">CPF</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contratado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pago</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pendente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-6 py-4"><div className="h-12 bg-slate-100 rounded-lg"></div></td>
                </tr>
              ))
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">Nenhum cliente encontrado.</td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{client.name}</p>
                        <p className="text-xs text-slate-500">{formatPhone(client.phone)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatCPF(client.cpf)}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      client.status === 'fechado' ? "bg-emerald-50 text-emerald-600" :
                      client.status === 'negociação' ? "bg-amber-50 text-amber-600" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{formatCurrency(client.totalContracted)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-emerald-600">{formatCurrency(client.paid)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-red-600">{formatCurrency(client.pending)}</td>
                  <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {deletingId === client.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-100 animate-in fade-in zoom-in duration-200">
                            <span className="text-[10px] font-bold text-red-600 px-2">Excluir?</span>
                            <button 
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                try {
                                  const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
                                  if (res.ok) {
                                    setClients(prev => prev.filter(c => c.id !== client.id));
                                    setDeletingId(null);
                                  } else {
                                    const err = await res.json();
                                    alert(`Erro: ${err.error}`);
                                    setDeletingId(null);
                                  }
                                } catch (error) {
                                  alert('Erro de conexão');
                                  setDeletingId(null);
                                }
                              }}
                              className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                            >
                              Sim
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletingId(null);
                              }}
                              className="p-1.5 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 transition-colors"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => setSelectedClient(client)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Ver Detalhes"
                            >
                              <Eye size={20} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletingId(client.id);
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center"
                              title="Excluir Cliente"
                              type="button"
                            >
                              <Trash2 size={20} />
                            </button>
                          </>
                        )}
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreHorizontal size={20} />
                        </button>
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
