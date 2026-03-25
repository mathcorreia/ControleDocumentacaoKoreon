
import React, { useState } from 'react';
import { 
  Filter, Search, Clock, CheckCircle2, AlertCircle, 
  ArrowUpRight, MoreVertical
} from 'lucide-react';
import { ServicoContratado, StatusServico } from '../../types';

interface ServicosViewProps {
  db: any;
  setDb: (db: any) => void;
}

const ServicosView: React.FC<ServicosViewProps> = ({ db }) => {
  const [filtroStatus, setFiltroStatus] = useState<StatusServico | 'TODOS'>('TODOS');
  const [busca, setBusca] = useState('');

  const servicos = db.servicos.filter((s: ServicoContratado) => {
    const statusOk = filtroStatus === 'TODOS' || s.status === filtroStatus;
    const cliente = db.clientes.find((c: any) => c.id === s.clienteId);
    const buscaOk = cliente?.nome.toLowerCase().includes(busca.toLowerCase()) || 
                   s.tipo.toLowerCase().includes(busca.toLowerCase());
    return statusOk && buscaOk;
  });

  return (
    <div className="space-y-10">
      {/* Mini Cards de Operação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatusCard label="Em Andamento" value={db.servicos.filter((s: any) => s.status === StatusServico.EM_ANDAMENTO).length} icon={Clock} color="text-blue-600" bg="bg-blue-50" />
        <StatusCard label="Baixas Concluídas" value={db.servicos.filter((s: any) => s.status === StatusServico.CONCLUIDO).length} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <StatusCard label="Serviços Críticos" value={db.servicos.filter((s: any) => s.status === StatusServico.ATRASADO).length} icon={AlertCircle} color="text-red-600" bg="bg-red-50" pulse />
      </div>

      {/* Filtros */}
      <div className="bg-[#1c1c1e] p-6 rounded-[32px] border border-[#333336] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-wrap gap-3">
          {['TODOS', StatusServico.INICIO, StatusServico.EM_ANDAMENTO, StatusServico.FASE_FINAL, StatusServico.CONCLUIDO, StatusServico.ATRASADO].map(st => (
            <button
              key={st}
              onClick={() => setFiltroStatus(st as any)}
              className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                filtroStatus === st ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-[#0f0f11] text-[#98989d] hover:bg-[#0f0f11]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar serviço ou cliente..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-12 pr-6 py-3.5 bg-[#0f0f11] border-none rounded-2xl text-sm w-full lg:w-96 outline-none font-medium focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      {/* Tabela de Operações */}
      <div className="bg-[#1c1c1e] rounded-[45px] border border-[#333336] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0f0f11]/50 text-[10px] font-black text-[#98989d] uppercase tracking-widest">
                <th className="px-10 py-7">Cliente & Serviço</th>
                <th className="px-10 py-7">Status</th>
                <th className="px-10 py-7">Andamento</th>
                <th className="px-10 py-7">Responsável</th>
                <th className="px-10 py-7">Prazo Final</th>
                <th className="px-10 py-7 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333336]">
              {servicos.map((s: ServicoContratado) => {
                const cliente = db.clientes.find((c: any) => c.id === s.clienteId);
                return (
                  <tr key={s.id} className="hover:bg-[#0f0f11]/50 transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-[#0f0f11] flex items-center justify-center font-black text-[#98989d] shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {cliente?.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-white tracking-tight uppercase">{s.tipo}</p>
                          <p className="text-[11px] font-bold text-[#98989d] tracking-tight">{cliente?.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-7">
                      <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                        s.status === StatusServico.CONCLUIDO ? 'bg-emerald-100 text-emerald-700' :
                        s.status === StatusServico.ATRASADO ? 'bg-red-100 text-red-700 animate-pulse' :
                        s.status === StatusServico.EM_ANDAMENTO ? 'bg-blue-100 text-blue-700' : 'bg-[#0f0f11] text-[#e5e5ea]'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-10 py-7">
                      <div className="w-40 space-y-2">
                        <div className="w-full h-2 bg-[#0f0f11] rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              s.status === StatusServico.ATRASADO ? 'bg-red-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${s.progresso}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-black text-[#98989d] uppercase tracking-tighter">{s.progresso}% Completo</p>
                      </div>
                    </td>
                    <td className="px-10 py-7 text-sm font-black text-slate-600 uppercase tracking-tighter">
                      {s.responsavel}
                    </td>
                    <td className="px-10 py-7">
                      <p className="text-sm font-bold text-[#98989d] flex items-center gap-2">
                        <Clock size={16} className="text-slate-300" /> {s.prazoAcordado}
                      </p>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <button className="p-3 text-slate-300 hover:text-blue-600 rounded-2xl hover:bg-blue-50 transition-all">
                        <MoreVertical size={22} />
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

const StatusCard = ({ label, value, icon: Icon, color, bg, pulse }: any) => (
  <div className={`p-8 rounded-[40px] ${bg} shadow-sm border border-transparent hover:border-white transition-all flex items-center gap-6`}>
    <div className={`w-16 h-16 rounded-[22px] bg-[#1c1c1e] flex items-center justify-center ${color} shadow-lg shadow-current/10 ${pulse ? 'animate-pulse' : ''}`}>
      <Icon size={30} />
    </div>
    <div>
      <p className="text-[11px] font-black text-[#98989d] uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{value}</p>
    </div>
  </div>
);

export default ServicosView;
