import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente (como a GEMINI_API_KEY)
  const env = loadEnv(mode, '.', '');

  return {
    // Mantemos os dois plugins: React e TailwindCSS (necessário para as classes de layout flex, grid, p-4, etc)
    plugins: [
      react(), 
      tailwindcss()
    ],
    
    server: {
      // Configurações do ERP
      port: 3000,
      host: '0.0.0.0',
      // Configuração do CRM (HMR)
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    
    define: {
      // Injetamos as chaves de API de ambos os projetos para não quebrar nenhuma chamada
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    
    resolve: {
      alias: {
        // Alias '@' mantido para importar ficheiros a partir da raiz
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});