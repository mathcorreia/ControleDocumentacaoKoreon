import express from "express";
import { createServer as createViteServer } from "vite";
import { prisma } from "./src/lib/prisma";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { SystemManager } from "./src/utils/systemManager";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Initialize System
  SystemManager.checkUpdates().catch(console.error);

  const PORT = 3000;

  // --- ADMIN & SYSTEM ROUTES ---
  app.get("/api/system/status", async (req, res) => {
    const [updates, logs] = await Promise.all([
      prisma.systemUpdate.findMany({ orderBy: { appliedAt: 'desc' } }),
      prisma.systemLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    ]);
    res.json({ version: updates[0]?.version || "0.0.0", updates, logs });
  });

  app.post("/api/system/backup", async (req, res) => {
    try {
      const backupPath = await SystemManager.createBackup();
      res.json({ success: true, path: backupPath });
    } catch (error) {
      res.status(500).json({ error: "Backup failed" });
    }
  });

  // --- API Routes ---

  // Dashboard Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const totalClients = await prisma.client.count();
      const closedContracts = await prisma.contract.count({ where: { status: "ativo" } });
      
      const contracts = await prisma.contract.findMany();
      const totalRevenue = contracts.reduce((acc, curr) => acc + curr.totalValue, 0);
      
      const pendingCommissions = await prisma.referral.aggregate({
        where: { status: "pendente" },
        _sum: { commission: true }
      });

      const expenses = await prisma.expense.aggregate({
        _sum: { value: true }
      });

      const paidInstallments = await prisma.installment.aggregate({
        where: { status: "pago" },
        _sum: { value: true }
      });

      const overdueInstallments = await prisma.installment.count({
        where: { 
          status: "pendente",
          dueDate: { lt: new Date() }
        }
      });

      res.json({
        totalClients,
        closedContracts,
        totalRevenue,
        pendingCommissions: pendingCommissions._sum.commission || 0,
        totalExpenses: expenses._sum.value || 0,
        receivedAmount: paidInstallments._sum.value || 0,
        overdueInstallments,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Affiliates
  app.get("/api/affiliates", async (req, res) => {
    const affiliates = await prisma.affiliate.findMany({
      include: { clients: true }
    });
    res.json(affiliates);
  });

  app.post("/api/affiliates", async (req, res) => {
    const affiliate = await prisma.affiliate.create({ data: req.body });
    res.json(affiliate);
  });

  app.patch("/api/affiliates/:id", async (req, res) => {
    const { defaultCommissionValue, defaultCommissionInstallments, commissionType, name, phone, cpf } = req.body;
    const affiliate = await prisma.affiliate.update({
      where: { id: req.params.id },
      data: {
        name,
        phone,
        cpf,
        defaultCommissionValue: defaultCommissionValue !== undefined ? Number(defaultCommissionValue) : undefined,
        defaultCommissionInstallments: defaultCommissionInstallments !== undefined ? Number(defaultCommissionInstallments) : undefined,
        commissionType
      }
    });
    res.json(affiliate);
  });

  // Suppliers
  app.get("/api/suppliers", async (req, res) => {
    const suppliers = await prisma.supplier.findMany();
    res.json(suppliers);
  });

  app.post("/api/suppliers", async (req, res) => {
    const supplier = await prisma.supplier.create({ data: req.body });
    res.json(supplier);
  });

  // Name Lists
  app.get("/api/name-lists", async (req, res) => {
    const lists = await prisma.nameList.findMany();
    res.json(lists);
  });

  app.post("/api/name-lists", async (req, res) => {
    const { name, count, pricePaid, marketingCost } = req.body;
    const costPerName = (Number(pricePaid) + Number(marketingCost)) / Number(count);
    const list = await prisma.nameList.create({
      data: { name, count, pricePaid, marketingCost, costPerName }
    });
    res.json(list);
  });

  // Expenses
  app.get("/api/expenses", async (req, res) => {
    const expenses = await prisma.expense.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    const { description, value, category, date, dueDate, isRecurring, status } = req.body;
    const expense = await prisma.expense.create({
      data: {
        description,
        value: Number(value),
        category,
        date: date ? new Date(date) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : (date ? new Date(date) : new Date()),
        isRecurring: Boolean(isRecurring),
        status: status || "pendente"
      }
    });

    if (status === "pago") {
      await prisma.financialMovement.create({
        data: {
          type: "exit",
          description: `Despesa: ${description}`,
          value: Number(value),
          category: category.toLowerCase(),
          referenceId: expense.id,
          date: date ? new Date(date) : new Date()
        }
      });
    }

    res.json(expense);
  });

  app.patch("/api/expenses/:id/pay", async (req, res) => {
    const { id } = req.params;
    const { paymentDate } = req.body;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) return res.status(404).json({ error: "Despesa não encontrada" });

    const updated = await prisma.expense.update({
      where: { id },
      data: { status: "pago", date: paymentDate ? new Date(paymentDate) : new Date() }
    });

    await prisma.financialMovement.create({
      data: {
        type: "exit",
        description: `Despesa: ${updated.description}`,
        value: updated.value,
        category: updated.category.toLowerCase(),
        referenceId: updated.id,
        date: paymentDate ? new Date(paymentDate) : new Date()
      }
    });

    res.json(updated);
  });

  // Services
  app.get("/api/services", async (req, res) => {
    const services = await prisma.service.findMany();
    res.json(services);
  });

  app.post("/api/services", async (req, res) => {
    const service = await prisma.service.create({ data: req.body });
    res.json(service);
  });

  // Client Services
  app.get("/api/clients/:id/services", async (req, res) => {
    const services = await prisma.clientService.findMany({
      where: { clientId: req.params.id },
      include: { service: true }
    });
    res.json(services);
  });

  // Installments list with filters
  app.get("/api/installments", async (req, res) => {
    const { status, clientId } = req.query;
    
    const now = new Date();
    let where: any = {};
    
    if (clientId) where.contract = { clientId: String(clientId) };
    
    if (status === 'vencido') {
      where.status = 'pendente';
      where.dueDate = { lt: now };
    } else if (status) {
      where.status = String(status);
    }

    const installments = await prisma.installment.findMany({
      where,
      include: { 
        contract: { 
          include: { client: true } 
        } 
      },
      orderBy: { dueDate: 'asc' }
    });
    res.json(installments);
  });

  // Installment Payment with Proof
  app.post("/api/installments/:id/pay", async (req, res) => {
    const { proofUrl, paymentDate } = req.body;
    const installment = await prisma.installment.findUnique({ where: { id: req.params.id } });
    if (!installment) return res.status(404).json({ error: "Installment not found" });

    const payDate = new Date(paymentDate);
    const dueDate = new Date(installment.dueDate);
    let delayDays = 0;
    if (payDate > dueDate) {
      delayDays = Math.floor((payDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    const updated = await prisma.installment.update({
      where: { id: req.params.id },
      data: {
        status: "pago",
        paymentDate: payDate,
        proofUrl,
        delayDays
      }
    });

    // Update client paid amount
    const contract = await prisma.contract.findUnique({ 
      where: { id: installment.contractId },
      include: { client: true }
    });
    
    if (contract) {
      await prisma.client.update({
        where: { id: contract.clientId },
        data: {
          paid: { increment: installment.value },
          pending: { decrement: installment.value }
        }
      });

      // Record financial movement
      await prisma.financialMovement.create({
        data: {
          type: "entry",
          description: `Parcela ${installment.number} - ${contract.client.name}`,
          value: installment.value,
          category: "cliente",
          referenceId: installment.id,
          date: paymentDate ? new Date(paymentDate) : new Date()
        }
      });

      // Handle Affiliate Commission if it's "installment" type
      const referral = await prisma.referral.findUnique({
        where: { referredClientId: contract.clientId }
      });

      if (referral && referral.affiliateId && referral.commissionType === "installment") {
        // Calculate how many installments have been paid for this contract
        const paidInstallmentsCount = await prisma.installment.count({
          where: { 
            contractId: contract.id,
            status: "pago"
          }
        });

        // Only pay if we haven't reached the commission installments limit
        if (paidInstallmentsCount <= referral.commissionInstallments) {
          const installmentCommission = referral.commissionValue / referral.commissionInstallments;
          
          await prisma.affiliate.update({
            where: { id: referral.affiliateId },
            data: {
              commissionsPending: { increment: installmentCommission },
              commissionsTotal: { increment: installmentCommission }
            }
          });

          // Update the referral's total commission tracked
          await prisma.referral.update({
            where: { id: referral.id },
            data: {
              commission: { increment: installmentCommission }
            }
          });
        }
      }
    }

    res.json(updated);
  });

  // Automated Billing Logic (Mock WhatsApp)
  app.post("/api/billing/process", async (req, res) => {
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const installments = await prisma.installment.findMany({
      where: {
        status: "pendente",
        OR: [
          { dueDate: { lte: threeDaysFromNow, gte: now } }, // 3 days reminder
          { dueDate: { lt: now } } // Overdue
        ]
      },
      include: { contract: { include: { client: true } } }
    });

    const results = [];
    for (const inst of installments) {
      const client = inst.contract.client;
      let message = "";
      const dueDate = new Date(inst.dueDate);
      
      if (dueDate > now) {
        message = `Olá ${client.name}, sua parcela de R$${inst.value} vence em 3 dias (${dueDate.toLocaleDateString()}). Qualquer dúvida estamos à disposição.`;
      } else {
        const delay = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        message = `Sua parcela de R$${inst.value} está vencida há ${delay} dias. Entre em contato para regularização.`;
      }

      // Mocking WhatsApp API call
      console.log(`[WHATSAPP] Sending to ${client.phone}: ${message}`);
      
      await prisma.installment.update({
        where: { id: inst.id },
        data: { billingSentAt: now }
      });
      
      results.push({ clientId: client.id, message });
    }

    res.json({ processed: results.length, details: results });
  });

  // Clients
  app.get("/api/clients", async (req, res) => {
    const { search } = req.query;
    const clients = await prisma.client.findMany({
      where: search ? {
        OR: [
          { name: { contains: String(search) } },
          { cpf: { contains: String(search) } },
          { phone: { contains: String(search) } },
        ]
      } : undefined,
      include: { contracts: true, referralReceived: true }
    });
    res.json(clients);
  });

  app.post("/api/clients", async (req, res) => {
    const client = await prisma.client.create({ data: req.body });
    await SystemManager.log("audit", `Cliente criado: ${client.name}`, "Admin", { clientId: client.id });
    res.json(client);
  });

  app.delete("/api/clients/:id", async (req, res) => {
    const { id } = req.params;
    console.log(`>>> [SERVER] DELETE request for client ID: ${id}`);
    
    try {
      const client = await prisma.client.findUnique({ where: { id } });
      if (!client) {
        console.log(`>>> [SERVER] Client ${id} not found in database`);
        return res.status(404).json({ error: "Cliente não encontrado" });
      }

      console.log(`>>> [SERVER] Starting transaction to delete client: ${client.name}`);
      await prisma.$transaction(async (tx) => {
        // 1. Delete Installments
        const installmentsDeleted = await tx.installment.deleteMany({
          where: { contract: { clientId: id } }
        });
        console.log(`[DELETE] Deleted ${installmentsDeleted.count} installments`);

        // 2. Delete Contracts
        const contractsDeleted = await tx.contract.deleteMany({
          where: { clientId: id }
        });
        console.log(`[DELETE] Deleted ${contractsDeleted.count} contracts`);

        // 3. Delete ClientServices
        const servicesDeleted = await tx.clientService.deleteMany({
          where: { clientId: id }
        });
        console.log(`[DELETE] Deleted ${servicesDeleted.count} services`);

        // 4. Delete Referrals (as referrer or referred)
        const referralsDeleted = await tx.referral.deleteMany({
          where: {
            OR: [
              { referrerId: id },
              { referredClientId: id }
            ]
          }
        });
        console.log(`[DELETE] Deleted ${referralsDeleted.count} referrals`);

        // 5. Finally delete the client
        await tx.client.delete({ where: { id } });
        console.log(`[DELETE] Client ${id} deleted successfully`);
        
        await SystemManager.log("audit", `Cliente excluído: ${client.name}`, "Admin", { clientId: id });
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[DELETE] Fatal error:", error);
      res.status(500).json({ 
        error: "Erro interno ao excluir cliente", 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Contracts
  app.get("/api/contracts", async (req, res) => {
    const contracts = await prisma.contract.findMany({
      include: { 
        client: {
          include: {
            referralReceived: {
              include: {
                referrer: true,
                affiliate: true
              }
            }
          }
        }, 
        installments: true 
      }
    });
    res.json(contracts);
  });

  // Financial Stats & Movements
  app.get("/api/financial/stats", async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      contracts,
      paidInstallments,
      pendingInstallments,
      expenses,
      referrals,
      movements
    ] = await Promise.all([
      prisma.contract.findMany(),
      prisma.installment.findMany({ where: { status: "pago" } }),
      prisma.installment.findMany({ where: { status: "pendente" } }),
      prisma.expense.findMany(),
      prisma.referral.findMany(),
      prisma.financialMovement.findMany({ orderBy: { date: 'desc' } })
    ]);

    const grossRevenue = contracts.reduce((acc, c) => acc + (c.totalValue || 0), 0);
    const totalReceived = paidInstallments.reduce((acc, i) => acc + (i.value || 0), 0);
    const totalPending = pendingInstallments.reduce((acc, i) => acc + (i.value || 0), 0);
    
    // Expenses stats
    const totalExpenses = expenses.filter(e => e.status === 'pago').reduce((acc, e) => acc + (e.value || 0), 0);
    const expensesPending = expenses.filter(e => e.status === 'pendente').reduce((acc, e) => acc + (e.value || 0), 0);
    
    const totalCommissions = referrals.reduce((acc, r) => acc + (r.commissionValue || 0), 0);
    
    // Commissions actually paid out (status 'pago')
    const commissionsPaid = referrals
      .filter(r => r.status === 'pago')
      .reduce((acc, r) => acc + (r.commission || 0), 0);
    
    const commissionsPending = referrals
      .filter(r => r.status === 'pendente')
      .reduce((acc, r) => acc + (r.commission || 0), 0);

    const monthReceived = paidInstallments
      .filter(i => i.paymentDate && new Date(i.paymentDate) >= startOfMonth)
      .reduce((acc, i) => acc + (i.value || 0), 0);
    
    const monthExpenses = expenses
      .filter(e => e.status === 'pago' && new Date(e.date) >= startOfMonth)
      .reduce((acc, e) => acc + (e.value || 0), 0);

    const dayReceived = paidInstallments
      .filter(i => i.paymentDate && new Date(i.paymentDate) >= startOfDay)
      .reduce((acc, i) => acc + (i.value || 0), 0);
    
    const dayExpenses = expenses
      .filter(e => e.status === 'pago' && new Date(e.date) >= startOfDay)
      .reduce((acc, e) => acc + (e.value || 0), 0);

    // Chart Data: Monthly Revenue (Last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('pt-BR', { month: 'short' });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const revenue = paidInstallments
        .filter(inst => inst.paymentDate && new Date(inst.paymentDate) >= monthStart && new Date(inst.paymentDate) <= monthEnd)
        .reduce((acc, inst) => acc + inst.value, 0);
      
      monthlyRevenue.push({ name: monthName, value: revenue });
    }

    // Chart Data: Cash Flow (Last 7 days)
    const cashFlow = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayName = d.toLocaleString('pt-BR', { weekday: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

      const entrada = paidInstallments
        .filter(inst => inst.paymentDate && new Date(inst.paymentDate) >= dayStart && new Date(inst.paymentDate) <= dayEnd)
        .reduce((acc, inst) => acc + inst.value, 0);
      
      const saida = expenses
        .filter(e => new Date(e.date) >= dayStart && new Date(e.date) <= dayEnd)
        .reduce((acc, e) => acc + e.value, 0);
      
      cashFlow.push({ name: dayName, entrada, saida });
    }

    // Chart Data: Expenses by Category
    const categories = ['Marketing', 'Sistemas', 'Fornecedores', 'Fixo', 'Variável', 'Outros'];
    const categoryData = categories.map(cat => ({
      name: cat,
      value: expenses.filter(e => e.category === cat).reduce((acc, e) => acc + e.value, 0)
    })).filter(c => c.value > 0);

    res.json({
      grossRevenue,
      netRevenue: grossRevenue - totalCommissions - totalExpenses,
      totalReceived,
      totalPending,
      monthReceived,
      monthExpenses,
      monthProfit: monthReceived - monthExpenses,
      dayProfit: dayReceived - dayExpenses,
      commissionsPending,
      expensesPending,
      currentBalance: totalReceived - totalExpenses - commissionsPaid,
      charts: {
        monthlyRevenue,
        cashFlow,
        categoryData
      }
    });
  });

  app.get("/api/financial/calendar", async (req, res) => {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const targetMonth = month !== undefined ? Number(month) : now.getMonth();
      const targetYear = year !== undefined ? Number(year) : now.getFullYear();

      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

      // 1. Handle Recurring Expenses for this month
      const recurringExpenses = await prisma.expense.findMany({
        where: { isRecurring: true }
      });

      for (const re of recurringExpenses) {
        const exists = await prisma.expense.findFirst({
          where: {
            description: re.description,
            isRecurring: false,
            dueDate: {
              gte: startOfMonth,
              lte: endOfMonth
            }
          }
        });

        if (!exists) {
          const originalDueDate = new Date(re.dueDate);
          const day = isNaN(originalDueDate.getTime()) ? 1 : originalDueDate.getDate();
          
          await prisma.expense.create({
            data: {
              description: re.description,
              value: re.value,
              category: re.category,
              dueDate: new Date(targetYear, targetMonth, day),
              status: "pendente",
              isRecurring: false 
            }
          });
        }
      }

      const [installments, expenses, referrals] = await Promise.all([
        prisma.installment.findMany({
          where: {
            OR: [
              { dueDate: { gte: startOfMonth, lte: endOfMonth } },
              { status: "pendente", dueDate: { lt: startOfMonth } }
            ]
          },
          include: { contract: { include: { client: true } } }
        }),
        prisma.expense.findMany({
          where: {
            OR: [
              { dueDate: { gte: startOfMonth, lte: endOfMonth } },
              { status: "pendente", dueDate: { lt: startOfMonth } }
            ],
            isRecurring: false
          }
        }),
        prisma.referral.findMany({
          where: {
            OR: [
              { createdAt: { gte: startOfMonth, lte: endOfMonth } },
              { status: "pendente", createdAt: { lt: startOfMonth } }
            ]
          },
          include: { referredClient: true, affiliate: true, referrer: true }
        })
      ]);

      res.json({
        receivables: installments,
        payables: [
          ...expenses.map(e => ({ ...e, type: 'expense' })),
          ...referrals.map(r => ({ 
            id: r.id, 
            description: `Comissão: ${r.referredClient?.name || 'Indicação'}`,
            value: r.commission,
            dueDate: r.createdAt,
            status: r.status,
            type: 'commission',
            category: 'Comissão'
          }))
        ]
      });
    } catch (error) {
      console.error("Error in /api/financial/calendar:", error);
      res.status(500).json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/financial/movements", async (req, res) => {
    const movements = await prisma.financialMovement.findMany({
      orderBy: { date: 'desc' }
    });
    res.json(movements);
  });

  app.get("/api/financial/commissions", async (req, res) => {
    const commissions = await prisma.referral.findMany({
      include: {
        affiliate: true,
        referrer: true,
        referredClient: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(commissions);
  });

  app.post("/api/financial/commissions/:id/pay", async (req, res) => {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const referral = await prisma.referral.findUnique({
      where: { id },
      include: { affiliate: true }
    });

    if (!referral) return res.status(404).json({ error: "Comissão não encontrada" });

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.referral.update({
        where: { id },
        data: {
          status: "pago",
          paidAt: new Date(),
          paymentMethod
        }
      });

      if (referral.affiliateId) {
        await tx.affiliate.update({
          where: { id: referral.affiliateId },
          data: {
            commissionsPaid: { increment: referral.commission },
            commissionsPending: { decrement: referral.commission }
          }
        });
      }

      await tx.financialMovement.create({
        data: {
          type: "exit",
          description: `Pagamento de comissão - ${referral.affiliate?.name || 'Referenciador'}`,
          value: referral.commission,
          category: "comissao",
          referenceId: referral.id
        }
      });

      return r;
    });

    res.json(updated);
  });

  // Referrals
  app.get("/api/referrals", async (req, res) => {
    const referrals = await prisma.referral.findMany({
      include: { referrer: true, referredClient: true }
    });
    res.json(referrals);
  });

  // Automated Flow: Create Client -> Contract -> Installments
  app.post("/api/contracts/automated", async (req, res) => {
    const { extractedData, referrerId, contractUrl } = req.body;
    
    // Ensure numbers are actually numbers and handle potential nulls from AI
    const valor_contrato = Number(extractedData.valor_contrato) || 0;
    const entrada = Number(extractedData.entrada) || 0;
    const parcelas = Number(extractedData.parcelas) || 0;
    const valor_parcela = Number(extractedData.valor_parcela) || 0;
    const nome = String(extractedData.nome || "Cliente Sem Nome");
    const cpf = String(extractedData.cpf || `TEMP-${Date.now()}`);
    const telefone = String(extractedData.telefone || "");
    const data_contrato = extractedData.data_contrato ? new Date(extractedData.data_contrato) : null;
    const datas_pagamento = Array.isArray(extractedData.datas_pagamento) ? extractedData.datas_pagamento : [];
    const tipo_servico = String(extractedData.tipo_servico || "");
    const data_conclusao = extractedData.data_conclusao ? new Date(extractedData.data_conclusao) : null;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create or Update Client
        const client = await tx.client.upsert({
          where: { cpf },
          update: {
            name: nome,
            phone: telefone,
            status: "fechado",
            totalContracted: { increment: valor_contrato },
            pending: { increment: valor_contrato - entrada },
            paid: { increment: entrada }
          },
          create: {
            name: nome,
            cpf,
            phone: telefone,
            status: "fechado",
            totalContracted: valor_contrato,
            paid: entrada,
            pending: valor_contrato - entrada
          }
        });

        // 2. Create Contract
        const contract = await tx.contract.create({
          data: {
            clientId: client.id,
            totalValue: valor_contrato,
            entryValue: entrada,
            paymentMethod: "Parcelado",
            installmentsCount: parcelas,
            status: "ativo",
            contractDate: data_contrato && !isNaN(data_contrato.getTime()) ? data_contrato : null,
            contractUrl: contractUrl || null
          }
        });

        // 3. Create ClientService if service type is provided
        if (tipo_servico) {
          // Find or create the service in the catalog
          let service = await tx.service.findFirst({
            where: { name: tipo_servico }
          });

          if (!service) {
            service = await tx.service.create({
              data: {
                name: tipo_servico,
                price: valor_contrato,
                avgDuration: 30 // Default duration
              }
            });
          }

          await tx.clientService.create({
            data: {
              clientId: client.id,
              serviceId: service.id,
              status: "em_andamento",
              startDate: data_contrato || new Date(),
              endDate: data_conclusao
            }
          });
        }

        // 4. Create Installments
        if (parcelas > 0) {
          const installmentPromises = [];
          for (let i = 0; i < parcelas; i++) {
            const dueDate = datas_pagamento[i] ? new Date(datas_pagamento[i]) : new Date();
            if (!datas_pagamento[i]) {
              dueDate.setMonth(dueDate.getMonth() + i + 1);
            }
            
            installmentPromises.push(tx.installment.create({
              data: {
                contractId: contract.id,
                number: i + 1,
                value: valor_parcela,
                dueDate: isNaN(dueDate.getTime()) ? new Date() : dueDate,
                status: "pendente"
              }
            }));
          }
          await Promise.all(installmentPromises);
        }

        // 4. Handle Referral if exists
        if (referrerId && referrerId.trim() !== "") {
          // Check if it's an affiliate or client
          const affiliate = await tx.affiliate.findUnique({ where: { id: referrerId } });
          const referrerClient = !affiliate ? await tx.client.findUnique({ where: { id: referrerId } }) : null;

          if (affiliate || referrerClient) {
            // Check if referral already exists for this client to avoid unique constraint error
            const existingReferral = await tx.referral.findUnique({
              where: { referredClientId: client.id }
            });

            if (!existingReferral) {
              const value = affiliate ? affiliate.defaultCommissionValue : 0;
              const installments = affiliate ? affiliate.defaultCommissionInstallments : 1;
              const type = affiliate ? affiliate.commissionType : "upfront";
              
              // If upfront, calculate full commission now. If installment, start at 0 (or entry commission)
              let initialCommission = 0;
              if (type === "upfront") {
                initialCommission = value;
              } else {
                // For installment, earn commission on entry value immediately (counts as 1st installment)
                if (entrada > 0) {
                  initialCommission = value / installments;
                }
              }

              await tx.referral.create({
                data: {
                  referrerId: referrerClient ? referrerClient.id : null,
                  affiliateId: affiliate ? affiliate.id : null,
                  referredClientId: client.id,
                  contractValue: valor_contrato,
                  commission: initialCommission,
                  commissionValue: value,
                  commissionInstallments: installments,
                  commissionType: type,
                  status: "pendente"
                }
              });

              // If affiliate, update their stats
              if (affiliate) {
                await tx.affiliate.update({
                  where: { id: affiliate.id },
                  data: {
                    referralsCount: { increment: 1 },
                    commissionsPending: { increment: initialCommission },
                    commissionsTotal: { increment: initialCommission }
                  }
                });
              }
            }
          }
        }

        return { client, contract };
      });

      res.json(result);
    } catch (error) {
      console.error("Automated flow error:", error);
      res.status(500).json({ error: "Automated flow failed", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Active Services
  app.get("/api/services/active", async (req, res) => {
    try {
      const activeServices = await prisma.clientService.findMany({
        where: { status: "em_andamento" },
        include: { client: true, service: true }
      });
      res.json(activeServices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active services" });
    }
  });

  // Weekly Lists
  app.get("/api/weekly-lists", async (req, res) => {
    try {
      // Logic: Lists are every Sunday and Wednesday.
      // Names arriving before Sunday go to Sunday's list.
      // Names arriving between Sunday and Wednesday go to Wednesday's list.
      
      const activeLimpaNome = await prisma.clientService.findMany({
        where: {
          service: { name: 'Limpa Nome' },
          status: 'em_andamento'
        },
        include: { client: true }
      });

      const now = new Date();
      const lists = [];

      // Helper to get next occurrence of a day (0=Sunday, 3=Wednesday)
      const getNextDay = (dayIndex: number, fromDate: Date) => {
        const result = new Date(fromDate);
        result.setDate(fromDate.getDate() + (dayIndex + 7 - fromDate.getDay()) % 7);
        result.setHours(0, 0, 0, 0);
        return result;
      };

      const nextSunday = getNextDay(0, now);
      const nextWednesday = getNextDay(3, now);

      // Group clients
      const sundayClients = activeLimpaNome.filter(cs => {
        const created = new Date(cs.startDate);
        return created < nextSunday;
      });

      const wednesdayClients = activeLimpaNome.filter(cs => {
        const created = new Date(cs.startDate);
        return created >= nextSunday && created < nextWednesday;
      });

      lists.push({
        id: 'list-sun-' + nextSunday.getTime(),
        type: 'Limpa Nome',
        scheduledDate: nextSunday.toISOString().split('T')[0],
        clientsCount: sundayClients.length,
        status: sundayClients.length > 0 ? 'upcoming' : 'pending',
        clients: sundayClients.map(cs => cs.client.name)
      });

      lists.push({
        id: 'list-wed-' + nextWednesday.getTime(),
        type: 'Limpa Nome',
        scheduledDate: nextWednesday.toISOString().split('T')[0],
        clientsCount: wednesdayClients.length,
        status: wednesdayClients.length > 0 ? 'upcoming' : 'pending',
        clients: wednesdayClients.map(cs => cs.client.name)
      });

      // Add some past lists for context
      const lastSunday = new Date(nextSunday);
      lastSunday.setDate(lastSunday.getDate() - 7);
      lists.push({
        id: 'list-past-sun',
        type: 'Limpa Nome',
        scheduledDate: lastSunday.toISOString().split('T')[0],
        clientsCount: 5,
        status: 'completed'
      });

      res.json(lists);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch weekly lists" });
    }
  });

  // Monitoring Stats
  app.get("/api/monitoring/stats", async (req, res) => {
    try {
      const [overdueInstallments, pendingServices, completedToday] = await Promise.all([
        prisma.installment.findMany({
          where: { status: "pendente", dueDate: { lt: new Date() } },
          include: { contract: { include: { client: true } } }
        }),
        prisma.clientService.findMany({
          where: { status: "em_andamento" },
          include: { client: true, service: true }
        }),
        prisma.clientService.count({
          where: { status: "concluido", endDate: { gte: new Date(new Date().setHours(0,0,0,0)) } }
        })
      ]);

      const items = [
        ...overdueInstallments.map(inst => ({
          id: `inst-${inst.id}`,
          type: 'billing',
          title: `Parcela Vencida - ${inst.contract.client.name}`,
          subtitle: `Contrato #${inst.contract.id.slice(0, 8)}`,
          status: 'alert',
          value: inst.value,
          date: inst.dueDate.toISOString(),
          priority: 'high'
        })),
        ...pendingServices.map(cs => ({
          id: `service-${cs.id}`,
          type: 'service',
          title: `Serviço em Andamento - ${cs.client.name}`,
          subtitle: cs.service.name,
          status: cs.endDate && new Date(cs.endDate) < new Date() ? 'warning' : 'pending',
          date: cs.startDate.toISOString(),
          priority: cs.endDate && new Date(cs.endDate) < new Date() ? 'high' : 'medium'
        }))
      ];

      res.json({
        items,
        stats: {
          criticalAlerts: overdueInstallments.length,
          pendencies: pendingServices.length,
          completedToday,
          efficiency: 94.2 // Mock efficiency for now
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monitoring stats" });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
