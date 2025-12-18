
// Use named exports for '@firebase/app' to ensure standard modular patterns are recognized.
import { initializeApp, getApps, getApp, FirebaseApp } from '@firebase/app';
import { getFirestore, Firestore } from '@firebase/firestore';

/**
 * CONFIGURAÇÃO REAL DO GOOGLE FIREBASE
 * The API key must be obtained exclusively from the environment variable process.env.API_KEY.
 */
const apiKey = process.env.API_KEY;

// Configuração padrão segura para evitar crash se a API Key não estiver presente no build
const firebaseConfig = {
  apiKey: apiKey || "dummy-key-for-build", // Evita crash inicial
  authDomain: "gen-lang-client-0184846197.firebaseapp.com",
  projectId: "gen-lang-client-0184846197",
  storageBucket: "gen-lang-client-0184846197.firebasestorage.app",
  messagingSenderId: "988489603424",
  appId: "1:988489603424:web:cc8d0b528824eb1d606605",
  measurementId: "G-GE81R3Q8VW"
};

let app: FirebaseApp;
let dbFirestore: Firestore;

try {
  // Singleton: Garante inicialização única e compartilhamento de instância.
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  
  // Se a chave for dummy, avisamos no console mas não travamos a renderização do React
  if (!apiKey || apiKey === "dummy-key-for-build") {
      console.warn("⚠️ AVISO CRÍTICO: API_KEY não encontrada. Configure nas variáveis de ambiente do Vercel.");
  }
  
  dbFirestore = getFirestore(app);
} catch (error) {
  console.error("Erro fatal ao inicializar Firebase:", error);
  // Não re-lançamos o erro para permitir que a UI mostre uma mensagem amigável se necessário
}

export { dbFirestore };
