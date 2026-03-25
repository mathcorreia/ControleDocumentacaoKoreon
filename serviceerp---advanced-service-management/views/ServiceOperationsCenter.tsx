
import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, ChevronDown, ChevronRight, AlertCircle, 
  CheckCircle2, Clock, Lock, ShieldAlert, Zap, MoreHorizontal,
  Info, LayoutGrid, List
} from 'lucide-react';
import { 
  StatusServico, StatusPagamento, TipoServicoStrict, 
  Cliente, ServicoContratado, Pagamento, Documento 
} from '../../types';

const CHECKLIST_CONFIG: Record<string, string[]> = {
  [TipoServicoStrict.LIMPA_NOME]: ["Comprovante de Pagamento", "RG or CNH", "Comprovante de endereço", "Consulta inicial"],
  [TipoServicoStrict.SCORE]: ["Comprovante de Pagamento", "RG or CNH", "Comprovante de endereço", "Assinatura do Serasa Premium"],
  [TipoServicoStrict.RATING]: ["Comprovante de Pagamento", "RG (Frente e Verso)", "Comprovante de endereço", "Comprovante de Renda", "Login Gov.br", "Login Serasa", "Dados Bancários", "Ficha Cadastral"],
  [TipoServicoStrict.JUSBRASIL]: ["Comprovante de Pagamento", "RG (Frente e Verso)"],
  [TipoServicoStrict.REDUCAO]: ["Comprovante de Pagamento", "RG or CNH", "Contrato financiamento", "Extrato parcelas", "Senha Gov.br", "Demanda BACEN"],
  [TipoServicoStrict.LIMPA_TELA]: ["Comprovante de Pagamento", "RG or CNH", "Comprovante de endereço", "Prints da restrição"]
};

interface RowData {
  id: string;
  cliente: string;
  procedimento: TipoServicoStrict;
  statusOperacional: string;
  statusDocumental: 'Incompleto' | 'Parcial' | 'Completo';
  statusFinanceiro: 'Pago' | 'Parcial' | 'Inadimplente';
  formaPagamento: 'À Vista' | 'Parcelado';
  prazo: string;
  prazoVencido: boolean;
  prioridade: 'Alta' | 'Média' | 'Baixa';
  bloqueado: boolean;
  motivoBloqueio?: string;
  origem: ServicoContratado;
}

