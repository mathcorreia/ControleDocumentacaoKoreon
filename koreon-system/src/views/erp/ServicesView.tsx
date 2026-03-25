
import React, { useState } from 'react';
import { 
  Filter, Search, Clock, CheckCircle2, AlertCircle, 
  ArrowUpRight, Users, Eye, MoreVertical, LayoutGrid, List as ListIcon
} from 'lucide-react';
/* Fix imports: updated types and enums to match types.ts */
import { ServicoContratado as ContractedService, StatusServico as ServiceStatus } from '../../types';

interface ServicesViewProps {
  db: any;
  setDb: (db: any) => void;
}

const ServicesView: React.FC<ServicesViewProps> = ({ db }) => {
  /* Fix: updated default ALL filter and enum usage */
  const [filterStatus, setFilterStatus] = useState<ServiceStatus | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  /* Fix property: db.services to db.servicos, db.clients to db.clientes */
  const services = (db.servicos || []).filter((s: ContractedService) => {
    const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
    const client = db.clientes.find((c: any) => c.id === s.clienteId);
    const matchesSearch = client?.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">In Progress</p>
            <p className="text-2xl font-bold text-gray-900">
              {/* Fix enum: ServiceStatus.EM_ANDAMENTO */}
              {db.servicos.filter((s: any) => s.status === ServiceStatus.EM_ANDAMENTO).length}
            </p>
          </div>
        </div>
        <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Completed</p>
            <p className="text-2xl font-bold text-gray-900">
              {/* Fix enum: ServiceStatus.CONCLUIDO */}
              {db.servicos.filter((s: any) => s.status === ServiceStatus.CONCLUIDO).length}
            </p>
          </div>
        </div>
        <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center animate-pulse">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Delayed</p>
            <p className="text-2xl font-bold text-gray-900">
              {/* Fix enum: ServiceStatus.ATRASADO */}
              {db.servicos.filter((s: any) => s.status === ServiceStatus.ATRASADO).length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters Header */}
      <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {/* Fix enum values: mapped English statuses to Portuguese enums from types.ts */}
          {['ALL', ServiceStatus.INICIO, ServiceStatus.EM_ANDAMENTO, ServiceStatus.FASE_FINAL, ServiceStatus.CONCLUIDO, ServiceStatus.ATRASADO].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterStatus === status 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search service or client..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm w-full lg:w-72 outline-none"
          />
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-[#1c1c1e] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="px-8 py-5">Client & Service</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5">Progress</th>
                <th className="px-8 py-5">Responsible</th>
                <th className="px-8 py-5">Deadline</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {services.map((service: ContractedService) => {
                /* Fix property: db.clients to db.clientes */
                const client = db.clientes.find((c: any) => c.id === service.clienteId);
                return (
                  <tr key={service.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500">
                          {client?.nome.charAt(0)}
                        </div>
                        <div>
                          {/* // FIX: Changed service.type to service.tipo to match the interface definition in types.ts */}
                          <p className="font-bold text-gray-900">{service.tipo}</p>
                          <p className="text-xs text-gray-500">{client?.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        service.status === ServiceStatus.CONCLUIDO ? 'bg-green-100 text-green-700' :
                        service.status === ServiceStatus.ATRASADO ? 'bg-red-100 text-red-700' :
                        service.status === ServiceStatus.EM_ANDAMENTO ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="w-32 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                          {/* Fix property: progress to progresso */}
                          <span>{service.progresso}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              service.status === ServiceStatus.ATRASADO ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            /* Fix property: progress to progresso */
                            style={{ width: `${service.progresso}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-gray-600">
                      {/* Fix property: responsible to responsavel */}
                      {service.responsavel}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        {/* Fix property: deadline to prazoAcordado */}
                        <Clock size={14} /> {service.prazoAcordado}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <MoreVertical size={18} />
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

export default ServicesView;
