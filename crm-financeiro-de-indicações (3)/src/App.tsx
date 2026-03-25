import React, { useState, useEffect } from 'react';
import { 
  Activity,
  LayoutDashboard, 
  Users, 
  FileText, 
  Handshake, 
  DollarSign, 
  Upload, 
  Search,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Menu,
  X,
  Plus,
  UserPlus,
  Truck,
  List,
  Settings,
  Bell,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from './utils/utils';
import { DashboardStats, Client, Contract, Referral } from './types';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import ContractsView from './components/ContractsView';
import ReferralsView from './components/ReferralsView';
import FinanceView from './components/FinanceView';
import UploadView from './components/UploadView';
import AffiliatesView from './components/AffiliatesView';
import SuppliersView from './components/SuppliersView';
import ListsView from './components/ListsView';
import ServicesView from './components/ServicesView';
import BillingView from './components/BillingView';
import MonitoringView from './components/MonitoringView';
import ContractAutomationView from './components/ContractAutomationView';
import { SystemView } from './components/SystemView';
import { Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Monitoramento', icon: Activity },
    { id: 'automation', label: 'Automação', icon: FileCheck },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'contracts', label: 'Contratos', icon: FileText },
    { id: 'billing', label: 'Cobrança', icon: Bell },
    { id: 'referrals', label: 'Indicações', icon: Handshake },
    { id: 'affiliates', label: 'Afiliados', icon: UserPlus },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck },
    { id: 'lists', label: 'Listas', icon: List },
    { id: 'services', label: 'Serviços', icon: Settings },
    { id: 'system', label: 'Sistema', icon: Shield },
    { id: 'upload', label: 'Upload Contrato', icon: Upload },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView />;
      case 'monitoring': return <MonitoringView />;
      case 'automation': return <ContractAutomationView />;
      case 'clients': return <ClientsView searchQuery={searchQuery} />;
      case 'contracts': return <ContractsView />;
      case 'billing': return <BillingView />;
      case 'referrals': return <ReferralsView />;
      case 'affiliates': return <AffiliatesView />;
      case 'finance': return <FinanceView />;
      case 'suppliers': return <SuppliersView />;
      case 'lists': return <ListsView />;
      case 'services': return <ServicesView />;
      case 'system': return <SystemView />;
      case 'upload': return <UploadView onComplete={() => setActiveTab('dashboard')} />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-white font-sans">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#1c1c1e] border-r border-[#333336] transition-all duration-300 flex flex-col z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent"
            >
              CRM Financeiro
            </motion.h1>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-[#0f0f11] rounded-lg text-[#98989d]"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center p-3 rounded-xl transition-all group",
                activeTab === item.id 
                  ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                  : "text-[#98989d] hover:bg-[#0f0f11] hover:text-white"
              )}
            >
              <item.icon size={22} className={cn(
                "transition-colors",
                activeTab === item.id ? "text-indigo-600" : "text-[#98989d] group-hover:text-slate-600"
              )} />
              {isSidebarOpen && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#333336]">
          <div className={cn(
            "flex items-center p-2 rounded-xl bg-[#0f0f11]",
            !isSidebarOpen && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
            {isSidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-semibold truncate">Admin</p>
                <p className="text-xs text-[#98989d] truncate">admin@crm.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-[#1c1c1e] border-bottom border-[#333336] px-8 flex items-center justify-between shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98989d]" size={18} />
            <input 
              type="text"
              placeholder="Buscar cliente, CPF ou telefone..."
              className="w-full pl-10 pr-4 py-2 bg-[#0f0f11] border border-[#333336] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-[#98989d] hover:bg-[#0f0f11] rounded-lg relative">
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
              <AlertCircle size={20} />
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm shadow-indigo-200"
            >
              <Plus size={18} />
              Novo Contrato
            </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
