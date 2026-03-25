
import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, Plus, ChevronRight, MapPin, Calendar, FileText, 
  ExternalLink, Zap, Clock, DollarSign, Briefcase, X, 
  User, Phone, Mail, Fingerprint, Layers, AlertCircle,
  FileSignature, ShieldCheck, IdCard, History,
  TrendingUp, CheckCircle2, Download, Upload, Trash2, Edit3,
  FileIcon, FileType, Save, Eye, MessageCircle, Smartphone,
  ClipboardCheck, FileWarning, CheckSquare, Activity, AlertTriangle, Ban, Lock, ShieldAlert, Thermometer, UserX, FileUp, Paperclip, CreditCard,
  LockOpen
} from 'lucide-react';
import { 
  Cliente, TipoPessoa, ServicoContratado, Pagamento, 
  Documento, StatusPagamento, StatusServico, TipoServicoStrict,
  ClientePorLista, ListaProcessual, TipoDocumento, HistoricoAcompanhamento, NivelRisco, PrioridadeOperacional
} from '../../types';
import { getSugestoesUpsell } from '../services/aiService';
import { 
  inserirClienteCompleto, 
  adicionarServicoAoCliente, 
  atualizarProgressoServico, 
  atualizarCliente,
  atualizarStatusPagamento,
  anexarArquivoReal,
  deletarDocumento,
  atualizarServico,
  registrarAcaoAcompanhamento
} from '../../db';

const CHECKLIST_CONFIG: Record<string, string[]> = {
  [TipoServicoStrict.LIMPA_NOME]: ["Comprovante de Pagamento", "RG or CNH", "Comprovante de endereço", "Consulta inicial"],
  [TipoServicoStrict.SCORE]: ["Comprovante de Pagamento", "RG or CNH", "Comprovante de endereço", "Assinatura do Serasa Premium"],
  [TipoServicoStrict.RATING]: ["Comprovante de Pagamento", "RG (Frente e Verso)", "Comprovante de endereço", "Comprovante de Renda", "Login Gov.br", "Login Serasa", "Dados Bancários", "Ficha Cadastral"],
  [TipoServicoStrict.JUSBRASIL]: ["Comprovante de Pagamento", "RG (Frente e Verso)"],
  [TipoServicoStrict.REDUCAO]: ["Comprovante de Pagamento", "RG or CNH", "Contrato financiamento", "Extrato parcelas", "Senha Gov.br", "Demanda BACEN"],
  [TipoServicoStrict.LIMPA_TELA]: ["Comprovante de Pagamento", "RG or CNH", "Comprovante de endereço", "Prints da restrição"]
};

const CHECKLIST_CONFIG_PJ: Record<string, string[]> = {
  [TipoServicoStrict.RATING]: ["Comprovante de Pagamento", "Contrato Social", "Cartão CNPJ", "Comprovante Endereço PJ", "Docs Sócios", "Balanço 2022-2024", "DRE", "Extratos 3 meses"]
};

interface ClientesViewProps {
  db: any;
  setDb: (db: any) => void;
}

