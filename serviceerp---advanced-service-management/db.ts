
import { 
  Cliente, ServicoContratado, Pagamento, TipoPessoa, 
  StatusServico, StatusPagamento, TipoServicoStrict, ClientePorLista, ListaProcessual, Documento, TipoDocumento,
  ListaOrgao, HistoricoAcompanhamento, StatusOrgao, Fornecedor, StatusFornecedor, NivelRisco, PrioridadeOperacional
} from './types';

const STORAGE_KEY = 'service_erp_db_v5_final';

interface DB {
  clientes: Cliente[];
  servicos: ServicoContratado[];
  documentos: Documento[];
  pagamentos: Pagamento[];
  listas: ListaProcessual[];
  listaOrgaos: ListaOrgao[];
  clientesPorLista: ClientePorLista[];
  historico: HistoricoAcompanhamento[];
  fornecedores: Fornecedor[];
}

const initialDB: DB = {
  clientes: [],
  servicos: [],
  documentos: [],
  pagamentos: [],
  listas: [],
  listaOrgaos: [],
  clientesPorLista: [],
  historico: [],
  fornecedores: [
    { id: 'f1', nome: 'Aldemir (Impactus, ELO)', contato: '', status: StatusFornecedor.ATIVO, scoreAtual: 85, tendencia: 'stable', posicaoRank: 1, slaCumprimento: 90, atrasoMedioDias: 2, taxaRetrabalho: 5, custoMedioMercadoRelativo: 100, capacidadeVolume: 80 },
    { id: 'f2', nome: 'João Tesser (Alecred, ELO)', contato: '', status: StatusFornecedor.ATIVO, scoreAtual: 78, tendencia: 'up', posicaoRank: 2, slaCumprimento: 82, atrasoMedioDias: 3, taxaRetrabalho: 8, custoMedioMercadoRelativo: 95, capacidadeVolume: 70 },
    { id: 'f3', nome: 'Rick (Partner, M12)', contato: '', status: StatusFornecedor.ATIVO, scoreAtual: 72, tendencia: 'down', posicaoRank: 3, slaCumprimento: 75, atrasoMedioDias: 5, taxaRetrabalho: 12, custoMedioMercadoRelativo: 90, capacidadeVolume: 90 }
  ]
};

export const getDB = (): DB => {
  const data = localStorage.getItem(STORAGE_KEY);
  const parsed = data ? JSON.parse(data) : initialDB;
  const db = { 
    ...initialDB, 
    ...parsed,
    listas: parsed.listas || [],
    listaOrgaos: parsed.listaOrgaos || [],
    clientesPorLista: parsed.clientesPorLista || [],
    historico: parsed.historico || [],
    fornecedores: parsed.fornecedores || initialDB.fornecedores
  };

  db.clientes = db.clientes.map((c: Cliente) => refreshRiskScore(c, db));
  return db;
};

export const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

