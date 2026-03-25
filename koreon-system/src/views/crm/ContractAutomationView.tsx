import React, { useState, useRef } from 'react';
import { FileText, Upload, Download, CheckCircle2, AlertCircle, Loader2, FileCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { GoogleGenAI, Type } from "@google/genai";
import html2pdf from 'html2pdf.js';
import { cn, formatCurrency } from '../../utils/utils';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface ExtractedData {
  nome_contratante: string;
  cpf_contratante: string;
  endereco_contratante: string;
  cep_contratante: string;
  tipo_servico: string;
  data_conclusao: string;
}

interface ManualData {
  servico_especifico: string;
  valor_numerico: string;
  valor_extenso: string;
  forma_pagamento: string;
  data_assinatura: string;
}

export default function ContractAutomationView() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    nome_contratante: '',
    cpf_contratante: '',
    endereco_contratante: '',
    cep_contratante: '',
    tipo_servico: '',
    data_conclusao: '',
  });
  const [manualData, setManualData] = useState<ManualData>({
    servico_especifico: 'Limpeza de Nome e Restauração de Score',
    valor_numerico: '',
    valor_extenso: '',
    forma_pagamento: 'PIX',
    data_assinatura: new Date().toLocaleDateString('pt-BR'),
  });
  const [automationReport, setAutomationReport] = useState<{ field: string; status: 'auto' | 'manual' }[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    }
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1];
        resolve(base64 || '');
      };
      reader.onerror = error => reject(error);
    });
  };

  const processDocuments = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      const parts = await Promise.all(files.map(async (file) => {
        const base64 = await fileToBase64(file);
        return {
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        };
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              ...parts,
              {
                text: `Extract the following information from these documents (RG, CNH, or Proof of Address) for a contract:
                - Full Name (Nome completo)
                - CPF
                - Full Address (Endereço completo)
                - CEP
                - Service Type (Identify if it's: limpa nome, aumento de score, aumento de rating Bancario, jus brasil, or redução de parcelas)
                - Estimated Completion Date (Data de conclusão - based on current date + 15 days if not found)
                
                Return the data in JSON format with these keys: nome_contratante, cpf_contratante, endereco_contratante, cep_contratante, tipo_servico, data_conclusao.
                If a field is not found, leave it as an empty string.
                Be precise and only return the JSON.`
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nome_contratante: { type: Type.STRING },
              cpf_contratante: { type: Type.STRING },
              endereco_contratante: { type: Type.STRING },
              cep_contratante: { type: Type.STRING },
              tipo_servico: { type: Type.STRING },
              data_conclusao: { type: Type.STRING },
            },
            required: ["nome_contratante", "cpf_contratante", "endereco_contratante", "cep_contratante", "tipo_servico", "data_conclusao"]
          }
        }
      });

      const data = JSON.parse(response.text || '{}');
      setExtractedData(data);

      const report = [
        { field: 'Nome', status: data.nome_contratante ? 'auto' : 'manual' },
        { field: 'CPF', status: data.cpf_contratante ? 'auto' : 'manual' },
        { field: 'Endereço', status: data.endereco_contratante ? 'auto' : 'manual' },
        { field: 'CEP', status: data.cep_contratante ? 'auto' : 'manual' },
        { field: 'Serviço', status: data.tipo_servico ? 'auto' : 'manual' },
        { field: 'Conclusão', status: data.data_conclusao ? 'auto' : 'manual' },
      ];
      setAutomationReport(report as any);
      setShowPreview(true);
    } catch (error) {
      console.error("Error processing documents:", error);
      alert("Erro ao processar documentos. Verifique sua chave de API ou os arquivos enviados.");
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizeContract = async () => {
    setIsProcessing(true);
    try {
      // Create a payload similar to UploadView's extractedData
      const payload = {
        nome: extractedData.nome_contratante,
        cpf: extractedData.cpf_contratante,
        telefone: '', // Not extracted in this view yet
        valor_contrato: Number(manualData.valor_numerico.replace(',', '.')),
        entrada: 0,
        parcelas: 1,
        valor_parcela: Number(manualData.valor_numerico.replace(',', '.')),
        datas_pagamento: [new Date().toISOString().split('T')[0]],
        tipo_servico: extractedData.tipo_servico,
        data_conclusao: extractedData.data_conclusao,
        data_contrato: new Date().toISOString().split('T')[0]
      };

      await fetch('/api/contracts/automated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData: payload, referrerId: '' })
      });

      alert("Contrato finalizado e serviço agendado com sucesso!");
      setShowPreview(false);
      setFiles([]);
    } catch (error) {
      console.error("Error finalizing contract:", error);
      alert("Erro ao finalizar contrato.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = () => {
    if (!contractRef.current) return;

    const element = contractRef.current;
    const opt = {
      margin: 10,
      filename: `Contrato_${extractedData.nome_contratante || 'Cliente'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().from(element).set(opt).save();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Automação de Contratos</h2>
          <p className="text-[#98989d] text-sm">Envie documentos para preenchimento automático do contrato.</p>
        </div>
        <div className="flex gap-3">
          {showPreview && (
            <>
              <button
                onClick={finalizeContract}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <CheckCircle2 size={18} />
                Finalizar e Agendar
              </button>
              <button
                onClick={generatePDF}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <Download size={18} />
                Gerar PDF Final
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload and Form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Section */}
          <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Upload size={18} className="text-indigo-600" />
              Upload de Documentos
            </h3>
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                isDragActive ? "border-indigo-500 bg-indigo-50" : "border-[#333336] hover:border-indigo-400"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-3">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-[#e5e5ea]">Arraste RG, CNH ou Comprovante</p>
                <p className="text-xs text-[#98989d] mt-1">PDF, JPG ou PNG</p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-[#0f0f11] rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText size={14} className="text-[#98989d]" />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <button 
                      onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                ))}
                <button
                  onClick={processDocuments}
                  disabled={isProcessing}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processando OCR...
                    </>
                  ) : (
                    <>
                      <FileCheck size={18} />
                      Extrair Dados
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Manual Data Form */}
          <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Info size={18} className="text-indigo-600" />
              Dados Adicionais
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#98989d] uppercase mb-1 block">Serviço</label>
                <input 
                  type="text" 
                  value={manualData.servico_especifico}
                  onChange={(e) => setManualData({...manualData, servico_especifico: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0f0f11] border border-[#333336] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#98989d] uppercase mb-1 block">Valor (R$)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 1500,00"
                    value={manualData.valor_numerico}
                    onChange={(e) => setManualData({...manualData, valor_numerico: e.target.value})}
                    className="w-full px-4 py-2 bg-[#0f0f11] border border-[#333336] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#98989d] uppercase mb-1 block">Data</label>
                  <input 
                    type="text" 
                    value={manualData.data_assinatura}
                    onChange={(e) => setManualData({...manualData, data_assinatura: e.target.value})}
                    className="w-full px-4 py-2 bg-[#0f0f11] border border-[#333336] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-[#98989d] uppercase mb-1 block">Valor por Extenso</label>
                <input 
                  type="text" 
                  placeholder="Ex: Um mil e quinhentos reais"
                  value={manualData.valor_extenso}
                  onChange={(e) => setManualData({...manualData, valor_extenso: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0f0f11] border border-[#333336] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#98989d] uppercase mb-1 block">Forma de Pagamento</label>
                <input 
                  type="text" 
                  value={manualData.forma_pagamento}
                  onChange={(e) => setManualData({...manualData, forma_pagamento: e.target.value})}
                  className="w-full px-4 py-2 bg-[#0f0f11] border border-[#333336] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {/* Automation Report */}
          {automationReport.length > 0 && (
            <div className="bg-[#1c1c1e] p-6 rounded-2xl border border-[#333336] shadow-sm">
              <h3 className="font-bold text-white mb-4">Relatório de Automação</h3>
              <div className="space-y-3">
                {automationReport.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.field}</span>
                    {item.status === 'auto' ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <CheckCircle2 size={14} />
                        Automático
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <AlertCircle size={14} />
                        Manual
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2">
          <div className="bg-[#1c1c1e] rounded-2xl border border-[#333336] shadow-lg overflow-hidden flex flex-col h-[800px]">
            <div className="p-4 bg-[#0f0f11] border-b border-[#333336] flex items-center justify-between">
              <span className="text-xs font-bold text-[#98989d] uppercase tracking-widest">Visualização do Contrato</span>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-[#0f0f11]">
              <div 
                ref={contractRef}
                className="bg-[#1c1c1e] shadow-2xl mx-auto p-12 text-white font-serif leading-relaxed text-sm"
                style={{ width: '210mm', minHeight: '297mm', fontFamily: "'Montserrat', sans-serif" }}
              >
                {/* Contract Content Start */}
                <div className="text-center mb-10">
                  <div className="text-3xl font-extrabold uppercase tracking-widest mb-2">
                    GRU <span className="text-[#D4AF37]">PO ITT</span>
                  </div>
                  <h1 className="text-xl font-bold uppercase border-b-2 border-[#D4AF37] pb-4 mb-8">
                    CONTRATO DE PRESTAÇÃO DE SERVIÇO
                  </h1>
                </div>

                <h2 className="text-base font-bold uppercase border-l-4 border-[#D4AF37] pl-3 mb-6">
                  IDENTIFICAÇÃO DAS PARTES
                </h2>

                <div className="mb-8">
                  <p className="font-bold mb-3">CONTRATANTE:</p>
                  <div className="space-y-2">
                    <div className="flex border-b border-slate-900 pb-1">
                      <span className="font-bold mr-2">Nome:</span>
                      <input 
                        type="text" 
                        className="flex-1 bg-transparent border-none outline-none"
                        value={extractedData.nome_contratante}
                        onChange={(e) => setExtractedData({...extractedData, nome_contratante: e.target.value})}
                      />
                    </div>
                    <div className="flex border-b border-slate-900 pb-1">
                      <span className="font-bold mr-2">CPF:</span>
                      <input 
                        type="text" 
                        className="flex-1 bg-transparent border-none outline-none"
                        value={extractedData.cpf_contratante}
                        onChange={(e) => setExtractedData({...extractedData, cpf_contratante: e.target.value})}
                      />
                    </div>
                    <div className="flex border-b border-slate-900 pb-1">
                      <span className="font-bold mr-2">Endereço:</span>
                      <input 
                        type="text" 
                        className="flex-1 bg-transparent border-none outline-none"
                        value={extractedData.endereco_contratante}
                        onChange={(e) => setExtractedData({...extractedData, endereco_contratante: e.target.value})}
                      />
                    </div>
                    <div className="flex border-b border-slate-900 pb-1 w-1/2">
                      <span className="font-bold mr-2">CEP:</span>
                      <input 
                        type="text" 
                        className="flex-1 bg-transparent border-none outline-none"
                        value={extractedData.cep_contratante}
                        onChange={(e) => setExtractedData({...extractedData, cep_contratante: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <p className="font-bold mb-3">CONTRATADA:</p>
                  <p><span className="font-bold">Razão Social:</span> TW.CONSULTORIA</p>
                  <p><span className="font-bold">CNPJ:</span> 13.959.686/0001-94</p>
                  <p><span className="font-bold">Endereço:</span> Rua Visconde do Rio Branco, 301, 3º andar, sala 305 A</p>
                  <p className="mt-4 text-justify">
                    As partes acima identificadas celebram o presente Contrato de Prestação de Serviços, mediante as cláusulas e condições abaixo:
                  </p>
                </div>

                <h2 className="text-base font-bold uppercase border-l-4 border-[#D4AF37] pl-3 mb-4">
                  CLÁUSULA 1 - DO OBJETO
                </h2>
                <p className="text-justify mb-6">
                  1.1. O presente contrato tem como objeto a prestação de serviços de 
                  <span className="border-b border-slate-900 px-2 font-bold">{manualData.servico_especifico}</span>, 
                  consistindo na atualização, contestação e solicitação de exclusão de registros e negativações de dados pessoais do CONTRATANTE junto aos órgãos de proteção ao crédito (Serasa, Boa Vista, SPC e cartórios de protesto).
                </p>

                <h2 className="text-base font-bold uppercase border-l-4 border-[#D4AF37] pl-3 mb-4">
                  CLÁUSULA 2 – DAS OBRIGAÇÕES DA CONTRATADA
                </h2>
                <p className="text-justify mb-2">2.1. São obrigações da CONTRATADA:</p>
                <div className="pl-6 space-y-1 mb-6">
                  <p>a) Realizar diagnóstico da situação cadastral do CONTRATANTE;</p>
                  <p>b) Identificar e adotar medidas legais e administrativas cabíveis;</p>
                  <p>c) Protocolar solicitações e realizar contestações junto aos órgãos e instituições responsáveis;</p>
                  <p>d) Manter o CONTRATANTE informado sobre o andamento do processo, quando solicitado.</p>
                </div>

                <h2 className="text-base font-bold uppercase border-l-4 border-[#D4AF37] pl-3 mb-4">
                  CLÁUSULA 3 - DAS OBRIGAÇÕES DO CONTRATANTE
                </h2>
                <p className="text-justify mb-2">3.1. São obrigações do CONTRATANTE:</p>
                <div className="pl-6 space-y-1 mb-6">
                  <p>a) Fornecer todos os documentos e informações necessárias;</p>
                  <p>b) Realizar o pagamento conforme Cláusula 4;</p>
                  <p>c) Não omitir informações relevantes ao processo;</p>
                  <p>d) Responder prontamente aos contatos da CONTRATADA.</p>
                </div>

                <h2 className="text-base font-bold uppercase border-l-4 border-[#D4AF37] pl-3 mb-4">
                  CLÁUSULA 4 – DO PRAZO
                </h2>
                <p className="text-justify mb-6">
                  4.1. O prazo para execução dos serviços será de 10 (dez) a 15 (quinze) dias úteis, contados a partir da entrega integral da documentação pelo CONTRATANTE.
                  <br />
                  4.2. O prazo poderá ser prorrogado em casos de força maior, exigências legais ou atrasos por parte de terceiros.
                </p>

                <h2 className="text-base font-bold uppercase border-l-4 border-[#D4AF37] pl-3 mb-4">
                  CLÁUSULA 5 – DO PREÇO E DA FORMA DE PAGAMENTO
                </h2>
                <p className="text-justify mb-6">
                  5.1. Pela prestação dos serviços, o CONTRATANTE pagará à CONTRATADA o valor total de R$ 
                  <span className="border-b border-slate-900 px-2 font-bold">{manualData.valor_numerico}</span> 
                  (<span className="border-b border-slate-900 px-2 font-bold">{manualData.valor_extenso}</span>).
                  <br />
                  5.2. O pagamento poderá ser realizado via {manualData.forma_pagamento}, transferência bancária, boleto ou outro meio previamente acordado.
                  <br />
                  5.3. O não pagamento nas datas estipuladas implicará na suspensão imediata dos serviços, que somente serão retomados após regularização integral do débito.
                </p>

                <h2 className="text-base font-bold uppercase border-l-4 border-[#D4AF37] pl-3 mb-4">
                  CLÁUSULA 13 - DO FORO
                </h2>
                <p className="text-justify mb-10">
                  13.1. Fica eleito o foro da comarca de Campinas/SP para dirimir quaisquer controvérsias.
                </p>

                <div className="mt-20 flex flex-col items-center">
                  <p className="mb-10">Campinas/SP, <span className="border-b border-slate-900 px-4">{manualData.data_assinatura}</span>.</p>
                  <div className="w-80 border-t border-slate-900 mt-10 mb-2"></div>
                  <p className="font-bold">CONTRATANTE</p>
                  <p className="mt-4">Assinatura: ________________________________</p>
                </div>
                {/* Contract Content End */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
