import React, { useEffect, useState } from 'react';
import { List, FileSpreadsheet, Plus, TrendingUp, DollarSign } from 'lucide-react';
import { NameList } from '../../types';
import { formatCurrency } from '../../utils/utils';

export default function ListsView() {
  const [lists, setLists] = useState<NameList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/name-lists')
      .then(res => res.json())
      .then(data => {
        setLists(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Listas de Nomes</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <FileSpreadsheet size={18} />
          Importar XLS/XLSX
        </button>
      </div>

      <div className="bg-[#1c1c1e] rounded-2xl border border-[#333336] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0f0f11] border-b border-[#333336]">
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Nome da Lista</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Qtd Nomes</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Custo Lista</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Custo Marketing</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Custo p/ Nome</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase tracking-wider">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1,2,3].map(i => <tr key={i}><td colSpan={6} className="px-6 py-4 animate-pulse"><div className="h-8 bg-[#0f0f11] rounded"></div></td></tr>)
            ) : lists.map((list) => (
              <tr key={list.id} className="hover:bg-[#0f0f11] transition-colors">
                <td className="px-6 py-4 font-bold text-white">{list.name}</td>
                <td className="px-6 py-4 text-sm font-medium">{list.count}</td>
                <td className="px-6 py-4 text-sm">{formatCurrency(list.pricePaid)}</td>
                <td className="px-6 py-4 text-sm">{formatCurrency(list.marketingCost)}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                    {formatCurrency(list.costPerName)}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-[#98989d]">{new Date(list.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
