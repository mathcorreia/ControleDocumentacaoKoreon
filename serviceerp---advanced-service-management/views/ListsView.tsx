
import React, { useState } from 'react';
import { 
  Layers, ChevronRight, Clock, Plus, Filter, 
  Settings, CheckSquare, Search, Info, CheckCircle2,
  Calendar, Users, ArrowUpRight
} from 'lucide-react';
/* Fix imports: updated types and enums to match types.ts */
import { ListaProcessual as List, ListaOrgao as ListOrgan, StatusOrgao as OrganStatus } from '../../types';

interface ListsViewProps {
  db: any;
  setDb: (db: any) => void;
}

const ListsView: React.FC<ListsViewProps> = ({ db }) => {
  const [selectedList, setSelectedList] = useState<List | null>(null);

  if (selectedList) {
    /* Fix properties: db.listaOrgaos and db.clientesPorLista */
    const listOrgans = (db.listaOrgaos || []).filter((lo: ListOrgan) => lo.listaId === selectedList.id);
    const listClients = (db.clientesPorLista || []).filter((cbl: any) => cbl.listaId === selectedList.id);

    return (
      <div className="animate-in slide-in-from-right duration-300 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setSelectedList(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium"
          >
            <ChevronRight size={20} className="rotate-180" /> All Batch Lists
          </button>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#1c1c1e] border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-all">
              Batch Update
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
              Update Protocols
            </button>
          </div>
        </div>

        {/* Header Info */}
        <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Layers size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
               <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-blue-500/30">
                {/* Fix property: statusGeral */}
                {selectedList.statusGeral}
              </span>
              {/* Fix property: dataAbertura changed to dataInicio to match types.ts */}
              <span className="text-[#98989d] text-xs">• Created {selectedList.dataInicio}</span>
            </div>
            {/* Fix property: nome */}
            <h2 className="text-3xl font-bold mb-2">{selectedList.nome}</h2>
            {/* Fix property: observacoes */}
            <p className="text-[#98989d] max-w-xl">{selectedList.observacoes}</p>
          </div>
          
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10 border-t border-slate-800 pt-8">
             <div className="space-y-1">
              <p className="text-xs text-[#98989d] uppercase font-bold tracking-tighter">Service Type</p>
              {/* Fix property: tipoServico */}
              <p className="text-lg font-bold">{selectedList.tipoServico}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#98989d] uppercase font-bold tracking-tighter">Total Clients</p>
              <p className="text-lg font-bold">{listClients.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#98989d] uppercase font-bold tracking-tighter">Organs Connected</p>
              <p className="text-lg font-bold">{listOrgans.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#98989d] uppercase font-bold tracking-tighter">Completed</p>
              <p className="text-lg font-bold text-green-400">
                {/* Fix property: situacao */}
                {listClients.filter((c: any) => c.situacao === 'Baixado').length} / {listClients.length}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Organs Progress Column */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Layers size={20} className="text-blue-500" /> Organ Monitoring
            </h3>
            <div className="space-y-3">
              {listOrgans.map(organ => (
                <div key={organ.id} className="bg-[#1c1c1e] p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      organ.status === OrganStatus.CONCLUIDO ? 'bg-green-50 text-green-600' :
                      organ.status === OrganStatus.INICIADO ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'
                    }`}>
                      {organ.nomeOrgao.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{organ.nomeOrgao}</h4>
                      <p className="text-xs text-gray-400">{organ.status}</p>
                    </div>
                  </div>
                  {organ.status === OrganStatus.CONCLUIDO && <CheckCircle2 className="text-green-500" size={20} />}
                </div>
              ))}
              <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/30 transition-all font-medium flex items-center justify-center gap-2">
                <Plus size={18} /> Add Organ to Monitoring
              </button>
            </div>
          </div>

          {/* Client Progress Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-blue-500" /> Batch Clients
              </h3>
              <div className="flex gap-2">
                <button className="p-2 bg-gray-50 text-gray-400 rounded-lg"><Filter size={18} /></button>
                <button className="p-2 bg-gray-50 text-gray-400 rounded-lg"><Search size={18} /></button>
              </div>
            </div>
            
            <div className="bg-[#1c1c1e] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-6 py-4">Client</th>
                      <th className="px-6 py-4">Service</th>
                      <th className="px-6 py-4">List Status</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listClients.map((entry: any) => {
                      /* Fix properties: db.clientes and db.servicos */
                      const client = db.clientes.find((c: any) => c.id === entry.clienteId);
                      const service = db.servicos.find((s: any) => s.id === entry.servicoId);
                      return (
                        <tr key={entry.clienteId} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-bold text-gray-900">{client?.nome}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{service?.tipo}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-tight ${
                              entry.situacao === 'Baixado' ? 'bg-green-50 text-green-600' :
                              entry.situacao === 'Reprotocolo' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                              {entry.situacao}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button className="text-blue-600 hover:text-blue-800 transition-colors p-1">
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900">Process Monitoring</h2>
          <p className="text-sm text-gray-500 italic">Collective batch management (MDoze Style)</p>
        </div>
        <button className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">
          <Plus size={20} /> Create New Batch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fix property: db.listas */}
        {db.listas.map((list: List) => {
          /* Fix property: db.clientesPorLista */
          const clientCount = db.clientesPorLista.filter((c: any) => c.listaId === list.id).length;
          return (
            <div 
              key={list.id} 
              onClick={() => setSelectedList(list)}
              className="bg-[#1c1c1e] p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Layers size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                  list.statusGeral === '100% Baixado' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {list.statusGeral}
                </span>
              </div>
              
              {/* Fix property: nome, observacoes, tipoServico */}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{list.nome}</h3>
              <p className="text-sm text-gray-500 mb-6 flex-1">{list.observacoes}</p>
              
              <div className="grid grid-cols-2 gap-4 border-t border-gray-50 pt-6">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Service</p>
                  <p className="text-sm font-bold text-gray-700 truncate">{list.tipoServico}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Clients</p>
                  <p className="text-sm font-bold text-gray-700">{clientCount} enrolled</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
                {/* Fix property: ultimaAtualizacao */}
                <div className="flex items-center gap-1.5"><Clock size={14} /> Updated {list.ultimaAtualizacao}</div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ListsView;
