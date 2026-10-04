import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Settings, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Download,
  Upload,
  X,
  Trash2,
  Phone
} from 'lucide-react';
import { motion } from 'motion/react';
import type { Client, ClientService, Contract, Installment } from '../../types';import { formatCurrency, formatCPF, formatPhone, cn } from '../../utils/utils';

interface ClientDetailsViewProps {
  client: Client;
  onBack: () => void;
}

export default function ClientDetailsView({ client, onBack }: ClientDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'statement' | 'services' | 'contracts'>('statement');
  const [services, setServices] = useState<ClientService[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInstallment, setPayingInstallment] = useState<Installment | null>(null);
  const [proofUrl, setProofUrl] = useState('');

  const handlePay = async () => {
    if (!payingInstallment || !proofUrl) return;
    
    try {
      await fetch(`/api/installments/${payingInstallment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl, paymentDate: new Date().toISOString() })
      });
      
      // Refresh data
      const contractsData = await fetch(`/api/contracts`).then(res => res.json()).then(data => data.filter((c: any) => c.clientId === client.id));
      setContracts(contractsData);
      setPayingInstallment(null);
      setProofUrl('');
    } catch (error) {
      alert('Erro ao processar pagamento.');
    }
  };

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${client.id}/services`).then(res => res.json()),
      fetch(`/api/contracts`).then(res => res.json()).then(data => data.filter((c: any) => c.clientId === client.id))
    ]).then(([servicesData, contractsData]) => {
      setServices(servicesData);
      setContracts(contractsData);
      setLoading(false);
    });
  }, [client.id]);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const allInstallments = contracts.flatMap(c => c.installments || []).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/clients/${client.id}`, { 
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('Cliente excluído com sucesso!');
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error || 'Erro desconhecido'}`);
        setIsConfirmingDelete(false);
      }
    } catch (error) {
      alert('Erro na conexão com o servidor.');
      setIsConfirmingDelete(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[#98989d] hover:text-white transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Voltar para Clientes
        </button>
        {isConfirmingDelete ? (
          <div className="flex items-center gap-2 bg-red-50 p-2 rounded-xl border border-red-100 animate-in fade-in slide-in-from-right-4 duration-300">
            <span className="text-sm font-bold text-red-600 px-2">Confirmar exclusão?</span>
            <button 
              onClick={handleDelete}
              className="px-4 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors"
            >
              Sim, Excluir
            </button>
            <button 
              onClick={() => setIsConfirmingDelete(false)}
              className="px-4 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsConfirmingDelete(true)}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors font-bold text-sm"
          >
            <Trash2 size={18} />
            Excluir Cliente
          </button>
        )}
      </div>

      <div className="bg-[#1c1c1e] p-8 rounded-3xl border border-[#333336] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-3xl font-bold">{client.name}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-[#98989d] text-sm">
                <span className="flex items-center gap-1"><FileText size={14} /> {formatCPF(client.cpf)}</span>
                <span className="flex items-center gap-1"><Phone size={14} /> {formatPhone(client.phone)}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  client.status === 'fechado' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                )}>
                  {client.status}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-xs text-[#98989d] uppercase font-bold">Total Contratado</p>
              <p className="text-2xl font-bold text-indigo-600">{formatCurrency(client.totalContracted)}</p>
            </div>
            <div className="text-right border-l border-[#333336] pl-4">
              <p className="text-xs text-[#98989d] uppercase font-bold">Pendente</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(client.pending)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-[#0f0f11] rounded-2xl w-fit">
        {[
          { id: 'statement', label: 'Extrato de Pagamento', icon: DollarSign },
          { id: 'services', label: 'Serviços Contratados', icon: Settings },
          { id: 'contracts', label: 'Contratos', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id ? "bg-[#1c1c1e] text-indigo-600 shadow-sm" : "text-[#98989d] hover:text-white"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#1c1c1e] rounded-3xl border border-[#333336] shadow-sm overflow-hidden">
        {activeTab === 'statement' && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f0f11] border-b border-[#333336]">
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Parcela</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Pagamento</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Atraso</th>
                <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allInstallments.map((inst) => (
                <tr key={inst.id} className="hover:bg-[#0f0f11] transition-colors">
                  <td className="px-6 py-4 font-bold text-white">#{inst.number}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(inst.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {inst.paymentDate ? new Date(inst.paymentDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      inst.status === 'pago' ? "bg-emerald-50 text-emerald-600" :
                      new Date(inst.dueDate) < new Date() ? "bg-red-50 text-red-600" :
                      "bg-amber-50 text-amber-600"
                    )}>
                      {inst.status === 'pago' ? 'Pago' : new Date(inst.dueDate) < new Date() ? 'Vencido' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {inst.delayDays ? (
                      <span className="text-red-600 font-bold">{inst.delayDays} dias</span>
                    ) : inst.status === 'pago' ? (
                      <span className="text-emerald-600 font-medium">No prazo</span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-right">
                    <div className="flex items-center justify-end gap-3">
                      {formatCurrency(inst.value)}
                      {inst.status !== 'pago' && (
                        <button 
                          onClick={() => setPayingInstallment(inst)}
                          className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          title="Pagar"
                        >
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {payingInstallment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#1c1c1e] rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Confirmar Pagamento</h3>
                <button onClick={() => setPayingInstallment(null)} className="text-[#98989d] hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 bg-[#0f0f11] rounded-2xl border border-[#333336]">
                <p className="text-xs text-[#98989d] uppercase font-bold">Parcela #{payingInstallment.number}</p>
                <p className="text-2xl font-bold text-indigo-600">{formatCurrency(payingInstallment.value)}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#e5e5ea] flex items-center gap-2">
                    <Upload size={16} />
                    Anexar Comprovante
                  </label>
                  <div className="flex flex-col gap-3">
                    <label className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#333336] rounded-2xl hover:bg-[#0f0f11] cursor-pointer transition-all">
                      <Upload className="text-[#98989d] mb-2" size={24} />
                      <span className="text-xs font-medium text-[#98989d]">Clique para selecionar arquivo</span>
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
                        <span className="w-full border-t border-[#333336]"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-[#1c1c1e] px-2 text-[#98989d]">Ou use um link</span>
                      </div>
                    </div>

                    <input 
                      type="text"
                      placeholder="https://exemplo.com/comprovante.pdf"
                      className="w-full p-3 bg-[#0f0f11] border border-[#333336] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                      value={proofUrl.startsWith('data:') ? 'Arquivo selecionado' : proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-[#98989d] italic">* Obrigatório anexar comprovante para baixa no sistema.</p>
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

        {activeTab === 'services' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((cs) => (
              <div key={cs.id} className="p-6 bg-[#0f0f11] rounded-2xl border border-[#333336] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#1c1c1e] text-indigo-600 rounded-xl shadow-sm">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{cs.service?.name || 'Serviço Desconhecido'}</h4>
                    <p className="text-xs text-[#98989d]">Início: {new Date(cs.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  cs.status === 'concluido' ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                )}>
                  {cs.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {services.length === 0 && <p className="col-span-2 text-center py-12 text-[#98989d]">Nenhum serviço vinculado.</p>}
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="p-6 space-y-4">
            {contracts.map((contract) => (
              <div key={contract.id} className="p-6 bg-[#0f0f11] rounded-2xl border border-[#333336] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg">Contrato #{contract.id.slice(-6)}</h4>
                  <p className="text-sm text-[#98989d]">{contract.installmentsCount} parcelas • {formatCurrency(contract.totalValue)}</p>
                  {contract.contractDate && (
                    <p className="text-xs text-[#98989d] mt-1">Data: {new Date(contract.contractDate).toLocaleDateString()}</p>
                  )}
                </div>
                {contract.contractUrl && (
                  <a 
                    href={contract.contractUrl} 
                    download={`contrato-${client.name}.png`}
                    className="p-2 bg-[#1c1c1e] text-indigo-600 rounded-xl shadow-sm hover:bg-indigo-50 transition-colors"
                  >
                    <Download size={20} />
                  </a>
                )}
              </div>
            ))}
            {contracts.length === 0 && <p className="text-center py-12 text-[#98989d]">Nenhum contrato encontrado.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
