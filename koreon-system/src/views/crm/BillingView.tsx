import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileText,
  X,
  Upload,
  Bell
} from 'lucide-react';
import { motion } from 'motion/react';
import { Installment, Contract, Client } from '../types';
import { formatCurrency, cn } from '../utils/utils';

// Extending Installment type for this view to include nested data
interface InstallmentWithClient extends Installment {
  contract: Contract & { client: Client };
}

export default function BillingView() {
  const [installments, setInstallments] = useState<InstallmentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pendente' | 'pago' | 'vencido'>('all');
  const [payingInstallment, setPayingInstallment] = useState<InstallmentWithClient | null>(null);
  const [proofUrl, setProofUrl] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const url = filter === 'all' ? '/api/installments' : `/api/installments?status=${filter}`;
    const res = await fetch(url);
    const data = await res.json();
    setInstallments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handlePay = async () => {
    if (!payingInstallment || !proofUrl) return;
    
    try {
      await fetch(`/api/installments/${payingInstallment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl, paymentDate: new Date().toISOString() })
      });
      
      setPayingInstallment(null);
      setProofUrl('');
      fetchData();
    } catch (error) {
      alert('Erro ao processar pagamento.');
    }
  };

  const executeBilling = async () => {
    const res = await fetch('/api/billing/process', { method: 'POST' });
    const data = await res.json();
    alert(`Processado: ${data.processed} cobranças enviadas.`);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Controle de Boletos e Inadimplência</h2>
          <p className="text-slate-500">Gerencie recebimentos e monitore parcelas em atraso.</p>
        </div>
        <button 
          onClick={executeBilling}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          <Bell size={20} />
          Executar Cobrança Automática
        </button>
      </div>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'all', label: 'Todos', icon: FileText },
          { id: 'pendente', label: 'Pendentes', icon: Clock },
          { id: 'vencido', label: 'Vencidos', icon: AlertCircle },
          { id: 'pago', label: 'Pagos', icon: CheckCircle2 },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              filter === f.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <f.icon size={18} />
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Parcela</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vencimento</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Atraso</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Valor</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3,4,5].map(i => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-6 py-4"><div className="h-8 bg-slate-100 rounded"></div></td>
                </tr>
              ))
            ) : installments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">Nenhuma parcela encontrada.</td>
              </tr>
            ) : installments.map((inst) => {
              const isOverdue = inst.status === 'pendente' && new Date(inst.dueDate) < new Date();
              
              return (
                <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{inst.contract?.client?.name || 'Cliente Desconhecido'}</p>
                    <p className="text-xs text-slate-500">{inst.contract?.client?.cpf || '-'}</p>
                  </td>
                  <td className="px-6 py-4 font-medium">#{inst.number}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(inst.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      inst.status === 'pago' ? "bg-emerald-50 text-emerald-600" :
                      isOverdue ? "bg-red-50 text-red-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      {inst.status === 'pago' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {inst.delayDays ? (
                      <span className="text-red-600 font-bold">{inst.delayDays} dias</span>
                    ) : isOverdue ? (
                      <span className="text-red-600 font-bold">
                        {Math.floor((new Date().getTime() - new Date(inst.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                      </span>
                    ) : inst.status === 'pago' ? (
                      <span className="text-emerald-600 font-medium">No prazo</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-right text-indigo-600">{formatCurrency(inst.value)}</td>
                  <td className="px-6 py-4 text-right">
                    {inst.status !== 'pago' && (
                      <button 
                        onClick={() => setPayingInstallment(inst)}
                        className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                        title="Baixar Pagamento"
                      >
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {payingInstallment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Confirmar Pagamento</h3>
              <button onClick={() => setPayingInstallment(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs text-slate-400 uppercase font-bold">Cliente: {payingInstallment.contract?.client?.name || 'Cliente Desconhecido'}</p>
              <p className="text-xs text-slate-400 uppercase font-bold mt-1">Parcela #{payingInstallment.number}</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{formatCurrency(payingInstallment.value)}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Upload size={16} />
                  Anexar Comprovante
                </label>
                <div className="flex flex-col gap-3">
                  <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 cursor-pointer transition-all">
                    <Upload className="text-slate-400 mb-2" size={24} />
                    <span className="text-xs font-medium text-slate-500">Clique para selecionar arquivo</span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setProofUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">Ou use um link</span>
                    </div>
                  </div>

                  <input 
                    type="text"
                    placeholder="https://exemplo.com/comprovante.pdf"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                    value={proofUrl.startsWith('data:') ? 'Arquivo selecionado' : proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic">* Obrigatório anexar comprovante para baixa no sistema.</p>
              </div>
            </div>

            <button 
              onClick={handlePay}
              disabled={!proofUrl}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              Confirmar Recebimento
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
