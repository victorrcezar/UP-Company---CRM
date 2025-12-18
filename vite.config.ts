import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente baseadas no modo atual (development/production)
  // O terceiro argumento '' carrega todas as variáveis, não apenas as com prefixo VITE_
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Isso é crucial: Substitui 'process.env.API_KEY' pelo valor real durante o build.
      // Sem isso, o app trava no navegador com "process is not defined".
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  }
})
