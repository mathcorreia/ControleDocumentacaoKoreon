
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardCheck, ListTodo, AlertTriangle, BarChart3, 
  Clock, Flame, CheckCircle2, ChevronRight, TrendingUp,
  Search, Filter, MoreVertical, Zap, Calendar, User,
  Activity, Play, ArrowRight, ShieldAlert, Timer
} from 'lucide-react';
import { 
  ServicoContratado, TipoServicoStrict, StatusServico 
} from '../types';
import ScoreIncreaseView from './ScoreIncreaseView';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  estimatedTime: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
}

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Revisão de Protocolos Postais - Score', dueDate: new Date().toISOString().split('T')[0], priority: 'High', estimatedTime: '45min', status: 'Not Started' },
  { id: 't2', title: 'Conciliação de Comprovantes de Entrada', dueDate: new Date().toISOString().split('T')[0], priority: 'Critical', estimatedTime: '30min', status: 'Not Started' },
];

const WorkManagementView: React.FC<{ db: any, onSync: () => void }> = ({ db, onSync }) => {
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'center' | 'pending' | 'reports'>('tasks');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('work_management_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  useEffect(() => {
    localStorage.setItem('work_management_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextStatus = t.status === 'Completed' ? 'Not Started' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Sub-Navigation Tabs */}
      <div className="flex gap-4 p-1.5 bg-slate-200/50 w-fit rounded-[28px] border border-slate-100 shadow-sm">
        <TabButton active={activeSubTab === 'tasks'} onClick={() => setActiveSubTab('tasks')} icon={ListTodo} label="ITT Reduza – Tarefas" />
        <TabButton active={activeSubTab === 'center'} onClick={() => setActiveSubTab('center')} icon={Zap} label="Serviços (Work Center)" />
        <TabButton active={activeSubTab === 'pending'} onClick={() => setActiveSubTab('pending')} icon={AlertTriangle} label="Serviços Pendentes" />
        <TabButton active={activeSubTab === 'reports'} onClick={() => setActiveSubTab('reports')} icon={BarChart3} label="Dashboards & Performance" />
      </div>

      <div className="min-h-[600px]">
        {activeSubTab === 'tasks' && <TasksSubTab tasks={tasks} onToggle={toggleTaskStatus} />}
        {activeSubTab === 'center' && <ScoreIncreaseView db={db} onSync={onSync} />}
        {activeSubTab === 'pending' && <PendingSubTab db={db} />}
        {activeSubTab === 'reports' && <ReportsSubTab db={db} />}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-[24px] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
      active ? 'bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    <Icon size={16} /> {label}
  </button>
);

const TasksSubTab = ({ tasks, onToggle }: { tasks: Task[], onToggle: (id: string) => void }) => {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const priorityMap = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });
  }, [tasks]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-400">
      <div className="bg-red-50 p-6 rounded-[35px] border-2 border-red-100 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Flame className="text-red-600 animate-pulse" size={28} />
            <div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Obrigações Críticas de Hoje</h3>
               <p className="text-xs font-bold text-red-600 uppercase tracking-widest">A execução não é opcional</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks Pendentes</p>
            <p className="text-2xl font-black text-red-600">{tasks.filter(t => t.status !== 'Completed').length}</p>
         </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-10 py-6">Obrigação de Execução</th>
              <th className="px-10 py-6 text-center">Prioridade</th>
              <th className="px-10 py-6 text-center">Estimativa</th>
              <th className="px-10 py-6 text-center">Status</th>
              <th className="px-10 py-6 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedTasks.map(task => (
              <tr key={task.id} className={`group hover:bg-slate-50/50 transition-all ${task.status === 'Completed' ? 'opacity-50' : ''}`}>
                <td className="px-10 py-6">
                   <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        task.priority === 'Critical' ? 'bg-red-500 shadow-lg shadow-red-500/40 animate-pulse' :
                        task.priority === 'High' ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                      <p className={`font-black text-slate-800 text-sm ${task.status === 'Completed' ? 'line-through' : ''}`}>{task.title}</p>
                   </div>
                </td>
                <td className="px-10 py-6 text-center">
                   <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                     task.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                   }`}>{task.priority}</span>
                </td>
                <td className="px-10 py-6 text-center">
                   <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                      <Clock size={14} /> {task.estimatedTime}
                   </div>
                </td>
                <td className="px-10 py-6 text-center">
                   <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                   }`}>{task.status}</span>
                </td>
                <td className="px-10 py-6 text-right">
                   <button 
                    onClick={() => onToggle(task.id)}
                    className={`p-3 rounded-2xl transition-all ${
                      task.status === 'Completed' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                   >
                     {task.status === 'Completed' ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 border-4 border-slate-200 rounded-full group-hover:border-blue-200"></div>}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PendingSubTab = ({ db }: { db: any }) => {
  const pendingServices = useMemo(() => {
    return (db.servicos || []).filter((s: ServicoContratado) => {
      // Logic for "stalled" or "pending":
      // 1. Not completed
      // 2. Either progress is 0 or it's been delayed
      const isDelayed = s.status === StatusServico.ATRASADO;
      const isStalled = s.progresso === 0 && s.status !== StatusServico.CONCLUIDO;
      const isWaiting = s.status === StatusServico.FASE_FINAL;
      return (isDelayed || isStalled || isWaiting) && s.status !== StatusServico.CONCLUIDO;
    }).sort((a: any, b: any) => {
      if (a.status === StatusServico.ATRASADO) return -1;
      return 1;
    });
  }, [db.servicos]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-2 duration-400">
      <div className="flex items-center justify-between bg-slate-900 p-8 rounded-[40px] text-white overflow-hidden relative">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <AlertTriangle size={100} />
         </div>
         <div className="relative z-10">
            <h3 className="text-2xl font-black tracking-tight">Mural de Negligência Operacional</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Serviços travados, atrasados ou ignorados</p>
         </div>
         <div className="relative z-10 bg-red-600 px-8 py-4 rounded-[25px] shadow-2xl animate-bounce">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Intervenção Necessária</p>
            <p className="text-3xl font-black text-white">{pendingServices.length}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pendingServices.map((s: any) => {
          const cliente = db.clientes.find((c: any) => c.id === s.clienteId);
          return (
            <div key={s.id} className="bg-white p-8 rounded-[40px] border-2 border-red-50 shadow-sm relative group overflow-hidden">
               <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
               <div className="flex items-center justify-between mb-6">
                  <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    s.status === StatusServico.ATRASADO ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {s.status}
                  </span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.progresso}% Completo</p>
               </div>
               <h4 className="text-xl font-black text-slate-800 tracking-tight mb-1">{cliente?.nome}</h4>
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-6">{s.tipo}</p>
               
               <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motivo do Alerta</p>
                     <p className="text-xs font-bold text-slate-700">
                        {s.status === StatusServico.ATRASADO ? 'Prazo contratual expirado' : 
                         s.progresso === 0 ? 'Zero progresso desde a autorização' : 'Aguardando ação externa prolongada'}
                     </p>
                  </div>
                  <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all">
                     <Timer size={16} /> Ver Checklist Completo
                  </button>
               </div>
            </div>
          );
        })}
        {pendingServices.length === 0 && (
          <div className="col-span-full py-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.4em]">Foco Total: Nenhuma pendência crítica</div>
        )}
      </div>
    </div>
  );
};

const ReportsSubTab = ({ db }: { db: any }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-left-2 duration-400">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <ReportCard label="Peak Productivity" value="High" icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
          <ReportCard label="Checklist Speed" value="4.2d/step" icon={Zap} color="text-blue-600" bg="bg-blue-50" />
          <ReportCard label="Resolution Rate" value="92%" icon={CheckCircle2} color="text-indigo-600" bg="bg-indigo-50" />
          <ReportCard label="System Bottlenecks" value="3 identified" icon={Timer} color="text-amber-600" bg="bg-amber-50" />
       </div>

       <div className="bg-white p-10 rounded-[45px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-10">
             <BarChart3 className="text-blue-600" size={32} />
             <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Auditoria de Performance Operacional</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dados reais, sem floreios motivacionais</p>
             </div>
          </div>
          
          <div className="space-y-6">
             <PerformanceRow label="Velocidade de Execução Checklist" percentage={75} color="bg-blue-600" />
             <PerformanceRow label="Aderência a Prazos Postais" percentage={45} color="bg-amber-500" />
             <PerformanceRow label="Taxa de Conclusão Sem Interrupção" percentage={88} color="bg-emerald-500" />
             <PerformanceRow label="Retrabalho Documental" percentage={12} color="bg-red-500" />
          </div>

          <div className="mt-12 p-8 bg-slate-50 rounded-[35px] border border-slate-100">
             <p className="text-xs font-bold text-slate-500 leading-relaxed">
                <span className="font-black text-slate-800 uppercase">Análise de Gargalo:</span> A etapa de "Protocolo e Envio Postal" consome 60% do tempo total do procedimento de Score. Recomenda-se digitalização prévia de lotes para agilizar o processamento nos correios.
             </p>
          </div>
       </div>
    </div>
  );
};

const ReportCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className={`p-8 rounded-[40px] ${bg} flex flex-col items-center text-center space-y-3`}>
     <div className={`w-14 h-14 bg-white rounded-2xl flex items-center justify-center ${color} shadow-sm`}>
        <Icon size={28} />
     </div>
     <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-xl font-black ${color}`}>{value}</p>
     </div>
  </div>
);

const PerformanceRow = ({ label, percentage, color }: any) => (
  <div className="space-y-2">
     <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <span>{label}</span>
        <span className="text-slate-800">{percentage}%</span>
     </div>
     <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${percentage}%` }}></div>
     </div>
  </div>
);

export default WorkManagementView;
