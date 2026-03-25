
import React, { useState } from 'react';
import { 
  Users, Briefcase, Layers, DollarSign, LayoutDashboard,
  Menu, X, Search, Bell, Settings, Target, ClipboardList,
  LayoutList, ShieldCheck, Landmark, Truck
} from 'lucide-react';
import { getDB } from './db';
import ClientesView from './views/ClientesView';
import DashboardView from './views/DashboardView';
import ServicosView from './views/ServicosView';
import ListasView from './views/ListasView';
import FinanceiroView from './views/FinanceiroView';
import CommandDashboardView from './views/CommandDashboardView';
import ServiceOperationsCenter from './views/ServiceOperationsCenter';
import ScoreIncreaseView from './views/ScoreIncreaseView';
import WorkManagementView from './views/WorkManagementView';
import FinanceiroCFO from './views/FinanceiroCFO';
import FornecedoresView from './views/FornecedoresView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [db, setDb] = useState(getDB());

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel Geral' },
    { id: 'fin_cfo', icon: Landmark, label: 'Financeiro Master' },
    { id: 'fornecedores', icon: Truck, label: 'Fornecedores' },
    { id: 'work_mgmt', icon: ShieldCheck, label: 'Gestão de Trabalho' },
    { id: 'comando', icon: Target, label: 'Centro de Comando' },
    { id: 'operacoes', icon: ClipboardList, label: 'Centro de Operações' },
    { id: 'score', icon: LayoutList, label: 'Centro de Trabalho' },
    { id: 'clientes', icon: Users, label: 'Clientes' },
    { id: 'servicos', icon: Briefcase, label: 'Serviços' },
    { id: 'listas', icon: Layers, label: 'Listas Processuais' },
    { id: 'financeiro', icon: DollarSign, label: 'Financeiro' },
  ];

  const refreshDB = () => setDb(getDB());

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView db={db} />;
      case 'fin_cfo': return <FinanceiroCFO db={db} />;
      case 'fornecedores': return <FornecedoresView db={db} />;
      case 'work_mgmt': return <WorkManagementView db={db} onSync={refreshDB} />;
      case 'comando': return <CommandDashboardView db={db} />;
      case 'operacoes': return <ServiceOperationsCenter db={db} />;
      case 'score': return <ScoreIncreaseView db={db} onSync={refreshDB} />;
      case 'clientes': return <ClientesView db={db} setDb={setDb} />;
      case 'servicos': return <ServicosView db={db} setDb={setDb} />;
      case 'listas': return <ListasView db={db} setDb={setDb} />;
      case 'financeiro': return <FinanceiroView db={db} setDb={setDb} />;
      default: return <DashboardView db={db} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-24'
        } transition-all duration-300 ease-in-out bg-slate-900 border-r border-slate-800 flex flex-col h-full z-20 shadow-2xl`}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="text-white w-6 h-6" />
            </div>
            {isSidebarOpen && <span className="text-white font-black text-xl tracking-tighter">ServiceERP</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-400 hover:text-white transition-colors">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-6 space-y-2 py-6 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <item.icon size={22} />
              {isSidebarOpen && <span className="font-bold text-sm tracking-wide">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 font-black shadow-inner">
              AD
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">Administrador</p>
                <p className="text-xs text-slate-500 font-medium truncate uppercase tracking-widest">Master CFO</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Busca global..." 
                className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm w-80 focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
              />
            </div>
            <button className="relative p-3 text-slate-400 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-2xl">
              <Bell size={22} />
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-4 ring-white"></span>
            </button>
            <button className="p-3 text-slate-400 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-2xl">
              <Settings size={22} />
            </button>
          </div>
        </header>

        {/* View Area */}
        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
