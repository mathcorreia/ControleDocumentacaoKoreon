import React, { useEffect, useState } from 'react';
import { 
  Shield, History, Database, Download, 
  CheckCircle, AlertCircle, Info, Clock, User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils/utils';

interface SystemLog {
  id: string;
  type: string;
  description: string;
  user: string | null;
  data: string | null;
  createdAt: string;
}

interface SystemUpdate {
  id: string;
  version: string;
  description: string;
  appliedAt: string;
}

export function SystemView() {
  const [status, setStatus] = useState<{ version: string, updates: SystemUpdate[], logs: SystemLog[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch('/api/system/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Backup realizado com sucesso!\nSalvo em: ${data.path}`);
        fetchStatus();
      } else {
        alert('Erro ao realizar backup.');
      }
    } catch (error) {
      alert('Erro de conexão ao realizar backup.');
    } finally {
      setBackingUp(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Carregando informações do sistema...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
          <p className="text-slate-500 text-sm">Gerenciamento de persistência, logs e backups</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackup}
            disabled={backingUp}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium",
              backingUp && "opacity-50 cursor-not-allowed"
            )}
          >
            <Database size={18} />
            {backingUp ? 'Realizando Backup...' : 'Realizar Backup Agora'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Version Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Shield size={20} />
              </div>
              <h3 className="font-bold">Status de Integridade</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-600">Versão Atual</span>
                <span className="font-mono font-bold text-indigo-600">v{status?.version}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-600">Banco de Dados</span>
                <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                  <CheckCircle size={14} /> Conectado
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-600">Persistência</span>
                <span className="text-slate-800 font-bold text-sm">SQLite (Local)</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <History size={20} />
              </div>
              <h3 className="font-bold">Histórico de Atualizações</h3>
            </div>
            <div className="space-y-4">
              {status?.updates.map((update) => (
                <div key={update.id} className="border-l-2 border-slate-100 pl-4 py-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold">v{update.version}</span>
                    <span className="text-[10px] text-slate-400">
                      {format(new Date(update.appliedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{update.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Logs */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                  <Clock size={20} />
                </div>
                <h3 className="font-bold">Logs de Atividade do Sistema</h3>
              </div>
              <button 
                onClick={fetchStatus}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Atualizar Logs
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {status?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                          log.type === 'audit' ? "bg-indigo-50 text-indigo-600" :
                          log.type === 'error' ? "bg-rose-50 text-rose-600" :
                          log.type === 'warning' ? "bg-amber-50 text-amber-600" :
                          "bg-slate-50 text-slate-600"
                        )}>
                          {log.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{log.description}</p>
                        {log.data && (
                          <pre className="mt-2 text-[10px] bg-slate-50 p-2 rounded border border-slate-100 text-slate-500 overflow-x-auto max-w-md">
                            {log.data}
                          </pre>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <User size={12} />
                          </div>
                          <span className="text-xs text-slate-600">{log.user || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                  {status?.logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">
                        Nenhum log registrado ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
