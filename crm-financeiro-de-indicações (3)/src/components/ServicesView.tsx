import React, { useEffect, useState } from 'react';
import { Settings, Plus, Clock, CheckCircle2, List, Calendar, AlertCircle, Search, Filter, Download, UserCheck } from 'lucide-react';
import { Service, Client } from '../types';
import { formatCurrency, cn } from '../utils/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ActiveService {
  id: string;
  clientName: string;
  type: string;
  contractDate: string;
  deadlineDate: string;
  status: 'on_time' | 'delayed' | 'pending' | 'completed';
}

interface WeeklyList {
  id: string;
  type: string;
  scheduledDate: string;
  clientsCount: number;
  status: 'upcoming' | 'processing' | 'completed';
}

export default function ServicesView() {
  const [activeServices, setActiveServices] = useState<ActiveService[]>([]);
  const [weeklyLists, setWeeklyLists] = useState<WeeklyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'lists' | 'catalog'>('active');

  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeRes, listsRes, servicesRes] = await Promise.all([
          fetch('/api/services/active'),
          fetch('/api/weekly-lists'),
          fetch('/api/services')
        ]);
        
        const activeData = await activeRes.json();
        const listsData = await listsRes.json();
        const servicesData = await servicesRes.json();

        setActiveServices(activeData.map((cs: any) => ({
          id: cs.id,
          clientName: cs.client.name,
          type: cs.service.name,
          contractDate: cs.startDate,
          deadlineDate: cs.endDate || new Date(new Date(cs.startDate).getTime() + cs.service.avgDuration * 24 * 60 * 60 * 1000).toISOString(),
          status: cs.endDate && new Date(cs.endDate) < new Date() ? 'delayed' : 'on_time'
        })));

        setWeeklyLists(listsData);
        setServices(servicesData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch services data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateTimeRemaining = (deadline: string) => {
    const now = new Date();
    const target = new Date(deadline);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} dias de atraso`;
    if (diffDays === 0) return 'Vence hoje';
    return `${diffDays} dias restantes`;
  };

  const getStatusBadge = (status: ActiveService['status']) => {
    switch (status) {
      case 'on_time': return <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase">No Prazo</span>;
      case 'delayed': return <span className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase">Atrasado</span>;
      case 'pending': return <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase">Pendente</span>;
      case 'completed': return <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase">Concluído</span>;
    }
  };

  const getNextListDay = () => {
    const now = new Date();
    const day = now.getDay(); // 0: Sunday, 3: Wednesday
    
    let nextDay;
    if (day < 3) nextDay = 'Quarta-feira';
    else if (day < 7) nextDay = 'Domingo';
    else nextDay = 'Quarta-feira';

    return nextDay;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestão de Serviços</h2>
          <p className="text-slate-500 text-sm">Gerencie serviços ativos e monitoramento de listas semanais.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setViewMode('active')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              viewMode === 'active' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Clock size={16} />
            Ativos
          </button>
          <button 
            onClick={() => setViewMode('lists')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              viewMode === 'lists' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <List size={16} />
            Listas Semanais
          </button>
          <button 
            onClick={() => setViewMode('catalog')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              viewMode === 'catalog' ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <Settings size={16} />
            Catálogo
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'active' && (
          <motion.div 
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serviço</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Contrato</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prazo Final</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempo Restante</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    [1,2,3].map(i => <tr key={i}><td colSpan={6} className="px-6 py-8 animate-pulse"><div className="h-8 bg-slate-100 rounded"></div></td></tr>)
                  ) : activeServices.map((service) => (
                    <tr key={service.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{service.clientName}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                          {service.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(service.contractDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(service.deadlineDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className={cn(service.status === 'delayed' ? "text-red-500" : "text-slate-400")} />
                          <span className={cn("text-xs font-medium", service.status === 'delayed' ? "text-red-600" : "text-slate-700")}>
                            {calculateTimeRemaining(service.deadlineDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(service.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {viewMode === 'lists' && (
          <motion.div 
            key="lists"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <Calendar size={18} className="text-indigo-600" />
                      Cronograma de Listas Semanais
                    </h3>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold">
                      Próxima Lista: {getNextListDay()}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {weeklyLists.map((list) => (
                      <div key={list.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-xl",
                            list.status === 'completed' ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                          )}>
                            <List size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{list.type}</p>
                            <p className="text-xs text-slate-500">{new Date(list.scheduledDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{list.clientsCount} Clientes</p>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            list.status === 'completed' ? "text-emerald-600" : "text-indigo-600"
                          )}>
                            {list.status === 'completed' ? 'Finalizada' : 'Agendada'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <UserCheck size={18} className="text-indigo-600" />
                    Clientes Aguardando Próxima Lista
                  </h3>
                  <div className="space-y-2">
                    {activeServices.filter(s => s.type === 'Limpa Nome').map((service) => (
                      <div key={service.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {service.clientName.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{service.clientName}</span>
                        </div>
                        <span className="text-xs text-slate-400 italic">Entrou em {new Date(service.contractDate).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
                  <h3 className="font-bold text-lg mb-2">Automação de Listas</h3>
                  <p className="text-indigo-100 text-sm mb-6">
                    O sistema identifica automaticamente novos contratos de "Limpa Nome" e os agrupa para as listas de Domingo e Quarta-feira.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider">Status do Robô</p>
                        <p className="text-sm">Ativo e Monitorando</p>
                      </div>
                    </div>
                    <button className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all">
                      Gerar Lista Agora
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-500" />
                    Avisos Importantes
                  </h3>
                  <ul className="space-y-3 text-xs text-slate-500 leading-relaxed">
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0"></span>
                      Listas de Domingo incluem nomes recebidos até Sábado 23:59.
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0"></span>
                      Listas de Quarta incluem nomes recebidos até Terça 23:59.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === 'catalog' && (
          <motion.div 
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl"></div>)
              ) : services.map((service) => (
                <div key={service.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Settings size={24} />
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      service.status === 'ativo' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
                    )}>
                      {service.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{service.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Preço Base:</span>
                      <span className="font-bold text-indigo-600">{formatCurrency(service.price)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock size={14} />
                        Prazo Médio:
                      </span>
                      <span className="font-medium">{service.avgDuration} dias</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