const ServiceOperationsCenter: React.FC<{ db: any }> = ({ db }) => {
  const [busca, setBusca] = useState('');
  const [filtroModoFoco, setFiltroModoFoco] = useState(true); // Default: Hide completed, show High Priority

  const boardData = useMemo(() => {
    const rows: RowData[] = db.servicos.map((srv: ServicoContratado) => {
      const cliente = db.clientes.find((c: Cliente) => c.id === srv.clienteId);
      const docsSrv = db.documentos.filter((d: Documento) => d.servicoId === srv.id || (d.clienteId === srv.clienteId && !d.servicoId));
      const pgtosSrv = db.pagamentos.filter((p: Pagamento) => p.servicoId === srv.id);

      // 1. Status Documental (Automatic)
      const checklist = CHECKLIST_CONFIG[srv.tipo] || [];
      const totalReq = checklist.length;
      const docsAnexados = checklist.filter(item => 
        docsSrv.some(d => d.nomeArquivo.includes(item))
      ).length;

      let statusDoc: 'Incompleto' | 'Parcial' | 'Completo' = 'Incompleto';
      if (docsAnexados === totalReq && totalReq > 0) statusDoc = 'Completo';
      else if (docsAnexados > 0) statusDoc = 'Parcial';

      // 2. Status Financeiro (Automatic)
      const isParcelado = srv.formaPagamento === 'Parcelado';
      const atrasados = pgtosSrv.some(p => 
        p.status === StatusPagamento.ATRASADO || 
        (p.status === StatusPagamento.PENDENTE && new Date(p.dataVencimento) < new Date())
      );
      const todosPagos = pgtosSrv.length > 0 && pgtosSrv.every(p => p.status === StatusPagamento.PAGO || !!p.comprovanteId);
      const algumPago = pgtosSrv.some(p => p.status === StatusPagamento.PAGO || !!p.comprovanteId);

      let statusFin: 'Pago' | 'Parcial' | 'Inadimplente' = 'Inadimplente';
      if (atrasados) statusFin = 'Inadimplente';
      else if (todosPagos) statusFin = 'Pago';
      else if (algumPago) statusFin = 'Parcial';

      // 3. Bloqueio Logic
      const docBloqueio = statusDoc !== 'Completo';
      const finBloqueio = statusFin === 'Inadimplente';
      const estaBloqueado = docBloqueio || finBloqueio;
      
      let motivo = "";
      if (docBloqueio) motivo = "Documentação Pendente";
      if (finBloqueio) motivo = (motivo ? motivo + " & " : "") + "Inadimplência";

      // 4. Deadline
      const prazoData = new Date(srv.prazoAcordado || srv.dataContrato);
      const hoje = new Date();
      const vencido = prazoData < hoje && srv.status !== StatusServico.CONCLUIDO;

      // 5. Prioridade (Automatic)
      let prioridade: 'Alta' | 'Média' | 'Baixa' = 'Baixa';
      const diffDias = Math.ceil((prazoData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      if (estaBloqueado) prioridade = 'Baixa';
      else if (statusFin === 'Pago' && diffDias <= 5) prioridade = 'Alta';
      else if (statusFin === 'Parcial') prioridade = 'Média';
      else if (diffDias > 5) prioridade = 'Média';

      return {
        id: srv.id,
        cliente: cliente?.nome || 'Cliente não encontrado',
        procedimento: srv.tipo,
        statusOperacional: estaBloqueado ? 'Bloqueado' : srv.status,
        statusDocumental: statusDoc,
        statusFinanceiro: statusFin,
        formaPagamento: srv.formaPagamento,
        prazo: srv.prazoAcordado,
        prazoVencido: vencido,
        prioridade: prioridade,
        bloqueado: estaBloqueado,
        motivoBloqueio: motivo,
        origem: srv
      };
    });

    return rows.filter(row => {
      const matchBusca = row.cliente.toLowerCase().includes(busca.toLowerCase());
      if (filtroModoFoco) {
        return matchBusca && row.origem.status !== StatusServico.CONCLUIDO && (row.prioridade === 'Alta' || row.prioridade === 'Média');
      }
      return matchBusca;
    });
  }, [db, busca, filtroModoFoco]);

  const groupedData = useMemo(() => {
    const groups: Record<string, RowData[]> = {};
    boardData.forEach(row => {
      if (!groups[row.procedimento]) groups[row.procedimento] = [];
      groups[row.procedimento].push(row);
    });
    return groups;
  }, [boardData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1c1c1e] p-6 rounded-[30px] border border-[#333336] shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar no quadro operacional..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-[#0f0f11] border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm transition-all"
            />
          </div>
          <button 
            onClick={() => setFiltroModoFoco(!filtroModoFoco)}
            className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all ${
              filtroModoFoco ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#0f0f11] text-[#98989d] hover:bg-[#0f0f11]'
            }`}
          >
            <Zap size={14} /> Modo Foco Operacional
          </button>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black text-[#98989d] uppercase tracking-widest mr-2">Visualização:</span>
           <button className="p-3 bg-blue-50 text-blue-600 rounded-xl"><List size={18} /></button>
           <button className="p-3 bg-[#0f0f11] text-slate-300 rounded-xl hover:bg-[#0f0f11]"><LayoutGrid size={18} /></button>
        </div>
      </div>

      {/* Board Content */}
      <div className="space-y-10 pb-20">
        {/* // FIX: Cast Object.entries(groupedData) to [string, RowData[]][] to avoid 'unknown' type for items on lines 169 and 186 */}
        {(Object.entries(groupedData) as [string, RowData[]][]).map(([tipo, items]) => (
          <div key={tipo} className="space-y-4">
            <div className="flex items-center gap-3">
               <ChevronDown size={20} className="text-[#98989d]" />
               <h3 className="text-lg font-black text-white tracking-tighter uppercase">{tipo}</h3>
               <span className="px-3 py-0.5 bg-[#0f0f11] text-[#98989d] text-[10px] font-bold rounded-full">{items.length} itens</span>
            </div>
            
            <div className="bg-[#1c1c1e] rounded-[35px] border border-[#333336] shadow-sm overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-[#0f0f11]/50 border-b border-[#333336] text-[10px] font-black text-[#98989d] uppercase tracking-widest">
                     <th className="px-6 py-4 w-[25%]">Identificação do Cliente</th>
                     <th className="px-6 py-4 text-center">Status Operacional</th>
                     <th className="px-6 py-4 text-center">Documentação</th>
                     <th className="px-6 py-4 text-center">Financeiro</th>
                     <th className="px-6 py-4 text-center">Prazo</th>
                     <th className="px-6 py-4 text-center">Prioridade</th>
                     <th className="px-6 py-4 text-right">Ação</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#333336]">
                    {items.map(row => (
                      <tr key={row.id} className={`group hover:bg-[#0f0f11]/80 transition-all ${row.bloqueado ? 'bg-[#0f0f11]/30' : ''}`}>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-4">
                              <div className={`w-2 h-10 rounded-full ${row.bloqueado ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                              <div>
                                 <p className="font-black text-white text-sm">{row.cliente}</p>
                                 <p className="text-[10px] font-bold text-[#98989d] uppercase tracking-tight">{row.procedimento}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             row.statusOperacional === 'Bloqueado' ? 'bg-red-50 text-red-600' :
                             row.statusOperacional === 'Concluído' ? 'bg-emerald-50 text-emerald-600' :
                             'bg-blue-50 text-blue-600'
                           }`}>
                             {row.statusOperacional}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <div className="flex flex-col items-center gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                row.statusDocumental === 'Completo' ? 'text-emerald-500' :
                                row.statusDocumental === 'Parcial' ? 'text-blue-500' : 'text-[#98989d]'
                              }`}>
                                {row.statusDocumental}
                              </span>
                              <div className="w-16 h-1 bg-[#0f0f11] rounded-full overflow-hidden">
                                 <div className={`h-full transition-all ${
                                   row.statusDocumental === 'Completo' ? 'bg-emerald-500 w-full' :
                                   row.statusDocumental === 'Parcial' ? 'bg-blue-500 w-1/2' : 'w-0'
                                 }`}></div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <div className="flex flex-col items-center gap-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${
                                row.statusFinanceiro === 'Pago' ? 'text-emerald-500' :
                                row.statusFinanceiro === 'Parcial' ? 'text-blue-500' : 'text-red-500'
                              }`}>
                                {row.statusFinanceiro}
                              </span>
                              <p className="text-[8px] font-bold text-[#98989d] uppercase">{row.formaPagamento}</p>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <div className={`flex items-center justify-center gap-2 text-xs font-bold ${row.prazoVencido ? 'text-red-600 animate-pulse' : 'text-slate-600'}`}>
                              <Clock size={14} />
                              {row.prazo}
                           </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${
                             row.prioridade === 'Alta' ? 'bg-red-50 text-red-600 border-red-100' :
                             row.prioridade === 'Média' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                             'bg-[#0f0f11] text-[#98989d] border-[#333336]'
                           }`}>
                             {row.prioridade}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                              {row.bloqueado && (
                                <div className="group/hint relative">
                                   <ShieldAlert size={18} className="text-red-400" />
                                   <div className="absolute right-0 bottom-full mb-2 hidden group-hover/hint:block w-48 p-3 bg-slate-900 text-white text-[10px] font-bold rounded-xl shadow-2xl z-50">
                                      {row.motivoBloqueio}
                                   </div>
                                </div>
                              )}
                              <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                                 <ChevronRight size={18} />
                              </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </div>
        ))}

        {Object.keys(groupedData).length === 0 && (
          <div className="py-40 text-center space-y-4">
             <LayoutGrid size={48} className="mx-auto text-slate-200" />
             <p className="text-slate-300 font-black uppercase text-xs tracking-[0.4em]">Nada no radar operacional por enquanto</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOperationsCenter;