const refreshRiskScore = (cliente: Cliente, db: DB): Cliente => {
  let score = 0;
  const clientServices = db.servicos.filter(s => s.clienteId === cliente.id);
  const clientPayments = db.pagamentos.filter(p => p.clienteId === cliente.id);
  const clientDocs = db.documentos.filter(d => d.clienteId === cliente.id);

  clientServices.forEach(srv => {
    if (srv.status !== StatusServico.CONCLUIDO) {
        const docsCount = clientDocs.filter(d => d.servicoId === srv.id).length;
        if (docsCount < 2) score += 15; 
    }
  });

  const overdueCount = clientPayments.filter(p => p.status === StatusPagamento.ATRASADO || (p.status === StatusPagamento.PENDENTE && new Date(p.dataVencimento) < new Date())).length;
  score += overdueCount * 15;

  const defaultCount = clientPayments.filter(p => {
    const isLate = p.status === StatusPagamento.ATRASADO || (p.status === StatusPagamento.PENDENTE && new Date(p.dataVencimento) < new Date());
    if (!isLate) return false;
    const diffTime = Math.abs(new Date().getTime() - new Date(p.dataVencimento).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 30;
  }).length;
  score += defaultCount * 40;

  if (clientServices.some(s => s.status === StatusServico.SUSPENSO)) score += 20;

  score = Math.min(100, score);

  let riskLevel = NivelRisco.BAIXO;
  let prioridade = PrioridadeOperacional.ALTA;

  if (score > 60) {
    riskLevel = NivelRisco.ALTO;
    prioridade = PrioridadeOperacional.CONGELADO;
  } else if (score > 30) {
    riskLevel = NivelRisco.MEDIO;
    prioridade = PrioridadeOperacional.NORMAL;
  }

  return { ...cliente, riskScore: score, riskLevel, prioridade };
};

const mapearServicosDoCombo = (combo: string): TipoServicoStrict[] => {
  if (!combo) return [];
  const validValues = Object.values(TipoServicoStrict) as string[];
  return combo.split(',')
    .map(s => s.trim())
    .filter(s => validValues.includes(s)) as TipoServicoStrict[];
};

export const inserirClienteCompleto = (formData: any): { db: DB; cliente: Cliente } => {
  const db = getDB();
  const clienteId = `cli_${Date.now()}`;
  
  const novoCliente: Cliente = {
    id: clienteId,
    nome: formData.nome,
    tipo: formData.tipo,
    documento: formData.documento,
    rgIe: formData.rgIe || '',
    dataNascimento: formData.dataNascimento || '',
    endereco: formData.endereco,
    bairro: formData.bairro || '',
    estado: formData.estado || '',
    cep: formData.cep || '',
    numero: formData.numero || '',
    cidade: formData.cidade || '',
    telefone: formData.telefone,
    email: formData.email,
    dataCadastro: new Date().toLocaleDateString('pt-BR'),
    observacoes: formData.observacoesGerais || '',
    riskScore: 0,
    riskLevel: NivelRisco.BAIXO,
    prioridade: PrioridadeOperacional.ALTA
  };

  db.clientes.push(novoCliente);

  if (formData.tipoServicoContratado && formData.valorTotal) {
    const servicosParaCriar = mapearServicosDoCombo(formData.tipoServicoContratado);
    const valorTotalNum = Number(formData.valorTotal);
    const valorEntradaNum = Number(formData.valorEntrada || 0);
    const valorRestante = valorTotalNum - valorEntradaNum;
    
    // Agora o valor é vinculado ao CONTRATO (Primeiro serviço age como master financeiro)
    const qtdParcelasBase = formData.formaPagamento === 'Parcelado' ? Number(formData.qtdParcelas) : 1;
    const dataContrato = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();

    let masterServicoId = '';

    servicosParaCriar.forEach((tipo, index) => {
      const servicoId = `srv_${timestamp}_${index}`;
      if (index === 0) masterServicoId = servicoId;

      const contrato: ServicoContratado = {
        id: servicoId,
        clienteId: clienteId,
        tipo: tipo,
        // Procedimentos secundários não carregam valor financeiro individual para não duplicar no financeiro
        valorContratado: index === 0 ? valorTotalNum : 0, 
        formaPagamento: formData.formaPagamento as 'À Vista' | 'Parcelado',
        qtdParcelas: qtdParcelasBase + (valorEntradaNum > 0 ? 1 : 0),
        dataContrato: dataContrato,
        prazoAcordado: '30 dias',
        status: StatusServico.INICIO,
        progresso: 0,
        obsTecnicas: formData.observacoesGerais || '',
        responsavel: 'Admin'
      };
      db.servicos.push(contrato);
    });

    // Geração de pagamentos ÚNICA para o contrato (vinculada ao masterServicoId)
    if (masterServicoId) {
      const totalParcelas = qtdParcelasBase + (valorEntradaNum > 0 ? 1 : 0);

      if (valorEntradaNum > 0) {
        db.pagamentos.push({ 
          id: `pag_${masterServicoId}_entrada`, 
          clienteId: clienteId, 
          servicoId: masterServicoId, 
          valorTotal: valorTotalNum, 
          numParcela: 1, 
          qtdParcelas: totalParcelas, 
          valorParcela: valorEntradaNum, 
          dataVencimento: dataContrato, 
          status: StatusPagamento.PENDENTE 
        });
      }

      if (formData.formaPagamento === 'Parcelado') {
        const valorParcela = valorRestante / qtdParcelasBase;
        for (let i = 1; i <= qtdParcelasBase; i++) {
          const dataVenc = new Date(dataContrato);
          dataVenc.setMonth(dataVenc.getMonth() + i);
          db.pagamentos.push({ 
            id: `pag_${masterServicoId}_${i + (valorEntradaNum > 0 ? 1 : 0)}`, 
            clienteId: clienteId, 
            servicoId: masterServicoId, 
            valorTotal: valorTotalNum, 
            numParcela: i + (valorEntradaNum > 0 ? 1 : 0), 
            qtdParcelas: totalParcelas, 
            valorParcela: valorParcela, 
            dataVencimento: dataVenc.toISOString().split('T')[0], 
            status: StatusPagamento.PENDENTE 
          });
        }
      } else if (valorEntradaNum === 0) {
        db.pagamentos.push({ 
          id: `pag_${masterServicoId}_avista`, 
          clienteId: clienteId, 
          servicoId: masterServicoId, 
          valorTotal: valorTotalNum, 
          numParcela: 1, 
          qtdParcelas: 1, 
          valorParcela: valorTotalNum, 
          dataVencimento: dataContrato, 
          status: StatusPagamento.PENDENTE 
        });
      }
    }
  }

  saveDB(db);
  return { db, cliente: novoCliente };
};

export const adicionarServicoAoCliente = (clienteId: string, s: any): DB => {
  const db = getDB();
  const cliente = db.clientes.find(c => c.id === clienteId);
  
  if (cliente && cliente.riskLevel === NivelRisco.ALTO && s.formaPagamento === 'Parcelado') {
    throw new Error("Bloqueio Compliance: Clientes de Alto Risco só podem contratar novos serviços mediante pagamento integral À Vista.");
  }

  const servicoId = `srv_${Date.now()}`;
  const valorTotal = Number(s.valor);
  const qtdParcelas = s.formaPagamento === 'Parcelado' ? Number(s.qtdParcelas) : 1;
  const contrato: ServicoContratado = {
    id: servicoId,
    clienteId: clienteId,
    tipo: s.tipo as TipoServicoStrict,
    valorContratado: valorTotal,
    formaPagamento: s.formaPagamento,
    qtdParcelas: qtdParcelas,
    dataContrato: s.dataContrato || new Date().toISOString().split('T')[0],
    prazoAcordado: s.prazoAcordado || '30 dias',
    status: s.status || StatusServico.INICIO,
    progresso: s.progresso || 0,
    obsTecnicas: s.observacoes || '',
    responsavel: 'Admin'
  };
  db.servicos.push(contrato);
  const valorParcela = valorTotal / qtdParcelas;
  for (let i = 1; i <= qtdParcelas; i++) {
    const dataVenc = new Date(contrato.dataContrato);
    dataVenc.setMonth(dataVenc.getMonth() + (i - 1));
    db.pagamentos.push({ id: `pag_${servicoId}_${i}`, clienteId: clienteId, servicoId: servicoId, valorTotal: valorTotal, numParcela: i, qtdParcelas: qtdParcelas, valorParcela: valorParcela, dataVencimento: dataVenc.toISOString().split('T')[0], status: StatusPagamento.PENDENTE });
  }
  saveDB(db);
  return db;
};

export const vincularClienteAoLote = (clienteId: string, servicoId: string, listaId: string): DB => {
  const db = getDB();
  const cliente = db.clientes.find(c => c.id === clienteId);

  if (cliente && cliente.riskLevel === NivelRisco.ALTO) {
    throw new Error("Bloqueio de Lote: Clientes de Alto Risco estão impedidos de entrar em novas listas operacionais até regularização.");
  }

  const jaExiste = db.clientesPorLista.some((c: ClientePorLista) => c.clienteId === clienteId && c.listaId === listaId);
  if (jaExiste) throw new Error("Este cliente já está vinculado a este lote.");
  const lista = db.listas.find(l => l.id === listaId);
  if (lista && lista.fornecedor) {
    const forn = db.fornecedores.find(f => f.nome === lista.fornecedor);
    if (forn && forn.status === StatusFornecedor.BLOQUEADO) throw new Error("Impossível vincular: Fornecedor deste lote está bloqueado.");
  }
  const novoVinculo: ClientePorLista = { id: `cbl_${Date.now()}`, clienteId, servicoId, listaId, situacao: 'Aguardando', nadaConstaAnexado: false, observacoesIndividuais: 'Vinculado ao lote.' };
  db.clientesPorLista.push(novoVinculo);
  saveDB(db);
  return db;
};

export const atualizarStatusPagamento = (pagamentoId: string, novoStatus: StatusPagamento, comprovanteId?: string): DB => {
  const db = getDB();
  const index = db.pagamentos.findIndex(p => p.id === pagamentoId);
  if (index !== -1) {
    db.pagamentos[index].status = novoStatus;
    if (comprovanteId) db.pagamentos[index].comprovanteId = comprovanteId;
    
    const cliente = db.clientes.find(c => c.id === db.pagamentos[index].clienteId);
    if (cliente) {
        const updated = refreshRiskScore(cliente, db);
        const cliIndex = db.clientes.findIndex(c => c.id === updated.id);
        db.clientes[cliIndex] = updated;
    }
    saveDB(db);
  }
  return db;
};

export const atualizarProgressoServico = (servicoId: string, novoProgresso: number): DB => {
  const db = getDB();
  const index = db.servicos.findIndex(s => s.id === servicoId);
  if (index !== -1) {
    db.servicos[index].progresso = novoProgresso;
    if (novoProgresso === 100) db.servicos[index].status = StatusServico.CONCLUIDO;
    saveDB(db);
  }
  return db;
};

export const anexarArquivoReal = (clienteId: string, tipo: TipoDocumento, file: File, conteudoBase64: string, servicoId?: string): DB => {
  const db = getDB();
  const novoDoc: Documento = { id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, clienteId, servicoId, tipo, nomeArquivo: file.name, conteudoBase64, tipoMime: file.type, tamanhoArquivo: file.size, dataUpload: new Date().toLocaleString('pt-BR') };
  db.documentos.push(novoDoc);
  if (servicoId && file.name.toLowerCase().includes('comprovante')) {
    const pagPendente = db.pagamentos.find(p => p.servicoId === servicoId && !p.comprovanteId);
    if (pagPendente) pagPendente.comprovanteId = novoDoc.id;
  }
  saveDB(db);
  return db;
};

export const deletarDocumento = (docId: string): DB => {
  const db = getDB();
  db.documentos = db.documentos.filter(d => d.id !== docId);
  saveDB(db);
  return db;
};

export const registrarAcaoAcompanhamento = (clienteId: string, servicoId: string, tipoServico: TipoServicoStrict, statusNovo: StatusServico, msgWhatsApp: string, responsavel: string = 'Administrador'): DB => {
  const db = getDB();
  const timestamp = new Date().toLocaleString('pt-BR');
  const srvIndex = db.servicos.findIndex(s => s.id === servicoId);
  if (srvIndex !== -1) {
    db.servicos[srvIndex].status = statusNovo;
    if (statusNovo === StatusServico.CONCLUIDO) db.servicos[srvIndex].progresso = 100;
  }
  db.historico.push({ id: `hist_${Date.now()}_1`, clienteId, servicoId, tipoServico, tipoAcao: 'Status', conteudo: `Status alterado para: ${statusNovo}`, statusNovo, dataHora: timestamp, responsavel });
  db.historico.push({ id: `hist_${Date.now()}_2`, clienteId, servicoId, tipoServico, tipoAcao: 'WhatsApp', conteudo: msgWhatsApp, statusNovo, dataHora: timestamp, responsavel });
  saveDB(db);
  return db;
};

export const atualizarStatusOrgaoNoLote = (listaId: string, nomeOrgao: string, novoStatus: StatusOrgao): DB => {
  const db = getDB();
  const timestamp = new Date().toLocaleString('pt-BR');
  let orgaoIndex = db.listaOrgaos.findIndex(o => o.listaId === listaId && o.nomeOrgao === nomeOrgao);
  if (orgaoIndex === -1) {
    db.listaOrgaos.push({ id: `lo_${Date.now()}`, listaId, nomeOrgao, status: novoStatus, percentualConclusao: novoStatus === StatusOrgao.CONCLUIDO ? 100 : (novoStatus === StatusOrgao.INICIADO ? 50 : 0) });
  } else {
    db.listaOrgaos[orgaoIndex].status = novoStatus;
    db.listaOrgaos[orgaoIndex].percentualConclusao = novoStatus === StatusOrgao.CONCLUIDO ? 100 : (novoStatus === StatusOrgao.INICIADO ? 50 : 0);
  }
  const vinculacoes = db.clientesPorLista.filter(v => v.listaId === listaId);
  vinculacoes.forEach(v => {
    const srvIndex = db.servicos.findIndex(s => s.id === v.servicoId);
    if (srvIndex !== -1) {
      const srv = db.servicos[srvIndex];
      if (novoStatus === StatusOrgao.CONCLUIDO) {
        db.historico.push({ id: `hist_${Date.now()}_${Math.random()}`, clienteId: v.clienteId, servicoId: v.servicoId, tipoServico: srv.tipo, tipoAcao: 'Status', conteudo: `Órgão ${nomeOrgao} regularizado via Lote.`, dataHora: timestamp, responsavel: 'Sistema' });
        srv.progresso = Math.min(srv.progresso + 20, 100);
        if (srv.progresso === 100) srv.status = StatusServico.CONCLUIDO;
      }
    }
  });
  const orgaosObrigatorios = ["Serasa", "SPC", "Boa Vista", "Cenprot SP", "Cenprot Nacional"];
  const orgaosDestaLista = db.listaOrgaos.filter(o => o.listaId === listaId);
  const todosBaixados = orgaosObrigatorios.every(nome => orgaosDestaLista.some(o => o.nomeOrgao === nome && o.status === StatusOrgao.CONCLUIDO));
  if (todosBaixados) {
    const lIndex = db.listas.findIndex(l => l.id === listaId);
    if (lIndex !== -1) { db.listas[lIndex].statusGeral = '100% Baixado'; db.listas[lIndex].ultimaAtualizacao = timestamp; }
  }
  saveDB(db);
  return db;
};

export const atualizarServico = (servico: ServicoContratado): DB => {
  const db = getDB();
  const index = db.servicos.findIndex(s => s.id === servico.id);
  if (index !== -1) {
    db.servicos[index] = { ...servico };
    saveDB(db);
  }
  return db;
};

export const atualizarCliente = (cliente: Cliente): DB => {
  const db = getDB();
  const index = db.clientes.findIndex(c => c.id === cliente.id);
  if (index !== -1) {
    db.clientes[index] = { ...cliente };
    saveDB(db);
  }
  return db;
};

// Functions to calculate batch metrics for Command Dashboard
export const calcularMargensLote = (listaId: string): { bruta: number; liquida: number } => {
  const db = getDB();
  const vinculacoes = db.clientesPorLista.filter(v => v.listaId === listaId);
  const lista = db.listas.find(l => l.id === listaId);
  
  if (!lista) return { bruta: 0, liquida: 0 };

  const bruta = vinculacoes.reduce((acc, v) => {
    const srv = db.servicos.find(s => s.id === v.servicoId);
    return acc + (srv?.valorContratado || 0);
  }, 0);

  const custoFixoLote = lista.custoAcao || 0;
  // Custo operacional unitário definido em CommandDashboardView.tsx (R$ 50,00)
  const custoOperacionalUnitario = 50; 
  const custoTotal = custoFixoLote + (vinculacoes.length * custoOperacionalUnitario);
  const liquida = bruta - custoTotal;

  return { bruta, liquida };
};

export const calcularRiscoLote = (listaId: string): NivelRisco => {
  const db = getDB();
  const vinculacoes = db.clientesPorLista.filter(v => v.listaId === listaId);
  if (vinculacoes.length === 0) return NivelRisco.BAIXO;

  let scoreTotal = 0;
  vinculacoes.forEach(v => {
    const cliente = db.clientes.find(c => c.id === v.clienteId);
    if (cliente) scoreTotal += cliente.riskScore;
  });

  const mediaRisco = scoreTotal / vinculacoes.length;

  if (mediaRisco > 80) return NivelRisco.CRITICO;
  if (mediaRisco > 60) return NivelRisco.ALTO;
  if (mediaRisco > 30) return NivelRisco.MEDIO;
  return NivelRisco.BAIXO;
};