const ClientesView: React.FC<ClientesViewProps> = ({ db, setDb }) => {
  const [busca, setBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [activeTab, setActiveTab] = useState<'perfil' | 'servicos' | 'financeiro' | 'documentos' | 'acompanhamento' | 'historico' | 'checklist'>('perfil');
  const [mostrarModalNovoCliente, setMostrarModalNovoCliente] = useState(false);
  const [mostrarModalNovoServico, setMostrarModalNovoServico] = useState(false);
  const [mostrarModalAnexo, setMostrarModalAnexo] = useState(false);
  
  const [formCliente, setFormCliente] = useState({
    nome: '', tipo: TipoPessoa.FISICA, documento: '', rgIe: '', dataNascimento: '', endereco: '', bairro: '', estado: '', cep: '', numero: '', cidade: '', telefone: '', email: '',
    observacoesGerais: '', tipoServicoContratado: '', valorTotal: '', valorEntrada: '', formaPagamento: 'À Vista', qtdParcelas: '1'
  });

  const [formServico, setFormServico] = useState({
    tipo: TipoServicoStrict.LIMPA_NOME, valor: '', formaPagamento: 'À Vista' as 'À Vista' | 'Parcelado', 
    qtdParcelas: '1', dataContrato: new Date().toISOString().split('T')[0],
    prazoAcordado: '', status: StatusServico.INICIO, progresso: 0, observacoes: ''
  });

  const [servicoEditando, setServicoEditando] = useState<ServicoContratado | null>(null);
  const [anexoState, setAnexoState] = useState<{
    tipo: TipoDocumento; servicoId: string; labelChecklist?: string; arquivo: File | null; uploading: boolean;
  }>({ tipo: TipoDocumento.DOCUMENTO_CLIENTE, servicoId: '', arquivo: null, uploading: false });

  const [carregandoIA, setCarregandoIA] = useState(false);
  const [sugestoesIA, setSugestoesIA] = useState<string | null>(null);

  const idadeCalculada = useMemo(() => {
    if (!formCliente.dataNascimento) return null;
    const nasc = new Date(formCliente.dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return idade;
  }, [formCliente.dataNascimento]);

  const { alertas, statusMonitoramento, temComprovantePagamento, statusFinanceiroHeader, servicosAutorizados } = useMemo(() => {
    if (!clienteSelecionado) return { alertas: [], statusMonitoramento: null, temComprovantePagamento: false, statusFinanceiroHeader: null, servicosAutorizados: false };
    
    const list: { type: 'doc' | 'fin' | 'risk', msg: string, critical: boolean }[] = [];
    const clientServices = db.servicos.filter((s: any) => s.clienteId === clienteSelecionado.id);
    const clientPayments = db.pagamentos.filter((p: any) => p.clienteId === clienteSelecionado.id);
    const clientDocs = db.documentos.filter((d: any) => d.clienteId === clienteSelecionado.id);

    // Regra de Liberação: À Vista (Integral Pago) ou Parcelado (Entrada Paga)
    const entradaOuUnica = clientPayments.find((p: any) => p.numParcela === 1);
    const isAutorizado = entradaOuUnica ? (entradaOuUnica.status === StatusPagamento.PAGO || !!entradaOuUnica.comprovanteId) : false;

    const comprovantes = clientDocs.filter((d: any) => d.nomeArquivo.includes("[CHECKLIST] Comprovante de Pagamento"));
    const pagoDoc = comprovantes.length > 0;

    if (!isAutorizado && clientServices.length > 0) {
      list.push({ type: 'fin', msg: `BLOQUEIO OPERACIONAL: Aguardando confirmação do primeiro pagamento (Entrada/Integral).`, critical: true });
    }

    if (clienteSelecionado.riskLevel === NivelRisco.ALTO) {
      list.push({ type: 'risk', msg: `SISTEMA DE COMPLIANCE: Cliente com Alto Risco (${clienteSelecionado.riskScore}pts). Operações financeiras restritas.`, critical: true });
    }

    clientServices.forEach((srv: any) => {
      const checklist = (clienteSelecionado.tipo === TipoPessoa.JURIDICA && srv.tipo === TipoServicoStrict.RATING) ? CHECKLIST_CONFIG_PJ[srv.tipo] : CHECKLIST_CONFIG[srv.tipo];
      if (checklist) {
        const docsSrv = clientDocs.filter((d: any) => d.servicoId === srv.id);
        const pendentes = checklist.filter(item => !docsSrv.some((d: any) => d.nomeArquivo.includes(`[CHECKLIST] ${item}`)));
        if (pendentes.length > 0) list.push({ type: 'doc', msg: `Pendência documental: ${srv.tipo} (${pendentes.length} itens)`, critical: false });
      }
    });

    const atrasados = clientPayments.filter((p: any) => {
      const isLateDate = new Date(p.dataVencimento) < new Date();
      return !p.comprovanteId && isLateDate && p.status !== StatusPagamento.PAGO;
    });
    if (atrasados.length > 0) list.push({ type: 'fin', msg: `Alerta Financeiro: ${atrasados.length} parcela(s) em atraso.`, critical: false });

    let procStatus = "Não iniciado";
    if (clientServices.length > 0) {
      const lastService = clientServices[clientServices.length - 1];
      if (!isAutorizado) procStatus = "Aguardando Pagamento";
      else if (lastService.status === StatusServico.CONCLUIDO) procStatus = "Concluído";
      else if (lastService.status === StatusServico.INICIO) procStatus = "Autorizado para Procedimento";
      else procStatus = "Em processo";
    }

    let finStatus = "Sem lançamentos";
    let headerFinMsg = "Financeiro em dia";
    let headerFinColor = "text-emerald-500";

    const overdue = clientPayments.find((p: any) => !p.comprovanteId && new Date(p.dataVencimento) < new Date() && p.status !== StatusPagamento.PAGO);
    const isAllPaid = clientPayments.length > 0 && clientPayments.every((p: any) => p.comprovanteId || p.status === StatusPagamento.PAGO);
    
    if (overdue) {
      const isEntrada = overdue.numParcela === 1 && clientPayments.length > 1;
      finStatus = `Inadimplente (Parc. ${overdue.numParcela})`;
      headerFinMsg = isEntrada ? `Entrada de R$ ${overdue.valorParcela.toFixed(2)} em atraso` : `Parcela ${overdue.numParcela} inadimplente`;
      headerFinColor = "text-red-500";
    } else if (isAllPaid) {
      finStatus = clientPayments.length === 1 ? "Pago à vista" : "Quitado";
      headerFinMsg = "Contrato Quitado";
      headerFinColor = "text-emerald-500";
    } else if (clientPayments.length > 0) {
      const totalP = clientPayments[0].qtdParcelas;
      const paidP = clientPayments.filter((p: any) => p.comprovanteId || p.status === StatusPagamento.PAGO).length;
      finStatus = `Parcelamento ativo (${paidP}/${totalP})`;
      headerFinMsg = `Parcelamento Ativo (${paidP}/${totalP})`;
      headerFinColor = "text-blue-500";
    }

    return { 
      alertas: list, 
      statusMonitoramento: { procStatus, finStatus, servicosContratados: clientServices.map(s => s.tipo).join(", ") },
      temComprovantePagamento: pagoDoc,
      statusFinanceiroHeader: { msg: headerFinMsg, color: headerFinColor },
      servicosAutorizados: isAutorizado
    };
  }, [clienteSelecionado, db.servicos, db.pagamentos, db.documentos]);

  const handleNovoCadastroClick = () => {
    setFormCliente({ 
      nome: '', tipo: TipoPessoa.FISICA, documento: '', rgIe: '', dataNascimento: '', endereco: '', bairro: '', estado: '', cep: '', numero: '', cidade: '', telefone: '', email: '', 
      observacoesGerais: '', tipoServicoContratado: '', valorTotal: '', valorEntrada: '', formaPagamento: 'À Vista', qtdParcelas: '1'
    });
    setMostrarModalNovoCliente(false);
    setTimeout(() => setMostrarModalNovoCliente(true), 10);
  };

  const handleSalvarNovoCliente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCliente.nome || !formCliente.documento) {
      alert("Nome e Documento são obrigatórios.");
      return;
    }
    const { db: updatedDb, cliente: novoCliente } = inserirClienteCompleto(formCliente);
    setDb(updatedDb);
    setMostrarModalNovoCliente(false);
    setClienteSelecionado(novoCliente);
    setActiveTab('perfil');
  };

  const handleOpenPasta = (client: Cliente) => {
    setClienteSelecionado(client);
    setActiveTab('perfil');
    setSugestoesIA(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo?: TipoDocumento, srvId?: string, label?: string) => {
    const file = e.target.files?.[0];
    if (!file || !clienteSelecionado) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const finalLabel = label ? `[CHECKLIST] ${label}_${file.name}` : file.name;
      const finalFile = new File([file], finalLabel, { type: file.type });
      
      const newDb = anexarArquivoReal(
        clienteSelecionado.id, 
        tipo || TipoDocumento.DOCUMENTO_CLIENTE, 
        finalFile, 
        base64, 
        srvId
      );
      setDb(newDb);
      setMostrarModalAnexo(false);
      setAnexoState({ ...anexoState, arquivo: null, uploading: false });
    };
    reader.readAsDataURL(file);
  };

  const handleAddServicoAvulso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteSelecionado) return;
    try {
      if (servicoEditando) {
        setDb(atualizarServico({ ...servicoEditando, ...formServico, valorContratado: Number(formServico.valor), qtdParcelas: Number(formServico.qtdParcelas) } as any));
      } else {
        setDb(adicionarServicoAoCliente(clienteSelecionado.id, formServico));
      }
      setMostrarModalNovoServico(false);
      setServicoEditando(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleIA = async () => {
    if (!clienteSelecionado || clienteSelecionado.riskLevel === NivelRisco.ALTO) return;
    setCarregandoIA(true);
    const srvs = db.servicos.filter((s: any) => s.clienteId === clienteSelecionado.id);
    const sugestao = await getSugestoesUpsell(clienteSelecionado, srvs);
    setSugestoesIA(sugestao);
    setCarregandoIA(false);
  };

  const clientesFiltrados = (db.clientes || []).filter((c: Cliente) => 
    c.nome.toLowerCase().includes(busca.toLowerCase()) || c.documento.includes(busca)
  );

  if (clienteSelecionado) {
    const servicos = db.servicos.filter((s: ServicoContratado) => s.clienteId === clienteSelecionado.id);
    const documentos = db.documentos.filter((d: Documento) => d.clienteId === clienteSelecionado.id);
    const pagamentos = db.pagamentos.filter((p: Pagamento) => p.clienteId === clienteSelecionado.id);
    const isAltoRisco = clienteSelecionado.riskLevel === NivelRisco.ALTO;

    return (
      <div className="animate-in slide-in-from-right-10 duration-500 space-y-8 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <button onClick={() => setClienteSelecionado(null)} className="flex items-center gap-3 text-[#98989d] hover:text-blue-600 font-black transition-all group">
            <div className="p-2 bg-[#1c1c1e] rounded-xl border border-[#333336] group-hover:bg-blue-50">
              <ChevronRight size={20} className="rotate-180" />
            </div>
            VOLTAR PARA LISTAGEM
          </button>
          <div className="flex gap-3">
             <button onClick={() => { setAnexoState({ tipo: TipoDocumento.DOCUMENTO_CLIENTE, servicoId: '', arquivo: null, uploading: false }); setMostrarModalAnexo(true); }} className="px-6 py-3 bg-[#1c1c1e] border border-[#333336] text-[#e5e5ea] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0f0f11] flex items-center gap-2 transition-all">
                <Upload size={16} /> Anexar Documento
             </button>
             <button 
                onClick={() => { setMostrarModalNovoServico(true); setActiveTab('servicos'); }} 
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 flex items-center gap-2 transition-all"
             >
                <Plus size={16} /> Novo Serviço
             </button>
          </div>
        </div>

        {alertas.length > 0 && (
          <div className="space-y-3">
            {alertas.map((a, i) => (
              <div key={i} className={`p-5 rounded-3xl border flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${
                a.critical ? 'bg-red-50 border-red-100 text-red-700' : 'bg-amber-50 border-amber-100 text-amber-700'
              }`}>
                <div className="flex items-center gap-4">
                  {a.type === 'risk' ? <ShieldAlert size={24} className="text-red-600" /> : <AlertTriangle size={24} className={a.critical ? 'text-red-500' : 'text-amber-500'} />}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Alerta de Compliance</p>
                    <p className="text-sm font-black">{a.msg}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-900 rounded-[45px] p-10 text-white relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className={`w-32 h-32 rounded-[35px] flex items-center justify-center text-4xl font-black border-4 border-slate-800 shadow-2xl relative ${isAltoRisco ? 'bg-red-600' : 'bg-blue-600'}`}>
              {clienteSelecionado.nome.charAt(0)}
              <div className="absolute -bottom-2 -right-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                 <ShieldAlert size={20} className={isAltoRisco ? 'text-red-500' : 'text-emerald-500'} />
              </div>
            </div>
            <div className="text-center md:text-left space-y-2 flex-1">
               <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                 <h2 className="text-4xl font-black tracking-tighter">{clienteSelecionado.nome}</h2>
                 <span className={`px-3 py-1 text-white text-[10px] font-black rounded-full uppercase tracking-widest ${isAltoRisco ? 'bg-red-600' : 'bg-emerald-600'}`}>
                    {clienteSelecionado.riskLevel} • {clienteSelecionado.riskScore} pts
                 </span>
                 <div className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest flex items-center gap-1.5 ${servicosAutorizados ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {servicosAutorizados ? <LockOpen size={12} /> : <Lock size={12} />}
                    {servicosAutorizados ? 'Serviços Liberados' : 'Aguardando Liberação'}
                 </div>
               </div>
               <p className="text-[#98989d] font-bold flex flex-wrap justify-center md:justify-start gap-4">
                 <span className="flex items-center gap-1.5"><IdCard size={16} className="text-blue-500" /> {clienteSelecionado.documento}</span>
                 <span className="flex items-center gap-1.5"><Calendar size={16} className="text-blue-500" /> Cadastro: {clienteSelecionado.dataCadastro}</span>
                 {statusFinanceiroHeader && (
                   <span className={`flex items-center gap-1.5 font-black uppercase text-[10px] tracking-widest ${statusFinanceiroHeader.color}`}>
                     <DollarSign size={14} /> {statusFinanceiroHeader.msg}
                   </span>
                 )}
               </p>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
               <div className="p-6 bg-slate-800/80 rounded-3xl border border-slate-700 flex flex-col gap-4 min-w-[240px]">
                  <div>
                    <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Status do Procedimento</p>
                    <div className="flex items-center gap-2">
                       <Activity size={14} className="text-blue-400" />
                       <span className="text-sm font-black uppercase tracking-tight">{statusMonitoramento?.procStatus}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-4">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Status Financeiro Geral</p>
                    <div className="flex items-center gap-2">
                       <DollarSign size={14} className="text-emerald-400" />
                       <span className="text-sm font-black uppercase text-slate-100 tracking-tight">{statusMonitoramento?.finStatus}</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-12 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'perfil', label: 'Cadastro', icon: User },
              { id: 'servicos', label: 'Serviços', icon: Briefcase },
              { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
              { id: 'checklist', label: 'Checklist', icon: ClipboardCheck },
              { id: 'documentos', label: 'Documentos', icon: FileText },
              { id: 'historico', label: 'Histórico', icon: History },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all border-2 ${
                  activeTab === tab.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-slate-800 border-slate-800 text-[#98989d] hover:border-slate-700'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {activeTab === 'perfil' && (
              <div className="bg-[#1c1c1e] p-10 rounded-[40px] border border-[#333336] shadow-sm animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Ficha Cadastral</h3>
                  <button className="p-3 bg-[#0f0f11] text-[#98989d] rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all"><Edit3 size={20} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <DataField label="Nome Completo" value={clienteSelecionado.nome} />
                   <DataField label="CPF / CNPJ" value={clienteSelecionado.documento} />
                   <DataField label="Data de Nascimento" value={clienteSelecionado.dataNascimento || 'Não informado'} />
                   <DataField label="Tipo de Pessoa" value={clienteSelecionado.tipo} />
                   <div className="md:col-span-2 pt-6 border-t border-slate-50">
                     <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-4">Localização</h4>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DataField label="CEP" value={clienteSelecionado.cep} />
                        <DataField label="Cidade" value={clienteSelecionado.cidade} />
                        <DataField label="Estado" value={clienteSelecionado.estado || '---'} />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                        <div className="md:col-span-2"><DataField label="Endereço / Rua" value={clienteSelecionado.endereco} /></div>
                        <DataField label="Número" value={clienteSelecionado.numero} />
                        <DataField label="Bairro" value={clienteSelecionado.bairro || '---'} />
                     </div>
                   </div>
                   <div className="md:col-span-2 pt-6 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DataField label="Email" value={clienteSelecionado.email} />
                      <DataField label="Telefone" value={clienteSelecionado.telefone} />
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'servicos' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Contratos Ativos</h3>
                </div>
                {servicos.length > 0 ? servicos.map(srv => (
                  <div key={srv.id} className="bg-[#1c1c1e] p-8 rounded-[40px] border border-[#333336] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-6">
                       <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${!servicosAutorizados ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                          {!servicosAutorizados ? <Lock size={28} /> : <Briefcase size={28} />}
                       </div>
                       <div>
                         <h4 className="text-xl font-black text-white">{srv.tipo}</h4>
                         <p className="text-xs text-[#98989d] font-bold uppercase tracking-widest">Contrato {srv.formaPagamento}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-8">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${!servicosAutorizados ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                         {!servicosAutorizados ? 'AGUARDANDO LIBERAÇÃO' : 'AUTORIZADO PARA PROCEDIMENTO'}
                       </span>
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${srv.status === StatusServico.CONCLUIDO ? 'bg-emerald-50 text-emerald-600' : 'bg-[#0f0f11] text-[#98989d]'}`}>
                         {srv.status}
                       </span>
                    </div>
                  </div>
                )) : <div className="text-center py-20 text-slate-300 font-black uppercase tracking-widest">Sem serviços.</div>}
              </div>
            )}

            {activeTab === 'financeiro' && (
              <div className="space-y-10 animate-in fade-in duration-300">
                {servicos.filter(s => pagamentos.some(p => p.servicoId === s.id)).map(masterSrv => {
                  const srvPayments = pagamentos.filter(p => p.servicoId === masterSrv.id);
                  const totalContrato = srvPayments.reduce((acc, p) => acc + p.valorParcela, 0);
                  
                  // Agrupamento lógico: encontra procedimentos criados no mesmo contexto (mesmo timestamp prefixo no ID)
                  const batchPrefix = masterSrv.id.split('_').slice(0, 2).join('_'); // Padrão srv_timestamp
                  const procedimentosVinculados = servicos.filter(s => s.id.startsWith(batchPrefix)).map(s => s.tipo);

                  return (
                    <div key={masterSrv.id} className="bg-[#1c1c1e] p-10 rounded-[45px] border border-[#333336] shadow-sm space-y-8">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg"><DollarSign size={24} /></div>
                             <div>
                                <h4 className="text-xl font-black text-white tracking-tight">Fluxo Financeiro: Contrato Único</h4>
                                <p className="text-[10px] font-black text-[#98989d] uppercase tracking-[0.2em] mb-2">Forma: {masterSrv.formaPagamento}</p>
                                <div className="flex flex-wrap gap-2">
                                   {procedimentosVinculados.map(proc => (
                                      <span key={proc} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                         {proc}
                                      </span>
                                   ))}
                                </div>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest">Valor Consolidado</p>
                             <p className="text-2xl font-black text-white">R$ {totalContrato.toFixed(2)}</p>
                          </div>
                       </div>

                       <div className="overflow-x-auto">
                          <table className="w-full text-left">
                             <thead>
                               <tr className="bg-[#0f0f11] text-[10px] font-black text-[#98989d] uppercase tracking-widest">
                                  <th className="px-6 py-4">Parcela</th>
                                  <th className="px-6 py-4">Valor</th>
                                  <th className="px-6 py-4">Vencimento</th>
                                  <th className="px-6 py-4">Comprovante</th>
                                  <th className="px-6 py-4 text-right">Status</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-[#333336]">
                                {srvPayments.map(p => {
                                  const isOverdue = !p.comprovanteId && new Date(p.dataVencimento) < new Date() && p.status !== StatusPagamento.PAGO;
                                  const isPaid = !!p.comprovanteId || p.status === StatusPagamento.PAGO;
                                  return (
                                    <tr key={p.id} className="hover:bg-[#0f0f11]/50 transition-all group">
                                       <td className="px-6 py-4 font-black text-[#e5e5ea]">
                                          {p.numParcela === 1 && masterSrv.formaPagamento === 'Parcelado' ? 'Entrada' : `Parc. ${p.numParcela}`}
                                       </td>
                                       <td className="px-6 py-4 font-black text-white">R$ {p.valorParcela.toFixed(2)}</td>
                                       <td className="px-6 py-4 text-sm font-bold text-[#98989d]">{new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</td>
                                       <td className="px-6 py-4">
                                          {p.comprovanteId ? (
                                            <button onClick={() => {
                                              const doc = documentos.find(d => d.id === p.comprovanteId);
                                              if (doc) window.open(`data:${doc.tipoMime};base64,${doc.conteudoBase64}`, '_blank');
                                            }} className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase hover:underline">
                                              <Paperclip size={14} /> Ver Comprovante
                                            </button>
                                          ) : (
                                            <div className="relative overflow-hidden group/btn">
                                               <input type="file" onChange={(e) => handleFileUpload(e, TipoDocumento.DOCUMENTO_CLIENTE, masterSrv.id, `Comprovante_Parc_${p.numParcela}`)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                               <span className="flex items-center gap-1.5 text-blue-600 font-black text-[10px] uppercase cursor-pointer hover:text-blue-800">
                                                  <Upload size={14} /> Enviar
                                               </span>
                                            </div>
                                          )}
                                       </td>
                                       <td className="px-6 py-4 text-right">
                                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                            isPaid ? 'bg-emerald-50 text-emerald-600' :
                                            isOverdue ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
                                          }`}>
                                            {isPaid ? 'Pago' : isOverdue ? 'Inadimplente' : 'A Vencer'}
                                          </span>
                                       </td>
                                    </tr>
                                  );
                                })}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  );
                })}
                {servicos.filter(s => pagamentos.some(p => p.servicoId === s.id)).length === 0 && (
                  <div className="py-20 text-center text-slate-300 font-black uppercase text-xs tracking-[0.3em]">Nenhum fluxo financeiro registrado.</div>
                )}
              </div>
            )}

            {activeTab === 'checklist' && (
              <div className="space-y-10 animate-in fade-in duration-300">
                {!servicosAutorizados && (
                  <div className="p-8 bg-amber-50 border-2 border-amber-100 rounded-[35px] flex items-center gap-6 text-amber-700 animate-pulse">
                     <Lock size={40} className="shrink-0" />
                     <div>
                        <p className="text-sm font-black uppercase tracking-widest">Acesso Restrito</p>
                        <p className="text-xs font-bold opacity-80">A execução do checklist e processamento de documentos está bloqueada até a confirmação do primeiro pagamento (Entrada ou Integral).</p>
                     </div>
                  </div>
                )}
                <div className={!servicosAutorizados ? 'opacity-40 pointer-events-none grayscale' : ''}>
                  {servicos.map(srv => {
                    const checklist = (clienteSelecionado.tipo === TipoPessoa.JURIDICA && srv.tipo === TipoServicoStrict.RATING) ? CHECKLIST_CONFIG_PJ[srv.tipo] : CHECKLIST_CONFIG[srv.tipo];
                    return (
                      <div key={srv.id} className="bg-[#1c1c1e] p-10 rounded-[45px] border border-[#333336] shadow-sm space-y-8 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg"><ClipboardCheck size={24} /></div>
                            <div>
                              <h4 className="text-xl font-black text-white tracking-tight">Checklist Operacional: {srv.tipo}</h4>
                              <p className="text-[10px] font-black text-[#98989d] uppercase tracking-[0.2em]">Exigências para Processamento</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {checklist.map(item => {
                              const anexo = documentos.find(d => d.servicoId === srv.id && d.nomeArquivo.includes(`[CHECKLIST] ${item}`));
                              return (
                                <div key={item} className={`p-6 rounded-[30px] border-2 transition-all flex flex-col justify-between h-full group ${anexo ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-50 bg-[#0f0f11]/30'}`}>
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="flex-1">
                                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${anexo ? 'text-emerald-600' : 'text-[#98989d]'}`}>Item Requerido</p>
                                        <p className="text-sm font-black text-[#e5e5ea] leading-tight">{item}</p>
                                      </div>
                                      {anexo ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-amber-400" size={20} />}
                                  </div>
                                  <div className="mt-auto">
                                    {anexo ? (
                                      <div className="flex items-center gap-2">
                                          <button onClick={() => window.open(`data:${anexo.tipoMime};base64,${anexo.conteudoBase64}`, '_blank')} className="flex-1 py-3 bg-[#1c1c1e] text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Ver Arquivo</button>
                                          <button onClick={() => setDb(deletarDocumento(anexo.id))} className="p-3 text-red-300 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                      </div>
                                    ) : (
                                      <div className="relative overflow-hidden group/btn">
                                          <input type="file" onChange={(e) => handleFileUpload(e, TipoDocumento.DOCUMENTO_CLIENTE, srv.id, item)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                          <div className="w-full py-3 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all group-hover/btn:bg-blue-700">
                                            <FileUp size={14} /> Anexar Agora
                                          </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'documentos' && (
              <div className="bg-[#1c1c1e] p-10 rounded-[45px] border border-[#333336] shadow-sm animate-in fade-in duration-300">
                 <div className="flex justify-between items-center mb-10">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Acervo de Documentos</h3>
                    <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest">{documentos.length} Arquivos totais</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {documentos.map(doc => (
                      <div key={doc.id} className="p-6 bg-[#0f0f11] border border-[#333336] rounded-[30px] flex items-center gap-5 group hover:border-blue-200 transition-all">
                         <div className="w-12 h-12 bg-[#1c1c1e] rounded-2xl flex items-center justify-center text-blue-500 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <FileIcon size={24} />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">{doc.tipo}</p>
                            <p className="text-sm font-black text-white truncate">{doc.nomeArquivo}</p>
                            <p className="text-[9px] font-bold text-[#98989d] uppercase mt-1">{doc.dataUpload}</p>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => window.open(`data:${doc.tipoMime};base64,${doc.conteudoBase64}`, '_blank')} className="p-3 text-slate-300 hover:text-blue-600 transition-all"><Eye size={18} /></button>
                            <button onClick={() => setDb(deletarDocumento(doc.id))} className="p-3 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                         </div>
                      </div>
                    ))}
                    {documentos.length === 0 && <div className="col-span-2 py-20 text-center text-slate-300 font-black uppercase text-xs tracking-[0.3em]">Nenhum documento encontrado.</div>}
                 </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className={`p-8 rounded-[40px] shadow-2xl text-white relative overflow-hidden group ${isAltoRisco ? 'bg-red-900 border-2 border-red-500' : 'bg-slate-900'}`}>
               <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                 {isAltoRisco ? <ShieldAlert size={20} className="text-red-500" /> : <Zap size={20} className="text-yellow-400" />} 
                 {isAltoRisco ? "Compliance" : "Insights de Venda"}
               </h3>
               {isAltoRisco ? (
                 <p className="text-sm text-red-200 font-bold leading-relaxed bg-red-800/40 p-6 rounded-3xl border border-red-700/50">
                    BLOQUEIO ATIVO: Cliente inadimplente ou com alto score de risco. Novos parcelamentos proibidos.
                 </p>
               ) : (
                 <button onClick={handleIA} disabled={carregandoIA} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-blue-700 disabled:opacity-50">
                   {carregandoIA ? "Analisando..." : "Analisar Oportunidades"}
                 </button>
               )}
            </div>
            {servicosAutorizados && (
               <div className="p-8 bg-emerald-600 rounded-[40px] shadow-2xl text-white">
                  <div className="flex items-center gap-3 mb-4">
                     <ShieldCheck size={24} />
                     <h3 className="text-lg font-black uppercase tracking-tighter">Fluxo Autorizado</h3>
                  </div>
                  <p className="text-xs font-bold opacity-90 leading-relaxed">Este cliente cumpriu o requisito financeiro inicial. Todos os procedimentos operacionais estão desbloqueados para processamento.</p>
               </div>
            )}
          </div>
        </div>

        {mostrarModalAnexo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6 overflow-y-auto">
             <div className="bg-[#1c1c1e] w-full max-w-lg rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-2xl font-black text-white">Anexar Documento</h3>
                      <p className="text-xs font-bold text-[#98989d] uppercase tracking-widest mt-1">Acervo Digital do Cliente</p>
                   </div>
                   <button onClick={() => setMostrarModalAnexo(false)} className="text-slate-300 hover:text-red-500 transition-all"><X size={32} /></button>
                </div>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Tipo de Documento</label>
                      <select value={anexoState.tipo} onChange={e => setAnexoState({...anexoState, tipo: e.target.value as any})} className="w-full px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-600">
                         {Object.values(TipoDocumento).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Serviço Relacionado (Opcional)</label>
                      <select value={anexoState.servicoId} onChange={e => setAnexoState({...anexoState, servicoId: e.target.value})} className="w-full px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-600">
                         <option value="">Não vincular a serviço específico</option>
                         {servicos.map(s => <option key={s.id} value={s.id}>{s.tipo}</option>)}
                      </select>
                   </div>
                   <div className="relative group">
                      <input type="file" onChange={(e) => handleFileUpload(e, anexoState.tipo, anexoState.servicoId)} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                      <div className="w-full h-40 border-4 border-dashed border-[#333336] rounded-[35px] flex flex-col items-center justify-center gap-4 group-hover:bg-[#0f0f11] group-hover:border-blue-100 transition-all">
                         <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all"><Paperclip size={24} /></div>
                         <p className="text-xs font-black text-[#98989d] uppercase tracking-widest">Clique ou arraste para enviar</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        {mostrarModalNovoServico && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6 overflow-y-auto">
             <div className="bg-[#1c1c1e] w-full max-w-2xl rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Adicionar Serviço</h3>
                  <button onClick={() => setMostrarModalNovoServico(false)} className="text-slate-300 hover:text-red-500"><X size={32} /></button>
                </div>
                <form onSubmit={handleAddServicoAvulso} className="space-y-6">
                   <select value={formServico.tipo} onChange={e => setFormServico({...formServico, tipo: e.target.value as any})} className="w-full px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold">
                     {Object.values(TipoServicoStrict).map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                   <div className="grid grid-cols-2 gap-4">
                      <input type="number" required placeholder="Valor Total" value={formServico.valor} onChange={e => setFormServico({...formServico, valor: e.target.value})} className="w-full px-5 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold" />
                      <select 
                        value={isAltoRisco ? 'À Vista' : formServico.formaPagamento} 
                        disabled={isAltoRisco}
                        onChange={e => setFormServico({...formServico, formaPagamento: e.target.value as any})} 
                        className={`w-full px-5 py-4 border-2 rounded-2xl font-bold ${isAltoRisco ? 'bg-red-50 border-red-200 text-red-700' : 'bg-[#0f0f11] border-[#333336]'}`}
                      >
                        <option value="À Vista">À Vista</option>
                        <option value="Parcelado">Parcelado</option>
                      </select>
                   </div>
                   <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-[25px] shadow-2xl hover:bg-blue-700">Confirmar Contrato</button>
                </form>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="relative group flex-1 max-w-xl">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
          <input type="text" placeholder="Buscar por nome ou documento..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full pl-14 pr-8 py-4 bg-[#1c1c1e] border-2 border-[#333336] rounded-[25px] outline-none focus:border-blue-500/50 font-bold transition-all shadow-sm" />
        </div>
        <button 
          onClick={handleNovoCadastroClick} 
          className="px-8 py-4 bg-blue-600 text-white rounded-[25px] font-black text-sm flex items-center gap-3 shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus size={24} /> NOVO CLIENTE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clientesFiltrados.map((cliente: Cliente) => (
          <div key={cliente.id} onClick={() => handleOpenPasta(cliente)} className="bg-[#1c1c1e] p-8 rounded-[45px] border border-[#333336] shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col h-full relative overflow-hidden">
            {cliente.riskLevel === NivelRisco.ALTO && <div className="absolute top-0 right-0 px-4 py-1 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-2xl">Bloqueado</div>}
            <div className="flex items-center gap-5 mb-8">
              <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center text-2xl font-black transition-all shadow-inner ${cliente.riskLevel === NivelRisco.ALTO ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                {cliente.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-white tracking-tight truncate">{cliente.nome}</h3>
                <p className="text-[11px] font-black text-[#98989d] uppercase tracking-widest">{cliente.riskLevel} • {cliente.riskScore} pts</p>
                <p className="text-[10px] font-bold text-slate-300 mt-1 uppercase">Cadastrado em: {cliente.dataCadastro}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest group-hover:tracking-[0.2em] transition-all">Gerenciar Pasta Digital</span>
              <ChevronRight size={18} className="text-slate-200 group-hover:text-blue-500 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {mostrarModalNovoCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="bg-[#1c1c1e] w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
             <form onSubmit={handleSalvarNovoCliente} className="p-10 space-y-8">
                <div className="flex justify-between items-center border-b border-[#333336] pb-6">
                  <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Novo Cadastro Estruturado</h3>
                  <button type="button" onClick={() => setMostrarModalNovoCliente(false)} className="text-slate-300 hover:text-red-500"><X size={32} /></button>
                </div>

                <div className="space-y-6">
                   <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><User size={16} /> Identificação Pessoal</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Nome Completo *</label>
                      <input required value={formCliente.nome} onChange={e => setFormCliente({...formCliente, nome: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">CPF / CNPJ *</label>
                      <input required value={formCliente.documento} onChange={e => setFormCliente({...formCliente, documento: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Data de Nascimento</label>
                      <div className="flex items-center gap-3">
                        <input type="date" value={formCliente.dataNascimento} onChange={e => setFormCliente({...formCliente, dataNascimento: e.target.value})} className="flex-1 px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                        {idadeCalculada !== null && <span className="px-4 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs">{idadeCalculada} anos</span>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Tipo de Pessoa</label>
                      <select value={formCliente.tipo} onChange={e => setFormCliente({...formCliente, tipo: e.target.value as any})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none">
                         <option value={TipoPessoa.FISICA}>Física</option>
                         <option value={TipoPessoa.JURIDICA}>Jurídica</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><MapPin size={16} /> Dados Residenciais</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">CEP</label>
                        <input value={formCliente.cep} onChange={e => setFormCliente({...formCliente, cep: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Cidade</label>
                        <input value={formCliente.cidade} onChange={e => setFormCliente({...formCliente, cidade: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Estado</label>
                        <input placeholder="Ex: SP" maxLength={2} value={formCliente.estado} onChange={e => setFormCliente({...formCliente, estado: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Endereço / Rua</label>
                        <input value={formCliente.endereco} onChange={e => setFormCliente({...formCliente, endereco: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Número</label>
                        <input value={formCliente.numero} onChange={e => setFormCliente({...formCliente, numero: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Bairro</label>
                        <input value={formCliente.bairro} onChange={e => setFormCliente({...formCliente, bairro: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                      </div>
                    </div>
                </div>

                <div className="p-8 bg-blue-50/50 rounded-[35px] border-2 border-blue-100 space-y-6">
                   <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><Briefcase size={18} /> Seleção de Serviços e Financeiro</h4>
                   
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Tipo de Serviço Contratado</label>
                     <select 
                      required 
                      value={formCliente.tipoServicoContratado} 
                      onChange={e => setFormCliente({...formCliente, tipoServicoContratado: e.target.value})} 
                      className="w-full px-5 py-4 bg-[#1c1c1e] border-2 border-[#333336] rounded-2xl font-bold text-sm outline-none focus:border-blue-600 transition-all"
                     >
                        <option value="">Selecione o serviço...</option>
                        <optgroup label="🔹 Serviços Individuais">
                          <option value="Limpa Nome">Limpa Nome</option>
                          <option value="Aumento de Score">Aumento de Score</option>
                          <option value="Rating Bancário">Rating Bancário</option>
                          <option value="JusBrasil">Jus Brasil</option>
                          <option value="Redução de Parcelas">Redução de Parcelas</option>
                          <option value="Limpa Tela">Limpa Tela</option>
                        </optgroup>
                        <optgroup label="🔹 Combos de 2 Serviços (Dual)">
                          <option value="Limpa Nome, Aumento de Score">Limpa Nome + Aumento de Score</option>
                          <option value="Limpa Nome, Rating Bancário">Limpa Nome + Rating Bancário</option>
                          <option value="Limpa Nome, JusBrasil">Limpa Nome + Jus Brasil</option>
                          <option value="Limpa Nome, Limpa Tela">Limpa Nome + Limpa Tela</option>
                          <option value="Limpa Nome, Redução de Parcelas">Limpa Nome + Redução de Parcelas</option>
                        </optgroup>
                        <optgroup label="🔹 Pacotes Completos (High-Value)">
                          <option value="Limpa Nome, Aumento de Score, Rating Bancário, JusBrasil, Limpa Tela">Combo 5 em 1</option>
                          <option value="Limpa Nome, Aumento de Score, Rating Bancário, JusBrasil, Limpa Tela, Redução de Parcelas">Combo Master 6 em 1</option>
                        </optgroup>
                     </select>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#98989d] uppercase ml-2">Valor Total (R$)</label>
                        <input required type="number" placeholder="0,00" value={formCliente.valorTotal} onChange={e => setFormCliente({...formCliente, valorTotal: e.target.value})} className="w-full px-5 py-4 bg-[#1c1c1e] border border-[#333336] rounded-2xl font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#98989d] uppercase ml-2">Entrada (R$)</label>
                        <input type="number" placeholder="0,00" value={formCliente.valorEntrada} onChange={e => setFormCliente({...formCliente, valorEntrada: e.target.value})} className="w-full px-5 py-4 bg-[#1c1c1e] border border-[#333336] rounded-2xl font-bold text-emerald-600" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-[#98989d] uppercase ml-2">Forma</label>
                        <select value={formCliente.formaPagamento} onChange={e => setFormCliente({...formCliente, formaPagamento: e.target.value})} className="w-full px-5 py-4 bg-[#1c1c1e] border border-[#333336] rounded-2xl font-bold">
                           <option value="À Vista">À Vista</option>
                           <option value="Parcelado">Parcelado</option>
                        </select>
                      </div>
                      {formCliente.formaPagamento === 'Parcelado' && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-[#98989d] uppercase ml-2">Parcelas</label>
                          <input type="number" min="1" max="12" placeholder="Qtd" value={formCliente.qtdParcelas} onChange={e => setFormCliente({...formCliente, qtdParcelas: e.target.value})} className="w-full px-5 py-4 bg-[#1c1c1e] border border-[#333336] rounded-2xl font-bold" />
                        </div>
                      )}
                   </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#98989d] uppercase tracking-widest ml-2">Observações Gerais</label>
                    <textarea value={formCliente.observacoesGerais} onChange={e => setFormCliente({...formCliente, observacoesGerais: e.target.value})} className="w-full px-6 py-4 bg-[#0f0f11] border-2 border-[#333336] rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" rows={2} />
                </div>

                <button type="submit" className="w-full py-6 bg-blue-600 text-white font-black uppercase tracking-[0.3em] rounded-[25px] shadow-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-4 active:scale-95">
                   <Save size={24} /> Finalizar Cadastro e Gerar Serviços
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DataField = ({ label, value }: { label: string, value: string }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest">{label}</p>
    <p className="text-base font-bold text-[#e5e5ea]">{value || "Não informado"}</p>
  </div>
);

export default ClientesView;
