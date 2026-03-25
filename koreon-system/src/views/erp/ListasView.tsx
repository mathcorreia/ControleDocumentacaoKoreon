import React, { useState } from 'react';
import { 
  Layers, ChevronRight, Clock, Plus, Filter, 
  CheckSquare, Search, CheckCircle2,
  Calendar, Users, ArrowUpRight, Zap, AlertTriangle, FileCheck, MessageSquare, X, Info, UserPlus, ArrowLeft,
  Shield, TrendingUp, Briefcase, Globe, FileSpreadsheet, DollarSign, UserCheck, FileX, CheckCircle, Activity, FileText
} from 'lucide-react';
import { ListaProcessual, ListaOrgao, StatusOrgao, StatusLista, ClientePorLista, TipoServicoStrict, Cliente, ServicoContratado, StatusServico, Documento, TipoDocumento } from '../../types';
import { vincularClienteAoLote, atualizarStatusOrgaoNoLote } from '../../db';

const FORNECEDORES_LIMPA_NOME = [
  "Aldemir (Impactus, ELO)",
  "João Tesser (Alecred, ELO)",
  "Rick (Partner, M12)"
];

const ORGAOS_PADRAO = ["Serasa", "SPC", "Boa Vista", "Cenprot SP", "Cenprot Nacional"];

interface ListasViewProps {
  db: any;
  setDb: (db: any) => void;
}

