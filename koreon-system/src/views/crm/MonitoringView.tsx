import React, { useEffect, useState } from 'react';
import { Activity, Clock, AlertCircle, CheckCircle2, Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn, formatCurrency } from '../utils/utils';

interface MonitoringItem {
  id: string;
  type: 'billing' | 'service';
  title: string;
  subtitle: string;
  status: 'pending' | 'completed' | 'alert' | 'warning';
  value?: number;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export default function MonitoringView() {
  const [items, setItems] = useState<MonitoringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'billing' | 'service'>('all');

  const [stats, setStats] = useState({ criticalAlerts: 0, pendencies: 0, completedToday: 0, efficiency: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/monitoring/stats');
        const data = await res.json();
        setItems(data.items);
        setStats(data.stats);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch monitoring stats:", error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const filteredItems = filter === 'all' ? items : items.filter(item => item.type === filter);

  const getStatusIcon = (status: MonitoringItem['status']) => {
    switch (status) {
      case 'alert': return <AlertCircle className="text-red-500" size={18} />;
      case 'warning': return <Clock className="text-amber-500" size={18} />;
      case 'completed': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'pending': return <Activity className="text-indigo-500" size={18} />;
    }
  };

  const getPriorityColor = (priority: MonitoringItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-50 text-red-600 border-red-100';
      case 'medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'low': return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monitoramento em Tempo Real</h2>
          <p className="text-slate-500 text-sm">Acompanhe o status de cobranças e serviços ativos.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === 'all' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('billing')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === 'billing' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Cobranças
          </button>
          <button 
            onClick={() => setFilter('service')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              filter === 'service' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Serviços
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 rounded-lg text-red-600">
              <AlertCircle size={20} />
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Alerta</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Alertas Críticos</p>
          <h3 className="text-2xl font-bold mt-1">{stats.criticalAlerts}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock size={20} />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Atenção</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Pendências</p>
          <h3 className="text-2xl font-bold mt-1">{stats.pendencies}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Hoje</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Concluídos (Hoje)</p>
          <h3 className="text-2xl font-bold mt-1">{stats.completedToday}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <Activity size={20} />
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Estável</span>
          </div>
          <p className="text-slate-500 text-sm font-medium">Taxa de Eficiência</p>
          <h3 className="text-2xl font-bold mt-1">{stats.efficiency}%</h3>
        </div>
      </div>

      {/* Monitoring List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Lista de Monitoramento</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar eventos..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evento</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prioridade</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-4">
                      <div className="h-12 bg-slate-50 rounded-xl w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredItems.map((item) => (
                <motion.tr 
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={item.id} 
                  className="hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 group-hover:bg-white transition-colors">
                      {getStatusIcon(item.status)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.subtitle}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                      item.type === 'billing' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {item.type === 'billing' ? 'Cobrança' : 'Serviço'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-medium">
                      {item.value ? formatCurrency(item.value) : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500 font-medium">
                      {new Date(item.date).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase border",
                      getPriorityColor(item.priority)
                    )}>
                      {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-200">
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Mostrando {filteredItems.length} de {items.length} eventos
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 disabled:opacity-50">Anterior</button>
            <button className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700">Próximo</button>
          </div>
        </div>
      </div>
    </div>
  );
}
