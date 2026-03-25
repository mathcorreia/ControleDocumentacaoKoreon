
import React, { useState } from 'react';
import { 
  Search, Plus, Filter, MoreHorizontal, Mail, Phone, 
  ChevronRight, MapPin, Calendar, FileText, ExternalLink, 
  Zap, Info, Clock, DollarSign, Briefcase
} from 'lucide-react';
/* Fix imports: updated types to match definitions in types.ts */
import { Cliente as Client, TipoPessoa as PersonType, ServicoContratado as ContractedService, Pagamento as Payment, Documento as Document, StatusPagamento as PaymentStatus } from '../types';
/* Fix import: renamed getUpsellSuggestions to getSugestoesUpsell as defined in aiService.ts */
import { getSugestoesUpsell as getUpsellSuggestions } from '../services/aiService';

interface ClientsViewProps {
  db: any;
  setDb: (db: any) => void;
}

const ClientsView: React.FC<ClientsViewProps> = ({ db, setDb }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);

  /* Fix properties: changed c.taxId to c.documento and db.clients to db.clientes */
  const filteredClients = (db.clientes || []).filter((c: Client) => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.documento.includes(searchTerm)
  );

  const handleOpenProfile = (client: Client) => {
    setSelectedClient(client);
    setAiSuggestions(null);
  };

  const fetchAiSuggestions = async (client: Client) => {
    setIsAiLoading(true);
    /* Fix property: db.services to db.servicos */
    const clientServices = (db.servicos || []).filter((s: ContractedService) => s.clienteId === client.id);
    const suggestions = await getUpsellSuggestions(client, clientServices);
    setAiSuggestions(suggestions);
    setIsAiLoading(false);
  };

  if (selectedClient) {
    /* Fix properties: db.services to db.servicos, db.payments to db.pagamentos, db.documents to db.documentos */
    const clientServices = (db.servicos || []).filter((s: ContractedService) => s.clienteId === selectedClient.id);
    const clientPayments = (db.pagamentos || []).filter((p: Payment) => p.clienteId === selectedClient.id);
    const clientDocs = (db.documentos || []).filter((d: Document) => d.clienteId === selectedClient.id);

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="mb-6 flex items-center justify-between">
          <button 
            onClick={() => setSelectedClient(null)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium"
          >
            <ChevronRight size={20} className="rotate-180" /> Back to List
          </button>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50">
              Edit Profile
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700">
              <Plus size={18} /> New Service
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Client 360 Header */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-3xl font-bold mb-4">
                  {selectedClient.nome.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{selectedClient.nome}</h2>
                {/* Fix property: taxId to documento */}
                <p className="text-sm text-gray-500 mb-6">{selectedClient.tipo} • {selectedClient.documento}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full border-t border-gray-50 pt-6">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Services</p>
                    <p className="text-lg font-bold text-gray-800">{clientServices.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Payments</p>
                    {/* Fix enum: PaymentStatus.PAID to PaymentStatus.PAGO */}
                    <p className="text-lg font-bold text-gray-800">{clientPayments.filter((p: any) => p.status === PaymentStatus.PAGO).length}/{clientPayments.length}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-gray-400 shrink-0 mt-1" size={18} />
                  <p className="text-sm text-gray-600 leading-relaxed">{selectedClient.endereco}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="text-gray-400" size={18} />
                  <p className="text-sm text-gray-600">{selectedClient.telefone}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="text-gray-400" size={18} />
                  <p className="text-sm text-gray-600">{selectedClient.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="text-gray-400" size={18} />
                  {/* Fix property: registrationDate to dataCadastro */}
                  <p className="text-sm text-gray-600">Joined {selectedClient.dataCadastro}</p>
                </div>
              </div>
            </div>

            {/* AI Suggestions Box */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap size={80} />
              </div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Zap size={20} className="text-yellow-400" />
                AI Smart Suggestions
              </h3>
              {aiSuggestions ? (
                <div className="text-sm text-slate-300 leading-relaxed prose prose-invert">
                  {aiSuggestions.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              ) : (
                <button 
                  onClick={() => fetchAiSuggestions(selectedClient)}
                  disabled={isAiLoading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isAiLoading ? "Analyzing..." : "Generate Opportunities"}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Detailed Tracking */}
          <div className="lg:col-span-2 space-y-8">
            {/* Services Progress */}
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-blue-500" /> Contracted Services
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientServices.map(service => (
                  <div key={service.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between mb-3">
                      {/* // FIX: Changed service.type to service.tipo to match ServicoContratado interface */}
                      <span className="font-bold text-gray-800">{service.tipo}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        service.status === 'Atrasado' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        {/* Fix property: progress to progresso */}
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${service.progresso}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs font-medium text-gray-500">
                        {/* Fix property: progress to progresso, deadline to prazoAcordado */}
                        <span>{service.progresso}% Complete</span>
                        <span>Due: {service.prazoAcordado}</span>
                      </div>
                      <p className="text-xs text-gray-500 italic border-t border-gray-50 pt-2">
                        {/* Fix property: technicalNotes to obsTecnicas */}
                        "{service.obsTecnicas}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Financial Tracking */}
            <section>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-emerald-500" /> Financial Overview
              </h3>
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                      <th className="px-6 py-3">Installment</th>
                      <th className="px-6 py-3">Value</th>
                      <th className="px-6 py-3">Due Date</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {clientPayments.map(payment => (
                      <tr key={payment.id}>
                        {/* Fix properties: numParcela, qtdParcelas, valorParcela, dataVencimento */}
                        <td className="px-6 py-4"># {payment.numParcela} / {payment.qtdParcelas}</td>
                        <td className="px-6 py-4 font-semibold">${payment.valorParcela.toFixed(2)}</td>
                        <td className="px-6 py-4">{payment.dataVencimento}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            payment.status === 'Pago' ? 'bg-green-50 text-green-600' : 
                            payment.status === 'Atrasado' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

             {/* Documents */}
             <section>
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-indigo-500" /> Document Repository
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {clientDocs.map(doc => (
                  <div key={doc.id} className="p-4 bg-white border border-gray-100 rounded-xl flex items-center gap-3 group hover:border-blue-200 transition-all cursor-pointer">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      {/* // FIX: Changed doc.type to doc.tipo to match the Documento interface definition in types.ts */}
                      <p className="text-sm font-bold text-gray-800 truncate">{doc.tipo}</p>
                      {/* Fix property: dataUpload */}
                      <p className="text-[10px] text-gray-400">{doc.dataUpload}</p>
                    </div>
                    <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-500 ml-auto" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or tax ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl w-full md:w-96 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium flex items-center gap-2 hover:bg-gray-50 shadow-sm transition-all">
            <Filter size={18} /> Filters
          </button>
          <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
            <Plus size={20} /> New Client
          </button>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client: Client) => (
          <div 
            key={client.id} 
            onClick={() => handleOpenProfile(client)}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                {client.nome.charAt(0)}
              </div>
              <button className="text-gray-400 hover:text-gray-600 p-1">
                <MoreHorizontal size={20} />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">{client.nome}</h3>
            {/* Fix property: taxId to documento */}
            <p className="text-xs text-gray-400 font-medium mb-4">{client.documento}</p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={14} /> {client.telefone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail size={14} className="shrink-0" /> <span className="truncate">{client.email}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-50 pt-4">
              <div className="flex -space-x-2">
                {[1,2].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase ring-1 ring-gray-100">
                    S{i}
                  </div>
                ))}
              </div>
              <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                View 360 <ChevronRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientsView;
