
import { GoogleGenAI } from "@google/genai";
import { Cliente, ServicoContratado } from "../../types";

export const getSugestoesUpsell = async (cliente: Cliente, servicos: ServicoContratado[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Cliente: ${cliente.nome} (${cliente.tipo})
    Serviços Atuais: ${servicos.map(s => s.tipo).join(", ")}
    Observações: ${cliente.observacoes}
    
    Com base no perfil deste cliente e nos serviços que ele já contratou, forneça 3 sugestões estratégicas de serviços adicionais.
    Opções: Limpa Nome, Aumento de Score, Rating Bancário, Redução de Parcelas, JusBrasil.
    Formate como uma lista curta e profissional em PORTUGUÊS (BRASIL).
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Você é um consultor sênior de vendas para um ERP de serviços financeiros e recuperação de crédito no Brasil."
      }
    });
    return response.text || "Sem sugestões no momento.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Falha ao carregar sugestões.";
  }
};
