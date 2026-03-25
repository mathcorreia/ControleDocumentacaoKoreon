import React, { useEffect, useState } from 'react';
import { Handshake, TrendingUp, Wallet, CheckCircle2, Clock } from 'lucide-react';
import { Referral } from '../../types';
import { formatCurrency } from '../../utils/utils';

export default function ReferralsView() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/referrals')
      .then(res => res.json())
      .then(data => {
        setReferrals(data);
        setLoading(false);
      });
  }, []);

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'pendente').reduce((acc, r) => acc + r.commission, 0),
    paid: referrals.filter(r => r.status === 'pago').reduce((acc, r) => acc + r.commission, 0),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sistema de Indicações</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
          <p className="text-[#98989d] text-sm font-medium">Total de Indicações</p>
          <h3 className="text-2xl font-bold mt-1">{stats.total}</h3>
        </div>
        <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
          <p className="text-[#98989d] text-sm font-medium">Comissões Pendentes</p>
          <h3 className="text-2xl font-bold mt-1 text-amber-600">{formatCurrency(stats.pending)}</h3>
        </div>
        <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
          <p className="text-[#98989d] text-sm font-medium">Comissões Pagas</p>
          <h3 className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(stats.paid)}</h3>
        </div>
      </div>

      <div className="bg-[#1c1c1e] rounded-2xl border border-[#333336] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f0f11] border-b border-[#333336]">
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Indicador</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Indicado</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Valor Contrato</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Comissão</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i}><td colSpan={6} className="px-6 py-4 animate-pulse"><div className="h-8 bg-[#0f0f11] rounded"></div></td></tr>)
            ) : referrals.map((ref) => (
              <tr key={ref.id} className="hover:bg-[#0f0f11] transition-colors">
                <td className="px-6 py-4 font-bold text-white">
                  {ref.affiliate?.name || ref.referrer?.name || 'Sistema'}
                </td>
                <td className="px-6 py-4 text-slate-600">{ref.referredClient?.name || 'Cliente Desconhecido'}</td>
                <td className="px-6 py-4 text-sm font-medium">{formatCurrency(ref.contractValue)}</td>
                <td className="px-6 py-4 text-sm font-bold text-indigo-600">{formatCurrency(ref.commission)}</td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    ref.status === 'pago' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {ref.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-[#98989d]">{new Date(ref.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
