import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './KoreonTheme.css'; // O CSS que te enviei na mensagem anterior

// --- IMPORTAÇÕES DO MÓDULO CRM ---
import CrmDashboard from './views/crm/DashboardView';
import CrmClients from './views/crm/ClientsView';
import CrmFinance from './views/crm/FinanceView';
import CrmCommissions from './views/crm/CommissionManager';
import CrmAffiliates from './views/crm/AffiliatesView';
import CrmContracts from './views/crm/ContractsView';
import CrmContractAutomation from './views/crm/ContractAutomationView';

// --- IMPORTAÇÕES DO MÓDULO ERP ---
import ErpDashboard from './views/erp/DashboardView';
import ErpOperationsCenter from './views/erp/ServiceOperationsCenter';
import ErpServices from './views/erp/ServicosView';
import ErpFinanceCFO from './views/erp/FinanceiroCFO';
import ErpWorkManagement from './views/erp/WorkManagementView';
import ErpSuppliers from './views/erp/FornecedoresView';
import ErpLists from './views/erp/ListasView';

function AppContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  // Função simples para saber qual módulo está ativo e mudar a cor do menu
  const isCrmActive = location.pathname.startsWith('/crm');
  const isErpActive = location.pathname.startsWith('/erp');

  return (
    <div className="dashboard-container">
      {/* HEADER KOREON */}
      <header className="dashboard-header">
        <div className="header-brand">
          <Link to="/" className="logo-area" title="Koreon System">
            <img src="/letra.png" alt="Koreon Logo" style={{ width: 45, height: 45, objectFit: 'contain' }} />
            <h1>KOREON <span className="thin">BUSINESS</span></h1>
            <div className="system-status-light"></div>
          </Link>
          <div className="divider"></div>
          <div className="system-info">
            <span className="status-text">Online</span>
            <span className="meta-text">{isCrmActive ? 'Módulo CRM' : isErpActive ? 'Módulo ERP' : 'Hub Central'}</span>
          </div>
        </div>

        <div className="header-actions">
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Buscar global..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary">+ Novo Registo</button>
        </div>
      </header>

      <div className="layout-body">
        {/* SIDEBAR DE NAVEGAÇÃO UNIFICADA */}
        <aside className="koreon-sidebar">
          
          <div className="sidebar-section">
            <h3 style={{ color: '#0071e3' }}>Gestão & CRM</h3>
            <Link to="/crm/dashboard" className="sidebar-link">Dashboard Gestão</Link>
            <Link to="/crm/clientes" className="sidebar-link">Clientes e Leads</Link>
            <Link to="/crm/afiliados" className="sidebar-link">Rede de Afiliados</Link>
            <Link to="/crm/comissoes" className="sidebar-link">Gestor de Comissões</Link>
            <Link to="/crm/contratos" className="sidebar-link">Contratos</Link>
            <Link to="/crm/automacao" className="sidebar-link">Automação (Contratos)</Link>
            <Link to="/crm/financeiro" className="sidebar-link">Financeiro Básico</Link>
          </div>
          
          <div className="sidebar-section">
            <h3 style={{ color: '#32d74b' }}>Operações & ERP</h3>
            <Link to="/erp/dashboard" className="sidebar-link">Dashboard Operacional</Link>
            <Link to="/erp/operacoes" className="sidebar-link">Centro de Operações</Link>
            <Link to="/erp/servicos" className="sidebar-link">Gestão de Serviços</Link>
            <Link to="/erp/os" className="sidebar-link">Gestão de O.S.</Link>
            <Link to="/erp/fornecedores" className="sidebar-link">Fornecedores</Link>
            <Link to="/erp/listas" className="sidebar-link">Listas e Tabelas</Link>
            <Link to="/erp/financeiro-cfo" className="sidebar-link">Financeiro Avançado (CFO)</Link>
          </div>

        </aside>

        {/* ÁREA DE RENDERIZAÇÃO DAS TELAS */}
        <main className="main-content">
          <Routes>
            {/* Rota Padrão */}
            <Route path="/" element={
              <div style={{ textAlign: 'center', marginTop: '10%' }}>
                <h2>Bem-vindo ao Koreon Business</h2>
                <p style={{ color: 'var(--text-sec)' }}>Selecione um módulo no menu lateral para começar.</p>
              </div>
            } />

            {/* ROTAS DO CRM */}
            <Route path="/crm/dashboard" element={<CrmDashboard />} />
            <Route path="/crm/clientes" element={<CrmClients />} />
            <Route path="/crm/afiliados" element={<CrmAffiliates />} />
            <Route path="/crm/comissoes" element={<CrmCommissions />} />
            <Route path="/crm/contratos" element={<CrmContracts />} />
            <Route path="/crm/automacao" element={<CrmContractAutomation />} />
            <Route path="/crm/financeiro" element={<CrmFinance />} />

            {/* ROTAS DO ERP */}
            <Route path="/erp/dashboard" element={<ErpDashboard />} />
            <Route path="/erp/operacoes" element={<ErpOperationsCenter />} />
            <Route path="/erp/servicos" element={<ErpServices />} />
            <Route path="/erp/os" element={<ErpWorkManagement />} />
            <Route path="/erp/fornecedores" element={<ErpSuppliers />} />
            <Route path="/erp/listas" element={<ErpLists />} />
            <Route path="/erp/financeiro-cfo" element={<ErpFinanceCFO />} />
          </Routes>
        </main>
      </div>

      <footer className="vms-footer">
        <div className="footer-left">
          <span className="version">v4.0 Enterprise Unificada</span>
          <span className="copyright">© 2026 Koreon Tech</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}