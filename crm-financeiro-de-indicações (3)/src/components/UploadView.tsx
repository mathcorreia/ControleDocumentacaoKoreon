import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, ArrowRight, User, Hash, Phone, DollarSign, Calendar, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../utils/utils';
import { GoogleGenAI, Type } from "@google/genai";

interface UploadViewProps {
  onComplete: () => void;
}

export default function UploadView({ onComplete }: UploadViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'extracting' | 'reviewing' | 'saving' | 'success'>('idle');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [referrerId, setReferrerId] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/clients').then(res => res.json()).then(setClients);
    fetch('/api/affiliates').then(res => res.json()).then(setAffiliates);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    multiple: false
  });

  const handleProcess = async () => {
    if (!preview) return;
    setStatus('extracting');

    try {
      console.log("[IA] Iniciando extração do contrato...");
      const base64 = preview.split(',')[1];
      const mimeType = file?.type || 'image/png';
      console.log(`[IA] MIME Type: ${mimeType}, Base64 length: ${base64.length}`);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("[IA] GEMINI_API_KEY não encontrada!");
        throw new Error("API Key não configurada");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      console.log("[IA] Enviando para o modelo gemini-3-flash-preview...");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Analise este documento (contrato ou extrato) e extraia os dados para o sistema financeiro. Identifique o nome do cliente, CPF, telefone, valor total do contrato, valor da entrada, número de parcelas, valor de cada parcela e as datas de vencimento. É CRÍTICO extrair o tipo de serviço (Limpa Nome, Aumento de Score, Rating Bancário, Jus Brasil, Redução de Parcelas) e a data de conclusão estimada. Retorne os dados no formato JSON especificado." },
              { inlineData: { data: base64, mimeType } }
            ]
          }
        ],
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              cpf: { type: Type.STRING },
              telefone: { type: Type.STRING },
              data_contrato: { type: Type.STRING, description: "Data de assinatura ou emissão no formato YYYY-MM-DD" },
              valor_contrato: { type: Type.NUMBER },
              entrada: { type: Type.NUMBER },
              parcelas: { type: Type.NUMBER },
              valor_parcela: { type: Type.NUMBER },
              datas_pagamento: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Datas no formato YYYY-MM-DD"
              },
              tipo_servico: { type: Type.STRING, description: "Tipo de serviço identificado" },
              data_conclusao: { type: Type.STRING, description: "Data de conclusão estimada no formato YYYY-MM-DD" }
            },
            required: ["nome", "cpf", "valor_contrato", "parcelas", "tipo_servico", "data_conclusao"]
          }
        }
      });

      console.log("[IA] Resposta recebida:", response.text);
      const data = JSON.parse(response.text || "{}");
      setExtractedData(data);
      setStatus('reviewing');
    } catch (error) {
      console.error("[IA] Erro na extração:", error);
      setStatus('idle');
      alert(`Erro ao processar contrato: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleSave = async () => {
    setStatus('saving');
    try {
      await fetch('/api/contracts/automated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractedData, referrerId, contractUrl: preview })
      });
      setStatus('success');
      setTimeout(onComplete, 2000);
    } catch (error) {
      console.error(error);
      setStatus('reviewing');
      alert('Erro ao salvar dados.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-2xl font-bold">Contrato Processado!</h2>
        <p className="text-slate-500">Cliente, contrato e parcelas criados com sucesso.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Upload de Contrato</h2>
        <p className="text-slate-500">Arraste o contrato (PDF ou Imagem) para extração automática via IA.</p>
      </div>

      {status === 'idle' && (
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer flex flex-col items-center justify-center space-y-4",
            isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">{file ? file.name : "Clique ou arraste o arquivo aqui"}</p>
            <p className="text-sm text-slate-400">Suporta PDF, JPG, PNG até 10MB</p>
          </div>
          {file && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleProcess(); }}
              className="mt-4 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              Processar com IA
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      )}

      {status === 'extracting' && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <div className="text-center">
            <h3 className="text-xl font-bold">Analisando Contrato...</h3>
            <p className="text-slate-500">Nossa IA está extraindo os dados do documento.</p>
          </div>
        </div>
      )}

      {status === 'reviewing' && extractedData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              Dados Extraídos
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Data do Contrato</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar size={14} className="text-slate-400" />
                    <input 
                      type="date"
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.data_contrato || ''} 
                      onChange={e => setExtractedData({...extractedData, data_contrato: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Nome do Cliente</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <User size={14} className="text-slate-400" />
                    <input 
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.nome || ''} 
                      onChange={e => setExtractedData({...extractedData, nome: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">CPF</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <Hash size={14} className="text-slate-400" />
                    <input 
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.cpf || ''} 
                      onChange={e => setExtractedData({...extractedData, cpf: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Telefone</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <Phone size={14} className="text-slate-400" />
                    <input 
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.telefone || ''} 
                      onChange={e => setExtractedData({...extractedData, telefone: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Valor Total</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <DollarSign size={14} className="text-slate-400" />
                    <input 
                      type="number"
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.valor_contrato ?? ''} 
                      onChange={e => setExtractedData({...extractedData, valor_contrato: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Entrada</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <DollarSign size={14} className="text-slate-400" />
                    <input 
                      type="number"
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.entrada ?? ''} 
                      onChange={e => setExtractedData({...extractedData, entrada: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Parcelas</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar size={14} className="text-slate-400" />
                    <input 
                      type="number"
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.parcelas ?? ''} 
                      onChange={e => setExtractedData({...extractedData, parcelas: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Valor da Parcela</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <DollarSign size={14} className="text-slate-400" />
                    <input 
                      type="number"
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.valor_parcela ?? ''} 
                      onChange={e => setExtractedData({...extractedData, valor_parcela: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Tipo de Serviço</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <Settings size={14} className="text-slate-400" />
                    <select 
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.tipo_servico || ''} 
                      onChange={e => setExtractedData({...extractedData, tipo_servico: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      <option value="Limpa Nome">Limpa Nome</option>
                      <option value="Aumento de Score">Aumento de Score</option>
                      <option value="Aumento de Rating Bancário">Aumento de Rating Bancário</option>
                      <option value="Jus Brasil">Jus Brasil</option>
                      <option value="Redução de Parcelas">Redução de Parcelas</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 uppercase font-bold">Data de Conclusão</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <Calendar size={14} className="text-slate-400" />
                    <input 
                      type="date"
                      className="bg-transparent text-sm font-medium w-full focus:outline-none" 
                      value={extractedData.data_conclusao || ''} 
                      onChange={e => setExtractedData({...extractedData, data_conclusao: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-slate-100">
                <label className="text-xs text-slate-400 uppercase font-bold">Quem indicou?</label>
                <select 
                  className="w-full p-2 bg-slate-50 rounded-lg border border-slate-100 text-sm focus:outline-none"
                  value={referrerId}
                  onChange={e => setReferrerId(e.target.value)}
                >
                  <option value="">Sem indicação</option>
                  <optgroup label="Afiliados">
                    {affiliates.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (Comissão: 10%)</option>
                    ))}
                  </optgroup>
                  <optgroup label="Clientes">
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.cpf})</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={(status as string) === 'saving'}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              {(status as string) === 'saving' ? <Loader2 className="animate-spin" size={20} /> : "Confirmar e Salvar"}
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">Visualização do Documento</h3>
            <div className="bg-slate-200 rounded-2xl overflow-hidden aspect-[3/4] relative border border-slate-300">
              {preview && <img src={preview} className="w-full h-full object-contain" alt="Contrato" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
