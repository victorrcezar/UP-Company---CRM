
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo atual (development/production)
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // O '|| ""' é vital aqui. Se env.API_KEY for undefined, o JSON.stringify falha ou gera token inválido
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
    }
  }
})
