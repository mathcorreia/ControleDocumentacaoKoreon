// ==========================================
// ENUMS (VALORES REAIS - PODEM SER IMPORTADOS NORMALMENTE)
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

// ==========================================
// INTERFACES (TIPAGEM - DEVEM SER IMPORTADAS COM 'type')
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

export interface Cliente {
  id: string;
  nome: string;
  tipo: TipoPessoa;
  documento: string; // CPF/CNPJ
  telefone: string;
  email: string;
  dataCadastro: string;
  riskScore: number;
  riskLevel: NivelRisco;
  prioridade: PrioridadeOperacional;
  // Campos extras para compatibilidade CRM
  totalContracted?: number;
  paid?: number;
  pending?: number;
  status?: string;
  cpf?: string; // Alias para documento
  name?: string; // Alias para nome
}

// ALIASES PARA COMPATIBILIDADE COM TELAS ANTIGAS
export type Client = Cliente;

export interface ServicoContratado {
  id: string;
  clienteId: string;
  tipo: TipoServicoStrict; 
  valorContratado: number;
  formaPagamento: string;
  qtdParcelas: number;
  status: StatusServico;
  progresso: number; 
  responsavel: string;
  prazoAcordado: string;
}

export type ClientService = ServicoContratado;

export interface Pagamento {
  id: string;
  clienteId: string;
  servicoId: string;
  valorParcela: number;
  numParcela: number;
  dataVencimento: string;
  status: StatusPagamento;
}

export interface Affiliate {
  id: string;
  name: string;
  phone: string;
  commissionsTotal: number;
}