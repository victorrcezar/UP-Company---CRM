
// Use named exports for '@firebase/app' to ensure standard modular patterns are recognized.
import { initializeApp, getApps, getApp } from '@firebase/app';
import { getFirestore } from '@firebase/firestore';

/**
 * CONFIGURAÇÃO REAL DO GOOGLE FIREBASE
 * The API key must be obtained exclusively from the environment variable process.env.API_KEY.
 */
const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "gen-lang-client-0184846197.firebaseapp.com",
  projectId: "gen-lang-client-0184846197",
  storageBucket: "gen-lang-client-0184846197.firebasestorage.app",
  messagingSenderId: "988489603424",
  appId: "1:988489603424:web:cc8d0b528824eb1d606605",
  measurementId: "G-GE81R3Q8VW"
};

// Singleton: Garante inicialização única e compartilhamento de instância.
// Fixed initialization by using getApps and getApp to handle multiple initializations in dev environments.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Inicializa o Firestore vinculado explicitamente ao app
export const dbFirestore = getFirestore(app);
