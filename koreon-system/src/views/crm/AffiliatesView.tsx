import React, { useState } from 'react';
import { UserPlus, Edit2 } from 'lucide-react';
import { formatCurrency, formatPhone, cn } from '../../utils/utils';
import { saveDB } from '../../db';

export default function AffiliatesView({ db, setDb }: { db: any, setDb: any }) {
  // Garante que existe a lista de afiliados no banco
  const affiliates = db.afiliados || [];

  const handleAddAffiliate = () => {
    const name = prompt("Nome do Afiliado:");
    if (!name) return;

    const newAffiliate = {
      id: `aff_${Date.now()}`,
      nome: name,
      telefone: '',
      commissionsTotal: 0
    };

    const newDb = { ...db, afiliados: [...affiliates, newAffiliate] };
    setDb(newDb);
    saveDB(newDb);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Rede de Afiliados</h2>
        <button 
          onClick={handleAddAffiliate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <UserPlus size={18} /> Novo Afiliado
        </button>
      </div>

      <div className="bg-[#1c1c1e] rounded-3xl border border-[#333336] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0f0f11] border-b border-[#333336]">
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase">Nome</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase">Comissões Geradas</th>
              <th className="px-6 py-4 text-xs font-bold text-[#98989d] uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((aff: any) => (
              <tr key={aff.id} className="border-b border-[#333336]">
                <td className="px-6 py-4 font-bold text-white">{aff.nome}</td>
                <td className="px-6 py-4 text-indigo-400 font-bold">{formatCurrency(aff.commissionsTotal)}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-[#98989d]"><Edit2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}