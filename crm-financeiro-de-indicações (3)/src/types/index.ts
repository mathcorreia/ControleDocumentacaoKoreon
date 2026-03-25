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