const ListasView: React.FC<ListasViewProps> = ({ db, setDb }) => {
  const [listaSelecionada, setListaSelecionada] = useState<ListaProcessual | null>(null);
  const [tabAtiva, setTabAtiva] = useState<TipoServicoStrict>(TipoServicoStrict.LIMPA_NOME);
  const [statusFiltro, setStatusFiltro] = useState<'Em andamento' | '100% Baixado' | 'Reprotocolo'>('Em andamento');
  
  const [mostrarModalCriar, setMostrarModalCriar] = useState(false);
  const [mostrarModalAddCliente, setMostrarModalAddCliente] = useState(false);
  const [isConfirmingCreation, setIsConfirmingCreation] = useState(false);

  // Estados para vinculação
  const [clienteParaVincular, setClienteParaVincular] = useState('');
  const [docIdParaVincular, setDocIdParaVincular] = useState('');

  // Estados para nova lista
  const [novaLista, setNovaLista] = useState({
    nome: '',
    tipoServico: TipoServicoStrict.LIMPA_NOME,
    observacoes: '',
    dataInicio: new Date().toISOString().split('T')[0],
    fornecedor: FORNECEDORES_LIMPA_NOME[0],
    custoAcao: 0
  });

  const handleOpenCriarModal = () => {
    setNovaLista({
      nome: '',
      tipoServico: tabAtiva, 
      observacoes: '',
      dataInicio: new Date().toISOString().split('T')[0],
      fornecedor: FORNECEDORES_LIMPA_NOME[0],
      custoAcao: 0
    });
    setIsConfirmingCreation(false);
    setMostrarModalCriar(true);
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmingCreation(true);
  };

  const handleFinalConfirmCreation = () => {
    const id = `l-${Date.now()}`;
    const lista: ListaProcessual = {
      id,
      ...novaLista,
      statusGeral: 'Em andamento',
      ultimaAtualizacao: novaLista.dataInicio
    };
    
    const orgaosNovos: ListaOrgao[] = ORGAOS_PADRAO.map(nome => ({
      id: `lo_${id}_${nome}`,
      listaId: id,
      nomeOrgao: nome,
      status: StatusOrgao.NAO_INICIADO,
      percentualConclusao: 0
    }));

    const updatedDB = { 
      ...db, 
      listas: [...(db.listas || []), lista],
      listaOrgaos: [...(db.listaOrgaos || []), ...orgaosNovos]
    };
    setDb(updatedDB);
    localStorage.setItem('service_erp_db_v5_final', JSON.stringify(updatedDB));
    
    setMostrarModalCriar(false);
    setIsConfirmingCreation(false);
    setTabAtiva(novaLista.tipoServico);
  };

  const handleUpdateOrgao = (nomeOrgao: string, currentStatus: StatusOrgao) => {
    if (!listaSelecionada) return;
    
    let nextStatus: StatusOrgao = StatusOrgao.NAO_INICIADO;
    if (currentStatus === StatusOrgao.NAO_INICIADO) nextStatus = StatusOrgao.INICIADO;
    else if (currentStatus === StatusOrgao.INICIADO) nextStatus = StatusOrgao.CONCLUIDO;
    else nextStatus = StatusOrgao.NAO_INICIADO;

    const newDb = atualizarStatusOrgaoNoLote(listaSelecionada.id, nomeOrgao, nextStatus);
    setDb(newDb);
    const updatedList = newDb.listas.find((l: any) => l.id === listaSelecionada.id);
    if (updatedList) setListaSelecionada(updatedList);
  };

  const handleVincularConfirmado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteParaVincular || !docIdParaVincular || !listaSelecionada) {
      alert("Selecione um cliente e a Ficha Associativa correspondente.");
      return;
    }

    const documento = db.documentos.find((d: any) => d.id === docIdParaVincular);
    if (!documento) return;

    const srvId = documento.servicoId || (db.servicos.find((s: any) => 
      s.clienteId === clienteParaVincular && s.tipo === listaSelecionada.tipoServico
    )?.id);

    if (!srvId) {
      alert("Erro: Não foi possível identificar um contrato de " + listaSelecionada.tipoServico + " associado a esta ficha ou cliente.");
      return;
    }

    try {
      const updatedDB = vincularClienteAoLote(clienteParaVincular, srvId, listaSelecionada.id);
      setDb(updatedDB);
      setMostrarModalAddCliente(false);
      setClienteParaVincular('');
      setDocIdParaVincular('');
      alert("Cliente adicionado ao lote com sucesso via Ficha Associativa.");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportXLS = () => {
    if (!listaSelecionada) return;
    
    const clientesLista = (db.clientesPorLista || []).filter((cbl: ClientePorLista) => cbl.listaId === listaSelecionada.id);
    const prontosParaBaixar = clientesLista.filter((item: ClientePorLista) => {
      return db.documentos.some((d: Documento) => 
        d.clienteId === item.clienteId && d.tipo === TipoDocumento.FICHA_ASSOCIATIVA
      );
    });

    if (prontosParaBaixar.length === 0) {
      alert("Operação cancelada: Nenhum cliente marcado como 'Pronto para baixar'.");
      return;
    }

    const sheetName = "Lista Limpa Nome";
    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <style>
          .header { background-color: #000000; color: #FFFFFF; font-weight: bold; text-transform: uppercase; border: 1px solid #000000; }
          .cell { border: 1px solid #CCCCCC; padding: 5px; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th class="header">NOME</th>
              <th class="header">CPF</th>
            </tr>
          </thead>
          <tbody>
            ${prontosParaBaixar.map((item: ClientePorLista) => {
              const cliente = db.clientes.find((c: any) => c.id === item.clienteId);
              return `<tr><td class="cell">${cliente?.nome.toUpperCase()}</td><td class="cell">${cliente?.documento}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeFileName = listaSelecionada.nome.replace(/[/\\?%*:|"<>]/g, '-');
    link.href = url;
    link.download = `${safeFileName}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const listasFiltradas = (db.listas || []).filter((l: ListaProcessual) => 
    l.tipoServico === tabAtiva && l.statusGeral === statusFiltro
  );

  const renderCabecalhoTabela = () => {
    const colunasBase = (
      <>
        <th className="px-6 py-5">Cliente</th>
        <th className="px-6 py-5">CPF/CNPJ</th>
        <th className="px-6 py-5">Serviço</th>
      </>
    );

    const colunasFim = (
      <>
        <th className="px-6 py-5">Responsável</th>
        <th className="px-6 py-5">Observações</th>
        <th className="px-6 py-5 text-right">Ação</th>
      </>
    );

    switch (tabAtiva) {
      case TipoServicoStrict.LIMPA_NOME:
        return (
          <tr className="bg-[#0f0f11] text-[10px] font-black text-[#98989d] uppercase tracking-widest border-b border-[#333336]">
            {colunasBase}
            <th className="px-6 py-5">Ficha Associativa</th>
            <th className="px-6 py-5">Status Lote</th>
            <th className="px-6 py-5">Progresso</th>
            {colunasFim}
          </tr>
        );
      default:
        return (
          <tr className="bg-[#0f0f11] text-[10px] font-black text-[#98989d] uppercase tracking-widest border-b border-[#333336]">
            {colunasBase}
            <th className="px-6 py-5">Data Entrada</th>
            <th className="px-6 py-5">Status</th>
            {colunasFim}
          </tr>
        );
    }
  };

  const renderLinhaTabela = (item: ClientePorLista) => {
    const cliente = db.clientes.find((c: any) => c.id === item.clienteId);
    const servico = db.servicos.find((s: any) => s.id === item.servicoId);
    
    const celulasBase = (
      <>
        <td className="px-6 py-5 font-black text-white text-sm whitespace-nowrap">{cliente?.nome}</td>
        <td className="px-6 py-5 text-xs text-[#98989d] font-bold">{cliente?.documento}</td>
        <td className="px-6 py-5 text-[10px] font-bold text-[#0071e3] uppercase">{servico?.tipo}</td>
      </>
    );

    const celulasFim = (
      <>
        <td className="px-6 py-5 text-xs font-bold text-[#98989d] uppercase">{servico?.responsavel || 'Sistema'}</td>
        <td className="px-6 py-5 text-xs text-[#98989d] max-w-[200px] truncate italic">{item.observacoesIndividuais}</td>
        <td className="px-6 py-5 text-right">
            <button className="p-2 text-[#98989d] hover:text-[#0071e3] transition-all"><ArrowUpRight size={18} /></button>
        </td>
      </>
    );

    switch (tabAtiva) {
      case TipoServicoStrict.LIMPA_NOME:
        const temFicha = db.documentos.some((d: Documento) => d.clienteId === item.clienteId && d.tipo === TipoDocumento.FICHA_ASSOCIATIVA);
        return (
          <tr key={item.id} className="hover:bg-[#2c2c2e] transition-all border-b border-[#333336]">
            {celulasBase}
            <td className="px-6 py-5">
              {temFicha ? (
                <span className="flex items-center gap-1.5 text-[#32d74b] font-black text-[9px] uppercase tracking-widest">
                  <CheckCircle2 size={12} /> Anexada
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[#ff453a] font-black text-[9px] uppercase tracking-widest">
                  <FileX size={12} /> Não anexado
                </span>
              )}
            </td>
            <td className="px-6 py-5">
              {temFicha ? (
                <span className="px-3 py-1 bg-[#32d74b]/10 text-[#32d74b] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#32d74b]/20">
                  Pronto para baixar
                </span>
              ) : (
                <span className="px-3 py-1 bg-[#333336] text-[#98989d] rounded-full text-[9px] font-black uppercase tracking-widest border border-[#444448]">
                  Pendente
                </span>
              )}
            </td>
            <td className="px-6 py-5">
               <div className="w-24 h-1.5 bg-[#0f0f11] rounded-full overflow-hidden border border-[#333336]">
                  <div className="h-full bg-[#0071e3]" style={{ width: `${servico?.progresso || 0}%` }}></div>
               </div>
            </td>
            {celulasFim}
          </tr>
        );
      default:
        return (
          <tr key={item.id} className="hover:bg-[#2c2c2e] transition-all border-b border-[#333336]">
            {celulasBase}
            <td className="px-6 py-5 text-xs text-[#98989d] font-bold">{listaSelecionada?.dataInicio}</td>
            <td className="px-6 py-5"><span className="px-3 py-1 bg-[#333336] rounded-full text-[9px] font-black uppercase text-[#98989d]">{item.situacao}</span></td>
            {celulasFim}
          </tr>
        );
    }
  };

  const clientesDisponiveis = (db.clientes || []).filter((c: Cliente) => 
    (db.documentos || []).some((d: Documento) => d.clienteId === c.id && d.tipo === TipoDocumento.FICHA_ASSOCIATIVA)
  );

  const documentosFichaDoCliente = (db.documentos || []).filter((d: Documento) => 
    d.clienteId === clienteParaVincular && d.tipo === TipoDocumento.FICHA_ASSOCIATIVA
  );

  // VIEW DE DETALHES DE UMA LISTA (LOTE)
  if (listaSelecionada) {
    const orgaosLista = (db.listaOrgaos || []).filter((lo: ListaOrgao) => lo.listaId === listaSelecionada.id);
    const clientesLista = (db.clientesPorLista || []).filter((cbl: ClientePorLista) => cbl.listaId === listaSelecionada.id);

    return (
      <div className="animate-in slide-in-from-right-5 duration-300 space-y-8 text-white">
        
        {/* Modal Adicionar Cliente */}
        {mostrarModalAddCliente && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
             <div className="bg-[#1c1c1e] w-full max-w-lg rounded-[40px] shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-[#333336] p-10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white">Adicionar à Lista</h3>
                    <p className="text-xs font-bold text-[#98989d] uppercase tracking-widest mt-1">Lote: {listaSelecionada.nome}</p>
                  </div>
                  <button onClick={() => setMostrarModalAddCliente(false)} className="text-[#98989d] hover:text-[#ff453a]"><X size={28} /></button>
                </div>

                <form onSubmit={handleVincularConfirmado} className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">1. Selecionar Cliente</label>
                     <select required value={clienteParaVincular} onChange={e => { setClienteParaVincular(e.target.value); setDocIdParaVincular(''); }} className="w-full px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-[#0071e3] text-sm text-white">
                        <option value="">Selecione um cliente...</option>
                        {clientesDisponiveis.map((c: Cliente) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                     </select>
                   </div>
                   {clienteParaVincular && (
                     <div className="space-y-2 animate-in slide-in-from-top-2">
                       <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">2. Selecionar Ficha Associativa</label>
                       <select required value={docIdParaVincular} onChange={e => setDocIdParaVincular(e.target.value)} className="w-full px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-[#0071e3] text-sm text-white">
                          <option value="">Selecione a ficha associativa...</option>
                          {documentosFichaDoCliente.map((d: Documento) => (
                            <option key={d.id} value={d.id}>{d.nomeArquivo} ({d.dataUpload})</option>
                          ))}
                       </select>
                     </div>
                   )}
                   {clienteParaVincular && documentosFichaDoCliente.length === 0 && (
                     <div className="p-4 bg-[#ff453a]/10 text-[#ff453a] rounded-2xl flex items-center gap-3 border border-[#ff453a]/20 animate-in shake">
                        <AlertTriangle size={20} />
                        <p className="text-xs font-bold">Este cliente não possui nenhuma Ficha Associativa enviada.</p>
                     </div>
                   )}
                   <div className="pt-4">
                     <button 
                      type="submit" 
                      disabled={!docIdParaVincular} 
                      className="w-full py-5 bg-[#0071e3] text-white font-black uppercase text-xs tracking-[0.2em] rounded-3xl shadow-[0_4px_20px_rgba(0,113,227,0.3)] hover:bg-[#005bb5] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                     >
                       Confirmar Adesão ao Lote
                     </button>
                   </div>
                </form>
             </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => setListaSelecionada(null)} className="flex items-center gap-2 text-[#98989d] hover:text-[#0071e3] font-bold transition-all">
            <ChevronRight size={20} className="rotate-180" /> Voltar para Lotes de {listaSelecionada.tipoServico}
          </button>
          <div className="flex gap-3">
             {listaSelecionada.tipoServico === TipoServicoStrict.LIMPA_NOME && (
               <button onClick={handleExportXLS} className="px-6 py-3 bg-[#32d74b] text-[#0f0f11] rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(50,215,75,0.3)] hover:bg-[#28ad3c] flex items-center gap-3 transition-all active:scale-95">
                <FileSpreadsheet size={18} /> GERAR ARQUIVO XLS
              </button>
             )}
             <button onClick={() => { setClienteParaVincular(''); setDocIdParaVincular(''); setMostrarModalAddCliente(true); }} className="px-6 py-3 bg-[#0071e3] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_4px_15px_rgba(0,113,227,0.3)] hover:bg-[#005bb5] flex items-center gap-3 transition-all active:scale-95">
              <UserPlus size={18} /> Adicionar à Lista
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-[#1c1c1e] p-8 rounded-[35px] text-white relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#333336]">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${listaSelecionada.statusGeral === '100% Baixado' ? 'bg-[#32d74b] text-[#0f0f11]' : 'bg-[#0071e3] text-white'}`}>
                  {listaSelecionada.statusGeral}
                </span>
                <span className="text-[#98989d] text-xs font-bold">• Início: {listaSelecionada.dataInicio}</span>
              </div>
              <h2 className="text-3xl font-black mb-2">{listaSelecionada.nome}</h2>
              <p className="text-[#98989d] text-sm font-medium italic">{listaSelecionada.observacoes}</p>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-10 border-t border-[#333336] pt-8">
              <div>
                <p className="text-[10px] text-[#98989d] uppercase font-black tracking-widest mb-1">Total de Inscritos</p>
                <p className="text-lg font-black text-[#0071e3]">{clientesLista.length} Clientes</p>
              </div>
              {listaSelecionada.tipoServico === TipoServicoStrict.LIMPA_NOME && (
                <>
                  <div>
                    <p className="text-[10px] text-[#98989d] uppercase font-black tracking-widest mb-1">Fornecedor</p>
                    <p className="text-sm font-black text-white truncate">{listaSelecionada.fornecedor || 'Não definido'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#98989d] uppercase font-black tracking-widest mb-1">Custo da Ação</p>
                    <p className="text-sm font-black text-[#32d74b]">R$ {listaSelecionada.custoAcao?.toFixed(2)}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-[10px] text-[#98989d] uppercase font-black tracking-widest mb-1">Última Movimentação</p>
                <p className="text-xs font-bold text-[#98989d]">{listaSelecionada.ultimaAtualizacao}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1c1c1e] p-8 rounded-[35px] border border-[#333336] shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-center items-center text-center">
             <div className="w-16 h-16 bg-[#32d74b]/10 text-[#32d74b] rounded-3xl flex items-center justify-center mb-4 border border-[#32d74b]/20">
                <FileCheck size={32} />
             </div>
             <p className="text-2xl font-black text-white">{clientesLista.filter(c => db.documentos.some((d: any) => d.clienteId === c.clienteId && d.tipo === TipoDocumento.FICHA_ASSOCIATIVA)).length}</p>
             <p className="text-xs font-bold text-[#98989d] uppercase tracking-widest mt-1">Prontos para<br/>Baixar</p>
          </div>
        </div>

        {tabAtiva === TipoServicoStrict.LIMPA_NOME && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#0071e3] rounded-full"></div>
              <h3 className="text-xl font-black text-white tracking-tight">Status Operacional por Órgão</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {ORGAOS_PADRAO.map(nome => {
                const orgao = orgaosLista.find(o => o.nomeOrgao === nome);
                const status = orgao?.status || StatusOrgao.NAO_INICIADO;
                return (
                  <button 
                    key={nome}
                    onClick={() => handleUpdateOrgao(nome, status)}
                    className={`bg-[#1c1c1e] p-6 rounded-[28px] border-2 shadow-sm transition-all text-left group hover:-translate-y-1 ${
                      status === StatusOrgao.CONCLUIDO ? 'border-[#32d74b]/30 bg-[#32d74b]/5' : 
                      status === StatusOrgao.INICIADO ? 'border-[#0071e3]/30 bg-[#0071e3]/5' : 'border-[#333336]'
                    }`}
                  >
                    <p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest mb-3">{nome}</p>
                    <div className="flex items-center justify-between mb-4">
                      <p className={`text-xs font-black uppercase ${
                        status === StatusOrgao.CONCLUIDO ? 'text-[#32d74b]' : 
                        status === StatusOrgao.INICIADO ? 'text-[#0071e3]' : 'text-[#98989d]'
                      }`}>
                        {status}
                      </p>
                      {status === StatusOrgao.CONCLUIDO ? <CheckCircle size={16} className="text-[#32d74b]" /> : <Activity size={16} className="text-[#98989d] group-hover:text-[#0071e3]" />}
                    </div>
                    <div className="w-full h-1.5 bg-[#0f0f11] rounded-full overflow-hidden border border-[#333336]">
                      <div className={`h-full transition-all duration-500 ${status === StatusOrgao.CONCLUIDO ? 'bg-[#32d74b]' : 'bg-[#0071e3]'}`} style={{ width: `${orgao?.percentualConclusao || 0}%` }}></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-white tracking-tight">Clientes no Lote ({listaSelecionada.tipoServico})</h3>
          </div>
          <div className="bg-[#1c1c1e] rounded-[35px] border border-[#333336] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>{renderCabecalhoTabela()}</thead>
                <tbody className="divide-y divide-[#333336]">
                  {clientesLista.length > 0 ? clientesLista.map((item) => renderLinhaTabela(item)) : (
                    <tr><td colSpan={15} className="px-8 py-10 text-center text-[#98989d] font-bold uppercase text-xs">O lote está vazio.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // VIEW PRINCIPAL (LISTAGEM DE LOTES)
  return (
    <div className="space-y-10 animate-in fade-in duration-500 text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#333336] pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tighter">Listas Processuais</h2>
          <p className="text-sm text-[#98989d] font-bold italic">Segregação estrita por categoria de serviço operacional</p>
        </div>
        <button onClick={handleOpenCriarModal} className="px-8 py-4 bg-[#0071e3] text-white rounded-[24px] font-black text-sm flex items-center gap-3 shadow-[0_4px_15px_rgba(0,113,227,0.3)] hover:bg-[#005bb5] transition-all">
          <Plus size={24} /> Criar Novo Lote de {tabAtiva}
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* TABS (Categorias de Serviço) */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[{ id: TipoServicoStrict.LIMPA_NOME, icon: Shield }, { id: TipoServicoStrict.SCORE, icon: TrendingUp }, { id: TipoServicoStrict.RATING, icon: Briefcase }, { id: TipoServicoStrict.JUSBRASIL, icon: Globe }].map((item) => (
            <button 
              key={item.id} 
              onClick={() => setTabAtiva(item.id)} 
              className={`px-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all whitespace-nowrap flex items-center gap-3 border ${
                tabAtiva === item.id 
                ? 'bg-[#0071e3] text-white border-transparent shadow-[0_4px_20px_rgba(0,113,227,0.3)] translate-y-[-4px]' 
                : 'bg-[#1c1c1e] text-[#98989d] border-[#333336] hover:bg-[#2c2c2e]'
              }`}
            >
              <item.icon size={18} /> {item.id}
            </button>
          ))}
        </div>

        {/* Filtros Status */}
        <div className="flex gap-2 bg-[#1c1c1e] border border-[#333336] p-1.5 rounded-2xl">
          {['Em andamento', '100% Baixado', 'Reprotocolo'].map(st => (
            <button 
              key={st}
              onClick={() => setStatusFiltro(st as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFiltro === st ? 'bg-[#0071e3] text-white shadow-sm' : 'text-[#98989d] hover:text-white'}`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Cards dos Lotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {listasFiltradas.length > 0 ? listasFiltradas.map((lista: ListaProcessual) => {
          const countClientes = (db.clientesPorLista || []).filter((c: ClientePorLista) => c.listaId === lista.id).length;
          return (
            <div key={lista.id} onClick={() => setListaSelecionada(lista)} className="bg-[#1c1c1e] p-10 rounded-[45px] border border-[#333336] shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_10px_40px_rgba(0,113,227,0.2)] hover:border-[#0071e3]/50 hover:-translate-y-2 transition-all cursor-pointer group flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="p-4 bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 rounded-[24px] group-hover:bg-[#0071e3] group-hover:text-white transition-all"><Layers size={28} /></div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${lista.statusGeral === '100% Baixado' ? 'bg-[#32d74b]/10 text-[#32d74b] border-[#32d74b]/20' : 'bg-[#333336] text-[#98989d] border-[#444448]'}`}>
                  {lista.statusGeral}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-3 tracking-tighter group-hover:text-[#0071e3] transition-colors">{lista.nome}</h3>
              <p className="text-sm text-[#98989d] font-medium mb-4 leading-relaxed line-clamp-2">{lista.observacoes}</p>
              {lista.fornecedor && <div className="mb-6 flex items-center gap-2 text-[10px] font-black text-[#98989d] uppercase tracking-widest"><Briefcase size={12} className="text-[#0071e3]" /> {lista.fornecedor}</div>}
              <div className="pt-8 border-t border-[#333336] flex items-center justify-between mt-auto">
                <div><p className="text-[10px] text-[#98989d] uppercase font-black mb-1">Clientes</p><p className="text-sm font-black text-white">{countClientes} inscritos</p></div>
                <div className="flex items-center gap-2 text-[#0071e3] font-black text-[10px] uppercase tracking-widest">Ver Lista <ChevronRight size={18} className="group-hover:translate-x-2 transition-all" /></div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full p-20 border-2 border-dashed border-[#333336] rounded-[50px] text-center bg-[#1c1c1e]/50">
            <Info size={48} className="mx-auto text-[#333336] mb-6" />
            <p className="text-[#98989d] font-black uppercase text-sm tracking-[0.3em]">Nenhum lote {statusFiltro.toLowerCase()} encontrado</p>
          </div>
        )}
      </div>

      {/* Modal Criar Novo Lote */}
      {mostrarModalCriar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <div className="bg-[#1c1c1e] border border-[#333336] w-full max-w-xl rounded-[40px] shadow-[0_10px_50px_rgba(0,0,0,0.8)] p-10 animate-in zoom-in-95 duration-200">
             {!isConfirmingCreation ? (
               <>
                 <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black text-white">Novo Lote Processual</h3><button onClick={() => setMostrarModalCriar(false)} className="text-[#98989d] hover:text-[#ff453a]"><X size={32} /></button></div>
                 <form onSubmit={handleInitialSubmit} className="space-y-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-[#98989d] uppercase tracking-[0.2em] ml-2">Nome Identificador do Lote</label><input required placeholder="Ex: Lote Especial Jan/2025" value={novaLista.nome} onChange={e => setNovaLista({...novaLista, nome: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] text-white rounded-2xl outline-none focus:border-[#0071e3] font-bold" /></div>
                    {tabAtiva === TipoServicoStrict.LIMPA_NOME && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><label className="text-[10px] font-black text-[#98989d] uppercase tracking-[0.2em] ml-2">Fornecedor</label><select value={novaLista.fornecedor} onChange={e => setNovaLista({...novaLista, fornecedor: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] text-white rounded-2xl outline-none focus:border-[#0071e3] font-bold">{FORNECEDORES_LIMPA_NOME.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-[#98989d] uppercase tracking-[0.2em] ml-2">Custo da Ação (R$)</label><input type="number" step="0.01" value={novaLista.custoAcao} onChange={e => setNovaLista({...novaLista, custoAcao: Number(e.target.value)})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] text-white rounded-2xl outline-none focus:border-[#0071e3] font-bold" /></div>
                      </div>
                    )}
                    <div className="space-y-2"><label className="text-[10px] font-black text-[#98989d] uppercase tracking-[0.2em] ml-2">Tipo de Serviço (MANDATÓRIO)</label><select value={novaLista.tipoServico} onChange={e => setNovaLista({...novaLista, tipoServico: e.target.value as TipoServicoStrict})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] text-white rounded-2xl outline-none focus:border-[#0071e3] font-bold">{Object.values(TipoServicoStrict).map(v => <option key={v} value={v}>{v}</option>)}</select></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-[#98989d] uppercase tracking-[0.2em] ml-2">Descrição / Observações</label><textarea value={novaLista.observacoes} onChange={e => setNovaLista({...novaLista, observacoes: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] text-white rounded-2xl outline-none focus:border-[#0071e3] font-bold" rows={2}></textarea></div>
                    <button type="submit" className="w-full py-5 bg-[#0071e3] text-white font-black uppercase text-xs tracking-[0.3em] rounded-3xl shadow-[0_4px_20px_rgba(0,113,227,0.3)] hover:bg-[#005bb5] transition-all">Revisar Lote</button>
                 </form>
               </>
             ) : (
               <div className="space-y-10 animate-in fade-in zoom-in-95">
                 <div className="flex items-center gap-4 border-b border-[#333336] pb-6"><button onClick={() => setIsConfirmingCreation(false)} className="p-2 text-[#98989d] hover:text-[#0071e3] transition-all"><ArrowLeft size={24} /></button><div><h3 className="text-xl font-black text-white">Confirmar Novo Lote</h3><p className="text-xs font-bold text-[#98989d] uppercase tracking-widest">Confira os detalhes antes de criar</p></div></div>
                 <div className="bg-[#0f0f11] p-8 rounded-3xl space-y-6 border border-[#333336]">
                    <div><p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest mb-1">Identificador</p><p className="text-lg font-black text-white">{novaLista.nome}</p></div>
                    <div className="grid grid-cols-2 gap-4"><div><p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest mb-1">Categoria</p><p className="text-sm font-black text-[#0071e3] uppercase">{novaLista.tipoServico}</p></div><div><p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest mb-1">Data de Início</p><p className="text-sm font-black text-white">{new Date(novaLista.dataInicio).toLocaleDateString('pt-BR')}</p></div></div>
                    {novaLista.tipoServico === TipoServicoStrict.LIMPA_NOME && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#333336]"><div><p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest mb-1">Fornecedor</p><p className="text-sm font-black text-white">{novaLista.fornecedor}</p></div><div><p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest mb-1">Custo Total</p><p className="text-sm font-black text-[#32d74b]">R$ {novaLista.custoAcao?.toFixed(2)}</p></div></div>
                    )}
                 </div>
                 <div className="flex gap-4"><button onClick={() => setIsConfirmingCreation(false)} className="flex-1 py-5 bg-[#1c1c1e] border border-[#333336] text-[#98989d] font-black uppercase text-xs tracking-widest rounded-3xl hover:bg-[#2c2c2e] hover:text-white transition-all">Editar Dados</button><button onClick={handleFinalConfirmCreation} className="flex-[2] py-5 bg-[#32d74b] text-[#0f0f11] font-black uppercase text-xs tracking-widest rounded-3xl shadow-[0_4px_15px_rgba(50,215,75,0.3)] hover:bg-[#28ad3c] transition-all flex items-center justify-center gap-3"><CheckCircle2 size={20} /> Criar Lote Agora</button></div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ListasView;