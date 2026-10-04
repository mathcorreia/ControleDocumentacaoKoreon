import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './KoreonTheme.css';
import { getDB } from './db';

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
import ErpWorkManagement from './views/erp/WorkManagementView';
import ErpSuppliers from './views/erp/FornecedoresView';
import ErpLists from './views/erp/ListasView';
import ErpFinanceCFO from './views/erp/FinanceiroCFO';

function AppContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const [db, setDb] = useState<any>(null);

  useEffect(() => {
    setDb(getDB());
  }, []);

  const isCrmActive = location.pathname.startsWith('/crm');
  const isErpActive = location.pathname.startsWith('/erp');

  if (!db) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>Carregando Sistema...</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-brand">
          <Link to="/" className="logo-area" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/icons.svg" alt="Koreon Logo" style={{ width: 45, height: 45, objectFit: 'contain' }} />
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
              placeholder="Pesquisa global..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0f0f11] border border-[#333336] text-white px-4 py-2 rounded-xl outline-none"
            />
          </div>
          <button className="btn btn-primary bg-[#0071e3] text-white px-4 py-2 rounded-xl">
            + Novo Registro
          </button>
        </div>
      </header>

      <div className="layout-body" style={{ display: 'flex', gap: '25px', flex: 1 }}>
        <aside className="koreon-sidebar" style={{ width: '250px', background: '#1c1c1e', border: '1px solid #333336', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="sidebar-section">
            <h3 style={{ color: '#0071e3', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '10px' }}>Gestão & CRM</h3>
            <Link to="/crm/dashboard" className="sidebar-link">Dashboard Gestão</Link>
            <Link to="/crm/clientes" className="sidebar-link">Clientes e Leads</Link>
            <Link to="/crm/afiliados" className="sidebar-link">Rede de Afiliados</Link>
            <Link to="/crm/comissoes" className="sidebar-link">Gestor de Comissões</Link>
            <Link to="/crm/contratos" className="sidebar-link">Contratos</Link>
            <Link to="/crm/automacao" className="sidebar-link">Automação (Contratos)</Link>
            <Link to="/crm/financeiro" className="sidebar-link">Financeiro Básico</Link>
          </div>
          
          <div className="sidebar-section">
            <h3 style={{ color: '#32d74b', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '10px' }}>Operações & ERP</h3>
            <Link to="/erp/dashboard" className="sidebar-link">Dashboard Operacional</Link>
            <Link to="/erp/operacoes" className="sidebar-link">Centro de Operações</Link>
            <Link to="/erp/servicos" className="sidebar-link">Gestão de Serviços</Link>
            <Link to="/erp/os" className="sidebar-link">Gestão de O.S.</Link>
            <Link to="/erp/fornecedores" className="sidebar-link">Fornecedores</Link>
            <Link to="/erp/listas" className="sidebar-link">Listas e Lotes</Link>
            <Link to="/erp/financeiro-cfo" className="sidebar-link">Financeiro Avançado (CFO)</Link>
          </div>
        </aside>

        <main className="main-content" style={{ flex: 1, background: '#1c1c1e', border: '1px solid #333336', borderRadius: '16px', padding: '25px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={
              <div style={{ textAlign: 'center', marginTop: '10%' }}>
                <h2 style={{ fontSize: '2rem', color: 'white' }}>Bem-vindo ao Koreon Business</h2>
                <p style={{ color: '#98989d' }}>Selecione um módulo no menu lateral para iniciar.</p>
              </div>
            } />

            {/* CRM ROUTES - CORRIGIDAS: Agora recebem db e setDb */}
            <Route path="/crm/dashboard" element={<CrmDashboard db={db} />} />
            <Route path="/crm/clientes" element={<CrmClients db={db} setDb={setDb} />} />
            <Route path="/crm/afiliados" element={<CrmAffiliates db={db} setDb={setDb} />} />
            <Route path="/crm/comissoes" element={<CrmCommissions db={db} setDb={setDb} />} />
            <Route path="/crm/contratos" element={<CrmContracts db={db} setDb={setDb} />} />
            <Route path="/crm/automacao" element={<CrmContractAutomation db={db} setDb={setDb} />} />
            <Route path="/crm/financeiro" element={<CrmFinance db={db} setDb={setDb} />} />

            {/* ERP ROUTES */}
            <Route path="/erp/dashboard" element={<ErpDashboard db={db} />} />
            <Route path="/erp/operacoes" element={<ErpOperationsCenter db={db} setDb={setDb} />} />
            <Route path="/erp/servicos" element={<ErpServices db={db} setDb={setDb} />} />
            <Route path="/erp/os" element={<ErpWorkManagement db={db} setDb={setDb} />} />
            <Route path="/erp/fornecedores" element={<ErpSuppliers db={db} setDb={setDb} />} />
            <Route path="/erp/listas" element={<ErpLists db={db} setDb={setDb} />} />
            <Route path="/erp/financeiro-cfo" element={<ErpFinanceCFO db={db} />} />
          </Routes>
        </main>
      </div>

      <footer className="vms-footer" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '50px', background: '#1c1c1e', borderTop: '1px solid #333336', display: 'flex', alignItems: 'center', padding: '0 30px', color: '#98989d', fontSize: '0.8rem' }}>
        <span style={{ fontWeight: 700, color: 'white', background: '#333', padding: '3px 8px', borderRadius: '4px', marginRight: '10px' }}>v4.0 Enterprise</span>
        <span>© 2026 Koreon Tech</span>
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