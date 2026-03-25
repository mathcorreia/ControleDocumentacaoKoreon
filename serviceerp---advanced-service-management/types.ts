
export enum TipoPessoa {
  FISICA = 'Pessoa Física',
  JURIDICA = 'Pessoa Jurídica'
}

export enum TipoServicoStrict {
  LIMPA_NOME = 'Limpa Nome',
  SCORE = 'Aumento de Score',
  RATING = 'Rating Bancário',
  REDUCAO = 'Redução de Parcelas',
  JUSBRASIL = 'JusBrasil',
  LIMPA_TELA = 'Limpa Tela'
}

export enum StatusServico {
  INICIO = 'Início',
  EM_ANDAMENTO = 'Em Andamento',
  FASE_FINAL = 'Fase Final',
  CONCLUIDO = 'Concluído',
  ATRASADO = 'Atrasado',
  SUSPENSO = 'Suspenso por Risco'
}

export enum StatusPagamento {
  PAGO = 'Pago',
  PENDENTE = 'Pendente',
  ATRASADO = 'Atrasado'
}

export enum TipoDocumento {
  CONTRATO = 'Contrato',
  DOCUMENTO_CLIENTE = 'Documento do Cliente',
  FICHA_ASSOCIATIVA = 'Ficha Associativa',
  CONSULTA = 'Consulta',
  NADA_CONSTA = 'Nada Consta'
}

export enum StatusOrgao {
  NAO_INICIADO = 'Não Iniciado',
  INICIADO = 'Iniciado',
  CONCLUIDO = 'Concluído'
}

export enum StatusLista {
  EM_ANDAMENTO = 'Em andamento',
  CONCLUIDO = '100% Baixado',
  REPROTOCOLO = 'Reprotocolo'
}

export enum StatusFornecedor {
  ATIVO = 'Ativo',
  OBSERVACAO = 'Em Observação',
  BLOQUEADO = 'Bloqueado Automaticamente'
}

export enum NivelRisco {
  BAIXO = 'Risco Baixo',
  MEDIO = 'Risco Médio',
  ALTO = 'Alto Risco',
  CRITICO = 'Risco Crítico'
}

export enum PrioridadeOperacional {
  ALTA = 'Alta Prioridade',
  NORMAL = 'Prioridade Normal',
  CONGELADO = 'Operação Congelada'
}

export interface Fornecedor {
  id: string;
  nome: string;
  contato: string;
  status: StatusFornecedor;
  scoreAtual: number;
  tendencia: 'up' | 'down' | 'stable';
  posicaoRank: number;
  slaCumprimento: number; 
  atrasoMedioDias: number;
  taxaRetrabalho: number; 
  custoMedioMercadoRelativo: number; 
  capacidadeVolume: number; 
}

export interface Documento {
  id: string;
  clienteId: string;
  servicoId?: string;
  tipo: TipoDocumento;
  nomeArquivo: string;
  conteudoBase64: string;
  tipoMime: string;
  tamanhoArquivo: number;
  dataUpload: string;
}

export interface ServicoContratado {
  id: string;
  clienteId: string;
  tipo: TipoServicoStrict; 
  valorContratado: number;
  formaPagamento: 'À Vista' | 'Parcelado';
  qtdParcelas: number;
  dataContrato: string;
  prazoAcordado: string;
  status: StatusServico;
  progresso: number; 
  obsTecnicas: string;
  responsavel: string;
  margemLiquida?: number;
  nivelRisco?: NivelRisco;
}

export interface Cliente {
  id: string;
  nome: string;
  tipo: TipoPessoa;
  documento: string; 
  rgIe: string;
  dataNascimento?: string;
  endereco: string;
  bairro?: string;
  estado?: string;
  cep: string;
  numero: string;
  cidade: string;
  telefone: string;
  email: string;
  dataCadastro: string;
  observacoes: string;
  riskScore: number;
  riskLevel: NivelRisco;
  prioridade: PrioridadeOperacional;
}

export interface Pagamento {
  id: string;
  clienteId: string;
  servicoId: string;
  valorTotal: number;
  numParcela: number;
  qtdParcelas: number;
  valorParcela: number;
  dataVencimento: string;
  status: StatusPagamento;
  comprovanteId?: string; 
}

export interface ListaProcessual {
  id: string;
  nome: string;
  tipoServico: TipoServicoStrict;
  dataInicio: string;
  statusGeral: 'Em andamento' | '100% Baixado' | 'Reprotocolo';
  ultimaAtualizacao: string;
  observacoes: string;
  fornecedor?: string; 
  custoAcao?: number;
  margemBruta?: number;
  margemLiquida?: number;
  riscoCalculado?: NivelRisco;
}

export interface ListaOrgao {
  id: string;
  listaId: string;
  nomeOrgao: string;
  status: StatusOrgao;
  percentualConclusao: number;
}

export interface ClientePorLista {
  id: string;
  clienteId: string;
  servicoId: string;
  listaId: string;
  situacao: 'Aguardando' | 'Em andamento' | 'Finalizado' | 'Baixado' | 'Reprotocolo';
  nadaConstaAnexado: boolean;
  observacoesIndividuais: string;
}

export interface HistoricoAcompanhamento {
  id: string;
  clienteId: string;
  servicoId: string;
  tipoServico: TipoServicoStrict;
  tipoAcao: 'Status' | 'WhatsApp';
  conteudo: string;
  statusNovo?: StatusServico;
  dataHora: string;
  responsavel: string;
}
