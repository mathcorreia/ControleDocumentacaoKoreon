import React, { useEffect, useState } from 'react';
import { UserPlus, TrendingUp, Wallet, CheckCircle2, Clock, X, Edit2, Percent, Layers } from 'lucide-react';
import { Affiliate } from '../types';
import { formatCurrency, formatCPF, formatPhone, cn } from '../utils/utils';

export default function AffiliatesView() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cpf: '',
    defaultCommissionValue: 100,
    defaultCommissionInstallments: 1,
    commissionType: 'upfront'
  });

  const fetchAffiliates = () => {
    setLoading(true);
    fetch('/api/affiliates')
      .then(res => res.json())
      .then(data => {
        setAffiliates(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleEdit = (aff: Affiliate) => {
    setEditingAffiliate(aff);
    setFormData({
      name: aff.name,
      phone: aff.phone,
      cpf: aff.cpf,
      defaultCommissionValue: aff.defaultCommissionValue,
      defaultCommissionInstallments: aff.defaultCommissionInstallments,
      commissionType: aff.commissionType
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAffiliate ? `/api/affiliates/${editingAffiliate.id}` : '/api/affiliates';
      const method = editingAffiliate ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setEditingAffiliate(null);
        setFormData({ name: '', phone: '', cpf: '', defaultCommissionValue: 100, defaultCommissionInstallments: 1, commissionType: 'upfront' });
        fetchAffiliates();
        alert(editingAffiliate ? 'Afiliado atualizado!' : 'Afiliado cadastrado!');
      } else {
        alert('Erro ao processar solicitação.');
      }
    } catch (error) {
      alert('Erro de conexão.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão de Afiliados</h2>
        <button 
          onClick={() => {
            setEditingAffiliate(null);
            setFormData({ name: '', phone: '', cpf: '', defaultCommissionValue: 100, defaultCommissionInstallments: 1, commissionType: 'upfront' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <UserPlus size={18} />
          Novo Afiliado
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold">{editingAffiliate ? 'Editar Afiliado' : 'Cadastrar Novo Afiliado'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone</label>
                    <input 
                      type="text" 
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CPF</label>
                    <input 
                      type="text" 
                      required
                      value={formData.cpf}
                      onChange={e => setFormData({...formData, cpf: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Percent size={16} className="text-indigo-600" />
                    Configuração de Comissão
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Valor (R$)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={formData.defaultCommissionValue}
                        onChange={e => setFormData({...formData, defaultCommissionValue: Number(e.target.value)})}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Parcelas</label>
                      <select 
                        value={formData.defaultCommissionInstallments}
                        onChange={e => setFormData({...formData, defaultCommissionInstallments: Number(e.target.value)})}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                      >
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tipo de Pagamento</label>
                    <select 
                      value={formData.commissionType}
                      onChange={e => setFormData({...formData, commissionType: e.target.value})}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                    >
                      <option value="upfront">À Vista (No fechamento)</option>
                      <option value="installment">Nas Parcelas (Conforme pago)</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    {formData.commissionType === 'upfront' 
                      ? '* A comissão total é gerada assim que o contrato é fechado.' 
                      : '* A comissão é gerada proporcionalmente a cada parcela paga pelo cliente.'}
                  </p>
                </div>
              </div>
              
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 mt-4"
              >
                {editingAffiliate ? 'Salvar Alterações' : 'Cadastrar Afiliado'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Afiliado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Comissão</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Indicações</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gerado</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pendente</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i}><td colSpan={6} className="px-6 py-4 animate-pulse"><div className="h-8 bg-slate-100 rounded"></div></td></tr>)
            ) : affiliates.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhum afiliado cadastrado.</td></tr>
            ) : affiliates.map((aff) => (
              <tr key={aff.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-900">{aff.name}</p>
                  <p className="text-xs text-slate-500">{formatPhone(aff.phone)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-indigo-600">{formatCurrency(aff.defaultCommissionValue)}</span>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-tighter",
                      aff.commissionType === 'upfront' ? "text-blue-500" : "text-amber-500"
                    )}>
                      {aff.commissionType === 'upfront' ? 'À Vista' : `${aff.defaultCommissionInstallments}x Parcelado`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">{aff.referralsCount}</td>
                <td className="px-6 py-4 text-sm font-bold">{formatCurrency(aff.commissionsTotal)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-amber-600">{formatCurrency(aff.commissionsPending)}</span>
                    <span className="text-[10px] text-slate-400">A receber</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleEdit(aff)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Editar Afiliado"
                  >
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
