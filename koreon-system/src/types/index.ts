// ==========================================
// TIPOS DO CRM 
// ==========================================

export interface DashboardStats {
  totalClients: number;
  closedContracts: number;
  totalRevenue: number;
  pendingCommissions: number;
  totalExpenses: number;
  receivedAmount: number;
  overdueInstallments: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  status: string;
  totalContracted: number;
  paid: number;
  pending: number;
  createdAt: string;
  services?: ClientService[];
  referralReceived?: Referral;
}

export interface Affiliate {
  id: string;
  name: string;
  phone: string;
  cpf: string;
  referralsCount: number;
  commissionsTotal: number;
  commissionsPaid: number;
  commissionsPending: number;
  defaultCommissionValue: number;
  defaultCommissionInstallments: number;
  commissionType: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  service: string;
  price: number;
}

export interface NameList {
  id: string;
  name: string;
  count: number;
  pricePaid: number;
  marketingCost: number;
  costPerName: number;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  avgDuration: number;
  status: string;
}

export interface ClientService {
  id: string;
  clientId: string;
  serviceId: string;
  service: Service;
  status: string;
  startDate: string;
  endDate?: string;
}

export interface Contract {
  id: string;
  clientId: string;
  client: Client;
  totalValue: number;
  entryValue: number;
  paymentMethod: string;
  installmentsCount: number;
  status: string;
  contractDate?: string;
  contractUrl?: string;
  createdAt: string;
  installments?: Installment[];
}

export interface Installment {
  id: string;
  contractId: string;
  number: number;
  value: number;
  dueDate: string;
  status: string;
  paymentDate?: string;
  proofUrl?: string;
  delayDays?: number;
}

export interface Referral {
  id: string;
  referrerId?: string;
  referrer?: Client;
  affiliateId?: string;
  affiliate?: Affiliate;
  referredClientId: string;
  referredClient: Client;
  contractValue: number;
  commission: number;
  commissionValue: number;
  commissionInstallments: number;
  commissionType: string;
  status: string;
  createdAt: string;
}

// ==========================================
// TIPOS DO ERP
// ==========================================

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
  url?: string;
}

export interface ServicoContratado {
  id: string;
  clienteId: string;
  tipo: TipoServicoStrict; 
  valorContratado: number;
  formaPagamento: 'À Vista' | 'Parcelado' | string;
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
  statusGeral: 'Em andamento' | '100% Baixado' | 'Reprotocolo' | string;
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
  id?: string;
  clienteId: string;
  servicoId: string;
  listaId: string;
  situacao: 'Aguardando' | 'Em andamento' | 'Finalizado' | 'Baixado' | 'Reprotocolo' | string;
  nadaConstaAnexado?: boolean;
  observacoesIndividuais: string;
}

export interface HistoricoAcompanhamento {
  id: string;
  clienteId: string;
  servicoId: string;
  tipoServico: TipoServicoStrict;
  tipoAcao: 'Status' | 'WhatsApp' | string;
  conteudo: string;
  statusNovo?: StatusServico;
  dataHora: string;
  responsavel: string;
}