
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ChevronRight, Phone, MessageCircle, FileText, 
  CheckCircle2, Clock, Lock, ShieldCheck, Mail, User,
  Calendar, Upload, AlertCircle, ExternalLink, Printer,
  Package, CheckCircle, Info, TrendingUp, X, Filter, MapPin,
  LockOpen, Play, ArrowRight
} from 'lucide-react';
import { 
  Cliente, ServicoContratado, TipoServicoStrict, Documento, StatusServico 
} from '../../types';
import { saveDB, getDB } from '../../db';

const CHECKLIST_STORAGE_KEY = 'service_erp_score_metadata_v2';

// Added proposalsIdentified to the interface to resolve reported errors
interface ScoreMetadata {
  steps: boolean[]; // Array of 7 booleans for the 7 mandatory steps
  serasaPassword?: string;
  serasaContactNumber?: string;
  trackingNumber?: string;
  postingDate?: string;
  confirmationDate?: string;
  proposalsIdentified?: boolean;
}

interface ScoreIncreaseViewProps {
  db: any;
  onSync: () => void;
}

const ScoreIncreaseView: React.FC<ScoreIncreaseViewProps> = ({ db, onSync }) => {
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [checklistData, setChecklistData] = useState<Record<string, ScoreMetadata>>({});

  useEffect(() => {
    const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (saved) setChecklistData(JSON.parse(saved));
  }, []);

  const getStepStatus = (meta: ScoreMetadata) => {
    const checkedCount = (meta.steps || []).filter(Boolean).length;
    const totalSteps = 7;
    const percentage = Math.round((checkedCount / totalSteps) * 100);

    let label = "Não Iniciado";
    let statusEnum = StatusServico.INICIO;

    if (checkedCount === 7) {
      label = "Concluído";
      statusEnum = StatusServico.CONCLUIDO;
    } else if (checkedCount === 6) {
      label = "Aguardando Prazo Postal";
      statusEnum = StatusServico.FASE_FINAL;
    } else if (checkedCount >= 1) {
      label = checkedCount === 1 ? "Processo Iniciado" : "Em Andamento";
      statusEnum = StatusServico.EM_ANDAMENTO;
    }

    return { label, statusEnum, percentage, checkedCount };
  };

  const services = useMemo(() => {
    return (db.servicos || []).filter((s: ServicoContratado) => 
      s.tipo === TipoServicoStrict.SCORE
    ).map((s: ServicoContratado) => {
      const client = db.clientes.find((c: Cliente) => c.id === s.clienteId);
      const metadata = checklistData[s.id] || { steps: new Array(7).fill(false) };
      const { label, statusEnum, percentage } = getStepStatus(metadata);
      
      return { ...s, client, metadata, computedLabel: label, computedStatus: statusEnum, progress: percentage };
    }).filter((s: any) => 
      s.client?.nome.toLowerCase().includes(busca.toLowerCase()) || 
      s.client?.documento.includes(busca)
    );
  }, [db, checklistData, busca]);

  const syncSystem = (serviceId: string, metadata: ScoreMetadata) => {
    // 1. Save local metadata
    const newChecklistData = { ...checklistData, [serviceId]: metadata };
    setChecklistData(newChecklistData);
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(newChecklistData));

    // 2. Sync with global DB
    const { statusEnum, percentage } = getStepStatus(metadata);
    const currentDB = getDB();
    const srvIndex = currentDB.servicos.findIndex(s => s.id === serviceId);
    if (srvIndex !== -1) {
      currentDB.servicos[srvIndex].status = statusEnum;
      currentDB.servicos[srvIndex].progresso = percentage;
      saveDB(currentDB);
      onSync(); // Trigger App refresh
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);

  if (selectedService) {
    return (
      <ScoreWorkspace 
        service={selectedService} 
        onBack={() => setSelectedServiceId(null)}
        onUpdateMetadata={(data) => syncSystem(selectedService.id, data)}
        db={db}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1c1c1e] p-6 rounded-[35px] border border-[#333336] shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Pesquisar cliente no roteiro de Score..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-14 pr-8 py-4 bg-[#0f0f11] border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold transition-all text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-5 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={16} /> Aumento de Score
           </div>
        </div>
      </div>

      <div className="bg-[#1c1c1e] rounded-[40px] border border-[#333336] shadow-sm overflow-hidden">
         <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0f0f11]/50 text-[10px] font-black text-[#98989d] uppercase tracking-widest">
                <th className="px-8 py-6">Cliente / Procedimento</th>
                <th className="px-8 py-6 text-center">Status Automático</th>
                <th className="px-8 py-6 text-center">Progresso Checklist</th>
                <th className="px-8 py-6 text-center">Última Etapa</th>
                <th className="px-8 py-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333336]">
               {services.map((s: any) => {
                 const checkedCount = s.metadata.steps.filter(Boolean).length;
                 return (
                   <tr key={s.id} onClick={() => setSelectedServiceId(s.id)} className="hover:bg-[#0f0f11]/80 transition-all cursor-pointer group">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#0f0f11] rounded-2xl flex items-center justify-center font-black text-[#98989d] group-hover:bg-blue-600 group-hover:text-white transition-all">
                               {s.client?.nome.charAt(0)}
                            </div>
                            <div>
                               <p className="font-black text-white text-sm">{s.client?.nome}</p>
                               <p className="text-[10px] font-bold text-[#98989d] uppercase">{s.client?.documento}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                           s.computedLabel === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                           s.computedLabel === 'Não Iniciado' ? 'bg-[#0f0f11] text-[#98989d] border-[#333336]' :
                           'bg-blue-50 text-blue-600 border-blue-100'
                         }`}>
                           {s.computedLabel}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col items-center gap-2">
                            <div className="w-32 bg-[#0f0f11] h-1.5 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${s.progress}%` }}></div>
                            </div>
                            <p className="text-[9px] font-black text-[#98989d] uppercase tracking-widest">{checkedCount} de 7 etapas</p>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <p className="text-[10px] font-bold text-[#98989d] uppercase">Etapa {checkedCount}</p>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button className="p-3 text-slate-300 hover:text-blue-600 transition-all">
                            <ArrowRight size={20} />
                         </button>
                      </td>
                   </tr>
                 );
               })}
               {services.length === 0 && (
                 <tr>
                    <td colSpan={5} className="px-8 py-32 text-center text-slate-300 font-black uppercase text-xs tracking-[0.4em]">Lista Vazia</td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

const ScoreWorkspace: React.FC<{ service: any, onBack: () => void, onUpdateMetadata: (d: ScoreMetadata) => void, db: any }> = ({ service, onBack, onUpdateMetadata, db }) => {
  const meta = service.metadata as ScoreMetadata;
  const client = service.client;
  const docsSrv = db.documentos.filter((d: Documento) => d.clienteId === client.id);

  const handleWhatsApp = (msg: string) => {
    const fone = client.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const toggleStep = (index: number) => {
    const newSteps = [...meta.steps];
    newSteps[index] = !newSteps[index];
    onUpdateMetadata({ ...meta, steps: newSteps });
  };

  const updateMetaField = (field: keyof ScoreMetadata, value: any) => {
    onUpdateMetadata({ ...meta, [field]: value });
  };

  const isStepDisabled = (index: number) => {
    if (index === 0) return false;
    return !meta.steps[index - 1];
  };

  return (
    <div className="animate-in slide-in-from-right-10 duration-500 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-3 text-[#98989d] hover:text-blue-600 font-black transition-all group">
          <div className="p-2 bg-[#1c1c1e] rounded-xl border border-[#333336] group-hover:bg-blue-50">
            <ChevronRight size={20} className="rotate-180" />
          </div>
          VOLTAR PARA LISTA OPERACIONAL
        </button>
        <div className="flex items-center gap-4">
           <div className="flex flex-col items-end">
              <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest">Status Atual</p>
              <p className="text-sm font-black text-blue-600 uppercase tracking-tight">{service.computedLabel}</p>
           </div>
           <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black shadow-xl">
              {service.progress}%
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Data & Docs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1c1c1e] p-8 rounded-[40px] border border-[#333336] shadow-sm">
             <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-[28px] flex items-center justify-center text-3xl font-black mb-6">
                   {client.nome.charAt(0)}
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">{client.nome}</h2>
                <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest mt-1">{client.documento}</p>
                <div className="mt-6 flex gap-3">
                   <button 
                    onClick={() => handleWhatsApp(`Olá ${client.nome}, estou cuidando do seu procedimento de Score.`)}
                    className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                   >
                     <MessageCircle size={20} />
                   </button>
                   <a href={`tel:${client.telefone}`} className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                     <Phone size={20} />
                   </a>
                </div>
             </div>
             <div className="mt-8 space-y-4 pt-8 border-t border-slate-50">
                <div className="flex items-start gap-3">
                   <MapPin className="text-slate-300 mt-1" size={16} />
                   <p className="text-xs font-bold text-slate-600">{client.endereco}, {client.numero}</p>
                </div>
                <div className="flex items-center gap-3">
                   <Phone className="text-slate-300" size={16} />
                   <p className="text-xs font-bold text-slate-600">{client.telefone}</p>
                </div>
             </div>
          </div>

          <div className="bg-[#1c1c1e] p-8 rounded-[40px] border border-[#333336] shadow-sm">
             <h3 className="text-[10px] font-black text-[#98989d] uppercase tracking-widest mb-6">Repositório de Documentos</h3>
             <div className="space-y-3">
                {docsSrv.map((d: Documento) => (
                  <div key={d.id} className="p-4 bg-[#0f0f11] rounded-2xl flex items-center justify-between group hover:bg-blue-50 transition-all cursor-pointer border border-transparent hover:border-blue-100">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <FileText className="text-blue-500 shrink-0" size={18} />
                       <p className="text-[10px] font-black text-[#e5e5ea] truncate uppercase">{d.nomeArquivo}</p>
                    </div>
                    <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-500" />
                  </div>
                ))}
                {docsSrv.length === 0 && <p className="text-center py-6 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Aguardando anexos...</p>}
             </div>
          </div>
        </div>

        {/* Right Column: The Engine */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#1c1c1e] p-10 rounded-[45px] border border-[#333336] shadow-sm space-y-10">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Play size={22} fill="currentColor" />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white tracking-tight">Fluxo Sequencial de Execução</h3>
                   <p className="text-[10px] font-black text-[#98989d] uppercase tracking-widest mt-1">O preenchimento altera o status global do sistema</p>
                </div>
             </div>

             <div className="space-y-6 relative">
                <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-[#0f0f11] -z-0"></div>

                {/* STEP 1 */}
                <WorkStep 
                  index={0} 
                  title="Credenciais e Serasa Premium" 
                  checked={meta.steps[0]} 
                  disabled={isStepDisabled(0)}
                  onToggle={() => toggleStep(0)}
                >
                  <div className="space-y-4">
                     <p className="text-xs text-[#98989d] font-medium">Verificar se o cliente possui senha do App Serasa e se a assinatura Premium está ativa.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="password" 
                          placeholder="Senha App Serasa" 
                          value={meta.serasaPassword || ''}
                          onChange={(e) => updateMetaField('serasaPassword', e.target.value)}
                          className="px-5 py-3 bg-[#1c1c1e] border border-[#333336] rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button 
                          onClick={() => handleWhatsApp(`Olá ${client.nome}, preciso confirmar sua senha do Serasa e se o plano Premium está ativo para iniciarmos.`)}
                          className="px-6 py-3 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageCircle size={16} /> Solicitar via Whats
                        </button>
                     </div>
                  </div>
                </WorkStep>

                {/* STEP 2 */}
                <WorkStep 
                  index={1} 
                  title="Atualização de Dados Cadastrais" 
                  checked={meta.steps[1]} 
                  disabled={isStepDisabled(1)}
                  onToggle={() => toggleStep(1)}
                >
                  <p className="text-xs text-[#98989d] font-medium">Acessar o App e atualizar manualmente todos os endereços e contatos cadastrados.</p>
                </WorkStep>

                {/* STEP 3 */}
                <WorkStep 
                  index={2} 
                  title="Varredura de Propostas" 
                  checked={meta.steps[2]} 
                  disabled={isStepDisabled(2)}
                  onToggle={() => toggleStep(2)}
                >
                   <div className="space-y-4">
                      <p className="text-xs text-[#98989d] font-medium">Identificar e remover propostas de negociação que possam travar o score.</p>
                      <label className="flex items-center gap-3 cursor-pointer group w-fit">
                        {/* Fix: used proposalsIdentified from the updated ScoreMetadata interface */}
                        <input 
                          type="checkbox" 
                          checked={!!meta.proposalsIdentified}
                          onChange={(e) => updateMetaField('proposalsIdentified', e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-[#333336] text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Propostas Identificadas</span>
                      </label>
                      {/* Fix: added type-safe access to proposalsIdentified */}
                      {meta.proposalsIdentified && (
                        <input 
                          type="text" 
                          placeholder="Número Contato Serasa Usado" 
                          value={meta.serasaContactNumber || ''}
                          onChange={(e) => updateMetaField('serasaContactNumber', e.target.value)}
                          className="w-full px-5 py-3 bg-[#1c1c1e] border border-[#333336] rounded-xl font-bold text-sm outline-none"
                        />
                      )}
                   </div>
                </WorkStep>

                {/* STEP 4 */}
                <WorkStep 
                  index={3} 
                  title="Preparação de Documentos Físicos" 
                  checked={meta.steps[3]} 
                  disabled={isStepDisabled(3)}
                  onToggle={() => toggleStep(3)}
                >
                  <div className="space-y-4">
                     <p className="text-xs text-[#98989d] font-medium">Imprimir CNH/RG e o Termo de Responsabilidade para remoção de consultas.</p>
                     <button className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                        <Printer size={16} /> Imprimir Termo de Responsabilidade
                     </button>
                  </div>
                </WorkStep>

                {/* STEP 5 */}
                <WorkStep 
                  index={4} 
                  title="Validação do Termo Preenchido" 
                  checked={meta.steps[4]} 
                  disabled={isStepDisabled(4)}
                  onToggle={() => toggleStep(4)}
                >
                  <p className="text-xs text-[#98989d] font-medium">Confirmar se o cliente assinou o formulário de exclusão de consultas conforme os prints.</p>
                </WorkStep>

                {/* STEP 6 */}
                <WorkStep 
                  index={5} 
                  title="Protocolo e Envio Postal" 
                  checked={meta.steps[5]} 
                  disabled={isStepDisabled(5)}
                  onToggle={() => toggleStep(5)}
                >
                  <div className="space-y-4">
                     <p className="text-xs text-[#98989d] font-medium">Postar documentos via Correios e inserir código de rastreio para iniciar monitoramento de 10 dias.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                          type="text" 
                          placeholder="Código de Rastreio" 
                          value={meta.trackingNumber || ''}
                          onChange={(e) => updateMetaField('trackingNumber', e.target.value)}
                          className="px-5 py-3 bg-[#1c1c1e] border border-[#333336] rounded-xl font-bold text-sm outline-none"
                        />
                        <input 
                          type="date" 
                          value={meta.postingDate || ''}
                          onChange={(e) => updateMetaField('postingDate', e.target.value)}
                          className="px-5 py-3 bg-[#1c1c1e] border border-[#333336] rounded-xl font-bold text-sm outline-none"
                        />
                     </div>
                     {meta.steps[5] && (
                       <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 animate-pulse">
                          <Clock className="text-amber-500" size={18} />
                          <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest leading-relaxed">Status em Espera: Contagem de 10 dias úteis iniciada automaticamente.</p>
                       </div>
                     )}
                  </div>
                </WorkStep>

                {/* STEP 7 */}
                <WorkStep 
                  index={6} 
                  title="Confirmação de Baixa e Score" 
                  checked={meta.steps[6]} 
                  disabled={isStepDisabled(6)}
                  onToggle={() => toggleStep(6)}
                >
                  <div className="space-y-4">
                     <p className="text-xs text-[#98989d] font-medium">Validar no App do cliente se as consultas foram removidas e o score subiu para o patamar acordado.</p>
                     <input 
                        type="date" 
                        value={meta.confirmationDate || ''}
                        onChange={(e) => updateMetaField('confirmationDate', e.target.value)}
                        className="w-full md:w-auto px-5 py-3 bg-[#1c1c1e] border border-[#333336] rounded-xl font-bold text-sm outline-none"
                      />
                  </div>
                </WorkStep>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkStep = ({ index, title, children, checked, disabled, onToggle }: any) => (
  <div className={`flex gap-6 relative z-10 transition-all duration-300 ${disabled ? 'opacity-25 grayscale' : 'opacity-100'}`}>
     <div 
      onClick={!disabled ? onToggle : undefined}
      className={`w-12 h-12 rounded-[18px] flex items-center justify-center cursor-pointer transition-all border-4 ${
        checked ? 'bg-emerald-500 border-emerald-100 text-white shadow-lg' : 
        disabled ? 'bg-[#0f0f11] border-slate-50 text-slate-300' : 'bg-[#1c1c1e] border-blue-100 text-blue-600 hover:scale-105'
      }`}
     >
        {checked ? <CheckCircle size={24} /> : <span className="text-sm font-black">{index + 1}</span>}
     </div>
     <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
           <h4 className="text-base font-black text-white tracking-tight uppercase">{title}</h4>
           {checked && <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={12}/> Etapa Validada</span>}
        </div>
        <div className="bg-[#0f0f11]/50 p-6 rounded-3xl border border-slate-50">
           {children}
        </div>
     </div>
  </div>
);

export default ScoreIncreaseView;
