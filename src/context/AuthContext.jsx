import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { useNoxStore } from '../store';

console.log('BOOT-50: REAL AuthContext.jsx EXECUTING');

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  console.log('BOOT-52: AUTH PROVIDER RENDER START');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Zustand Store Sync Functions
  const clearSystem = useNoxStore(state => state.clearSystem);

  useEffect(() => {
    console.log('BOOT-53: Auth onAuthStateChanged LISTENER START');

    // MOCK AUTH CHECK (LOCAL BYPASS)
    const mockSession = localStorage.getItem('nox_mock_session');
    if (mockSession && !user) {
       console.log('BOOT-53b: Restoring Mock Session:', mockSession);
       setUser({
         id: 'mock-uid-' + mockSession,
         email: `${mockSession}@demo.nox`,
         name: 'Utente Mock Demo',
         role: mockSession,
         isDemo: true,
         isApproved: true
       });
       setLoading(false);
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('BOOT-54: Auth State Changed Event:', firebaseUser ? 'Logged In' : 'Logged Out');
      
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
          const demoRole = localStorage.getItem('nox_demo_role') || 'cliente';
          setUser({
            id: firebaseUser.uid,
            email: `${demoRole}@demo.nox`,
            name: 'Utente Demo',
            role: demoRole,
            isDemo: true,
            isApproved: true
          });
          setLoading(false);
          return;
        }

        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userRef, (docSnap) => {
          console.log('BOOT-55: User Profile Snapshot Received');
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: userData.name || firebaseUser.email.split('@')[0],
              role: userData.role || 'cliente',
              isApproved: userData.isApproved !== false,
              prAssigned: userData.prAssigned || null
            });
          } else {
            setUser({ id: firebaseUser.uid, email: firebaseUser.email, role: 'cliente', isApproved: true });
          }
          setLoading(false);
        }, (err) => {
          console.error("BOOT-ERROR: User Profile Stream Error:", err);
          setLoading(false);
        });

        return () => unsubProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (emailOrRole, password) => {
    console.log('BOOT-56: Login Request:', password ? 'REAL' : 'DEMO');
    
    if (!password) {
      // MODE: DEMO (Role based anonymous login)
      localStorage.setItem('nox_demo_role', emailOrRole);
      try {
        await signInAnonymously(auth);
        console.log('BOOT-57: Demo Auth Success');
      } catch (err) {
        console.warn("BOOT-WARNING: Firebase Demo Auth Failed, falling back to LOCAL MOCK:", err.message);
        // FALLBACK: Local Mock if Firebase is not configured for Anonymous Auth
        localStorage.setItem('nox_mock_session', emailOrRole);
        setUser({
          id: 'mock-uid-' + emailOrRole,
          email: `${emailOrRole}@demo.nox`,
          name: 'Utente Mock Demo',
          role: emailOrRole,
          isDemo: true,
          isApproved: true
        });
      }
    } else {
      // MODE: REAL AUTH
      try {
        await signInWithEmailAndPassword(auth, emailOrRole, password);
        console.log('BOOT-58: Real Auth Success');
      } catch (err) {
        console.error("BOOT-ERROR: Real Auth Failed:", err);
        throw err;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('nox_mock_session');
    localStorage.removeItem('nox_demo_role');
    clearSystem();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
