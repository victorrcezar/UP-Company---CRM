
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- CONFIGURAÇÃO DO FIREBASE (DADOS REAIS) ---
const firebaseConfig = {
  apiKey: "AIzaSyB9ZrQOAyo_JCotqAKjDjoO8-OQEZIewso",
  authDomain: "gen-lang-client-0184846197.firebaseapp.com",
  projectId: "gen-lang-client-0184846197",
  storageBucket: "gen-lang-client-0184846197.firebasestorage.app",
  messagingSenderId: "988489603424",
  appId: "1:988489603424:web:cc8d0b528824eb1d606605",
  measurementId: "G-GE81R3Q8VW"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Autenticação e Banco de Dados
const auth = getAuth(app);
const dbFirestore = getFirestore(app);

// Promessa que resolve quando o usuário conecta OU se a conexão falhar (fallback para modo público)
const authPromise = new Promise<void>((resolve) => {
    let resolved = false;

    // Função auxiliar para garantir que só resolvemos uma vez
    const doResolve = () => {
        if (!resolved) {
            resolved = true;
            resolve();
        }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("🔥 Firebase: Conectado como", user.uid);
            doResolve();
        } else {
            // Se não tiver usuário, tenta login anônimo
            console.log("🔥 Firebase: Tentando login anônimo...");
            signInAnonymously(auth)
                .then(() => {
                    // O onAuthStateChanged vai disparar novamente com o user, então não precisamos resolver aqui
                })
                .catch((error) => {
                    console.warn("Aviso: Autenticação anônima falhou (provavelmente desativada no console). Tentando acesso público...", error);
                    // IMPORTANTE: Resolve mesmo com erro de auth, para não travar o app na tela de loading,
                    // já que as regras do banco permitem acesso por data.
                    doResolve();
                });
        }
    });
});

export { dbFirestore, auth, authPromise };
