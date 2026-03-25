import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  UserCheck, 
  Plus, 
  X,
  TrendingDown,
  FileText,
  Calendar as CalendarIcon
} from 'lucide-react';
import { cn } from '../utils/utils';
import FinancialDashboard from './FinancialDashboard';
import CashFlowView from './CashFlowView';
import CommissionManager from './CommissionManager';
import AccountsCalendar from './AccountsCalendar';

export default function FinanceView() {
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    value: '',
    category: 'Variável',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    status: 'pendente'
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          description: '',
          value: '',
          category: 'Variável',
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          isRecurring: false,
          status: 'pendente'
        });
        // Increment refreshKey to trigger re-fetch in sub-components
        setRefreshKey(prev => prev + 1);
      } else {
        alert('Erro ao cadastrar despesa.');
      }
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  const handleExport = (type: string) => {
    alert(`Gerando ${type} em PDF... Aguarde um momento.`);
    setTimeout(() => {
      window.print();
    }, 1000);
  };

  const tabs = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'calendar', label: 'Contas Pagar/Receber', icon: CalendarIcon },
    { id: 'cashflow', label: 'Fluxo de Caixa', icon: ArrowRightLeft },
    { id: 'commissions', label: 'Comissões', icon: UserCheck },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div className="flex items-center p-1 bg-slate-100 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                activeSubTab === tab.id 
                  ? "bg-white text-indigo-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-700 transition-colors shadow-sm shadow-rose-100"
          >
            <TrendingDown size={18} />
            Lançar Despesa
          </button>
          <button 
            onClick={() => handleExport('Balancete')}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <FileText size={18} />
            Gerar Balancete
          </button>
        </div>
      </div>

      <div className="min-h-[600px]">
        {activeSubTab === 'dashboard' && <FinancialDashboard key={`dash-${refreshKey}`} />}
        {activeSubTab === 'calendar' && <AccountsCalendar key={`cal-${refreshKey}`} />}
        {activeSubTab === 'cashflow' && <CashFlowView key={`cf-${refreshKey}`} />}
        {activeSubTab === 'commissions' && <CommissionManager key={`comm-${refreshKey}`} />}
      </div>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Lançar Nova Despesa</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Aluguel, Internet, Marketing..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={formData.value}
                    onChange={e => setFormData({...formData, value: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="Fixo">Fixo</option>
                  <option value="Variável">Variável</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Fornecedores">Fornecedores</option>
                  <option value="Sistemas">Sistemas</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="flex items-center gap-6 py-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={e => setFormData({...formData, isRecurring: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700">Recorrente</label>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="isPaid"
                    checked={formData.status === 'pago'}
                    onChange={e => setFormData({...formData, status: e.target.checked ? 'pago' : 'pendente'})}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="isPaid" className="text-sm font-medium text-slate-700">Já Pago</label>
                </div>
              </div>
              <button 
                type="submit"
                className="w-full bg-rose-600 text-white py-4 rounded-xl font-bold hover:bg-rose-700 transition-colors mt-4"
              >
                Lançar Despesa
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
