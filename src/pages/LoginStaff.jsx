import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCog, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNox } from '../context/NoxContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

console.log('BOOT-80: REAL LoginStaff.jsx EXECUTING');

export function LoginStaff() {
  console.log('BOOT-81: LoginStaff RENDER START');
  const { login, user } = useAuth();
  const { config } = useNox();
  const navigate = useNavigate();
  const [mode, setMode] = useState('demo');
  const [role, setRole] = useState('pr');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Handle navigation automatically when context updates 'user'
  useEffect(() => {
    if (user) {
      console.log('BOOT-82: Staff user detected, role:', user.role);
      const targetRole = user.role || 'cliente';
      
      const isStaffLoginPage = ['/staff', '/login', '/', '/staff-auth', '/client-auth'].includes(window.location.pathname);

      if (isStaffLoginPage) {
        if (targetRole === 'cliente') {
           navigate('/customer');
           return;
        }
        const routes = {
          pr: '/pr',
          capo_pr: '/capo-pr',
          head_pr: '/capo-pr',
          immagine: '/immagine',
          cameriere: '/waiter',
          admin: '/admin',
          cassa: '/admin',
          bodyguard: '/bodyguard',
          direzione: '/analytics',
          fotografo: '/photographer',
          security: '/bodyguard',
          cambusa: '/cambusa'
        };
        const destination = routes[targetRole] || '/admin';
        console.log('BOOT-83: Staff Redirecting to:', destination);
        navigate(destination);
      }
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (mode === 'demo') {
        await login(role);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Credenziali non valide o errore di connessione.');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: '100%', borderTop: '4px solid var(--accent-light)' }}>
        <button onClick={() => navigate('/client-auth')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Login Clienti
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <ShieldCheck className="icon-glow" size={40} color="var(--accent-light)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.4rem' }}>Portale Staff {config?.clubName || 'NOX'}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Area riservata ai dipendenti e collaboratori.</p>
          
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button onClick={() => setMode('demo')} style={{ padding: '0.4rem 0.8rem', borderRadius: '15px', border: 'none', background: mode === 'demo' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>QUICK DEMO</button>
            <button onClick={() => setMode('real')} style={{ padding: '0.4rem 0.8rem', borderRadius: '15px', border: 'none', background: mode === 'real' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>REAL AUTH</button>
          </div>
        </div>

        {error && <p style={{ color: 'var(--error)', textAlign: 'center', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {mode === 'demo' ? (
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)}
              className="input-base"
              style={{ padding: '1rem', appearance: 'none', fontWeight: 600 }}
            >
              <option value="pr" style={{color: 'black'}}>Staff PR</option>
              <option value="capo_pr" style={{color: 'black'}}>Direzione PR (Capo)</option>
              <option value="immagine" style={{color: 'black'}}>Ragazza Immagine</option>
              <option value="cameriere" style={{color: 'black'}}>Cameriere di Sala</option>
              <option value="cassa" style={{color: 'black'}}>Cassa / Ingresso</option>
              <option value="bodyguard" style={{color: 'black'}}>Bodyguard / Security</option>
              <option value="direzione" style={{color: 'black'}}>Direzione / Analytics KPI</option>
              <option value="fotografo" style={{color: 'black'}}>Fotografo Ufficiale</option>
              <option value="cambusa" style={{color: 'black'}}>Operatore Cambusa (Bar)</option>
            </select>
          ) : (
            <>
              <input type="email" placeholder="Email aziendale (es. nome@nox.it)" className="input-base" value={email} onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password di sistema" className="input-base" value={password} onChange={e => setPassword(e.target.value)} required />
            </>
          )}

          <Button type="submit" variant="primary" style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <UserCog size={18} /> {mode === 'demo' ? 'Entra Operativo (Demo)' : 'Accedi al Sistema'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
