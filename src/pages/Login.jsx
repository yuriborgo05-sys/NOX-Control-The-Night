import React, { useState, useEffect } from 'react';
import { Sparkles, User, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNox } from '../context/NoxContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

console.log('BOOT-70: REAL Login.jsx EXECUTING');

export function Login() {
  console.log('BOOT-71: Login RENDER START');
  const { login, user } = useAuth();
  const { config } = useNox();
  const navigate = useNavigate();
  const [mode, setMode] = useState('demo'); // Changed default to 'demo' to avoid Firebase errors
  const [role, setRole] = useState('cliente');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handle navigation automatically when context updates 'user'
  useEffect(() => {
    if (user) {
      console.log('BOOT-72: User detected, checking role for redirect:', user.role);
      const targetRole = user.role || 'cliente';
      
      // If we are on a login-related page, redirect to the correct dashboard
      const isLoginPage = ['/login', '/', '/staff', '/client-auth', '/staff-auth'].includes(window.location.pathname);
      
      if (isLoginPage) {
        const routes = {
          cliente: '/customer',
          // Explicit mapping for staff mistakenly logging in here
          ...[ 'pr', 'capo_pr', 'immagine', 'cameriere', 'admin', 'cassa', 'bodyguard', 'direzione', 'fotografo', 'cambusa' ]
              .reduce((acc, r) => ({...acc, [r]: '/staff'}), {})
        };
        const destination = routes[targetRole] || '/customer';
        console.log('BOOT-73: Redirecting to:', destination);
        navigate(destination);
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (mode === 'demo') {
        login(role);
      } else {
        await login(email, password);
      }
      // Il redirect è gestito dall'useEffect in ascolto su 'user'
    } catch (err) {
      setError(err.message || 'Credenziali non valide o errore di connessione.');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {config?.clubLogo ? (
            <img src={config.clubLogo} alt="Logo" style={{ height: '80px', width: '80px', objectFit: 'contain', margin: '0 auto 1rem', display: 'block', borderRadius: '50%', boxShadow: '0 0 30px rgba(139,92,246,0.3)' }} />
          ) : (
            <Sparkles className="icon-glow" size={32} color="var(--accent-color)" style={{ margin: '0 auto 1rem' }} />
          )}
          <h2>Accedi a {config?.clubName || 'NOX'}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button onClick={() => setMode('demo')} style={{ padding: '0.4rem 0.8rem', borderRadius: '15px', border: 'none', background: mode === 'demo' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>QUICK DEMO</button>
            <button onClick={() => setMode('real')} style={{ padding: '0.4rem 0.8rem', borderRadius: '15px', border: 'none', background: mode === 'real' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>REAL AUTH</button>
          </div>
        </div>

        {error && <p style={{ color: 'var(--error)', textAlign: 'center', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'demo' ? (
             <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', textAlign: 'center', marginBottom: '0.5rem' }}>
                <User size={24} color="var(--accent-color)" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Accesso Demo Cliente</p>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Verrai connesso come profilo ospite.</p>
             </div>
          ) : (
            <>
              <input type="email" placeholder="Email cliente" className="input-base" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" className="input-base" value={password} onChange={e => setPassword(e.target.value)} required />
            </>
          )}

          <Button type="submit" variant="primary" style={{ marginTop: '0.5rem' }}>
            {mode === 'demo' ? 'Entra in Demo' : 'Accedi'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/register')} style={{ marginTop: '0.5rem' }}>Nuovo Cliente? Registrati</Button>
        </form>

        {/* ─── PRE-PARTY "GET READY" EXPERIENCE ─── */}
        <div style={{ marginTop: '2.5rem', padding: '1rem', borderTop: '1px solid var(--border-card)', textAlign: 'center' }}>
           <Sparkles size={20} color="var(--accent-color)" style={{ marginBottom: '0.75rem' }} />
           <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, margin: '0 auto', maxWidth: '80%', fontStyle: 'italic' }}>
             "Prova la demo, immagina già di gestire il tuo locale nel modo più comodo e facile possibile"
           </p>
           <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--warning)', fontSize: '0.7rem', fontWeight: 600 }}>
              <Clock size={14} /> APERTURA TRA: 02:45:12
           </div>
        </div>
        <button onClick={() => navigate('/forgot-password')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', width: '100%', marginTop: '1.5rem', cursor: 'pointer', textDecoration: 'underline' }}>
           Password Dimenticata?
        </button>


      </Card>
    </div>
  );
}
