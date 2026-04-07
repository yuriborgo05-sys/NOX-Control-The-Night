import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Environment variables from Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_MOCK_KEY_REPLACE_ME",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nox-app-mock.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nox-app-mock",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nox-app-mock.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:mockid",
};

// Initialize Firebase Real Engine
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable Offline Persistence for Club Environment
// Se la rete cade temporaneamente (cantina, privè), 
// le scritture in cache verranno sincronizzate non appena torna la rete.
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
       console.warn("Multiple tabs open, offline DB limited to one tab");
    } else if (err.code === 'unimplemented') {
       console.warn("Browser doesn't support offline DB persistence");
    }
  });
} catch(e) { console.error("Persistence failed:", e); }

// Log di Avvertimento se manca il file .env per non spaventare il Developer
if(firebaseConfig.apiKey.includes('MOCK_KEY')) {
  console.warn("🔥 [FIREBASE] Attenzione! File .env o credenziali mancanti. I dati verranno scritti localmente ma senza Cloud Synchronization.");
}

export { auth, db };
export default app;
