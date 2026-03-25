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
  nome?: string; 
  phone: string;
  cpf: string;
  documento?: string; 
  status: string;
  totalContracted: number;
  paid: number;
  pending: number;
  createdAt: string;
  services?: ClientService[];
  referralReceived?: Referral;
  riskScore?: number;
  riskLevel?: NivelRisco;
  prioridade?: PrioridadeOperacional;
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

export enum TipoServicoStrict {
  LIMPA_NOME = 'Limpa Nome',
  SCORE = 'Aumento de Score',
  RATING = 'Restabelecimento de Rating',
  JUSBRASIL = 'Blindagem JusBrasil'
}

export enum StatusOrgao {
  NAO_INICIADO = 'Não Iniciado',
  INICIADO = 'Em Andamento',
  CONCLUIDO = 'Concluído'
}

export enum TipoDocumento {
  FICHA_ASSOCIATIVA = 'Ficha Associativa',
  DOCUMENTO_PESSOAL = 'Documento Pessoal',
  COMPROVANTE_RESIDENCIA = 'Comprovante de Residência',
  CONTRATO = 'Contrato',
  OUTROS = 'Outros'
}

export enum StatusFornecedor {
  ATIVO = 'Ativo',
  INATIVO = 'Inativo',
  BLOQUEADO = 'Bloqueado',
  EM_AVALIACAO = 'Em Avaliação'
}

export enum NivelRisco {
  BAIXO = 'Baixo',
  MEDIO = 'Médio',
  ALTO = 'Alto',
  CRITICO = 'Crítico'
}

export enum PrioridadeOperacional {
  BAIXA = 'Baixa',
  NORMAL = 'Normal',
  ALTA = 'Alta',
  URGENTE = 'Urgente',
  CONGELADO = 'Congelado'
}

export type StatusLista = 'Em andamento' | '100% Baixado' | 'Reprotocolo';
export type StatusServico = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
export type StatusPagamento = 'Pendente' | 'Pago' | 'Atrasado';

export interface ListaProcessual {
  id: string;
  nome: string;
  tipoServico: TipoServicoStrict | string;
  observacoes: string;
  dataInicio: string;
  fornecedor?: string;
  custoAcao?: number;
  statusGeral: string;
  ultimaAtualizacao: string;
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
  listaId: string;
  clienteId: string;
  servicoId: string;
  observacoesIndividuais?: string;
  situacao?: string;
  nadaConstaAnexado?: boolean;
}

export interface Documento {
  id: string;
  clienteId: string;
  servicoId?: string;
  tipo: TipoDocumento | string;
  nomeArquivo: string;
  dataUpload: string;
  url?: string;
  conteudoBase64?: string;
  tipoMime?: string;
  tamanhoArquivo?: number;
}

export interface ServicoContratado {
  id: string;
  clienteId: string;
  tipo: string;
  valorContratado?: number;
  formaPagamento?: string;
  qtdParcelas?: number;
  dataContrato?: string;
  prazoAcordado?: string;
  obsTecnicas?: string;
  responsavel?: string;
  progresso?: number;
  status?: StatusServico | string;
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
  status: StatusPagamento | string;
  comprovanteId?: string;
}

// --- ALIAS DE COMPATIBILIDADE CRM <-> ERP ---
export interface Cliente extends Client {}