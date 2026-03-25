import React, { useEffect, useState } from 'react';
import { Truck, Plus, Phone, Hammer } from 'lucide-react';
import { Supplier } from '../../types';
import { formatCurrency, formatPhone } from '../../utils/utils';

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        setSuppliers(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fornecedores</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus size={18} />
          Novo Fornecedor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-40 bg-[#0f0f11] animate-pulse rounded-2xl"></div>)
        ) : suppliers.map((sup) => (
          <div key={sup.id} className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#0f0f11] text-slate-600 rounded-xl">
                <Truck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{sup.name}</h3>
                <p className="text-xs text-[#98989d] flex items-center gap-1">
                  <Phone size={12} />
                  {formatPhone(sup.phone)}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#98989d]">Serviço:</span>
                <span className="font-medium">{sup.service}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#98989d]">Preço Médio:</span>
                <span className="font-bold text-indigo-600">{formatCurrency(sup.price)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
