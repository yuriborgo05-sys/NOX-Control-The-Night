import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Lock } from 'lucide-react';

export function LandingDemo() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER PRESENTAZIONE */}
      <header style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1rem' }}>
        <h1 style={{ 
          fontSize: '2.2rem', 
          fontWeight: 900, 
          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 0.5rem 0',
          letterSpacing: '-0.03em'
        }}>
          NOX Control
        </h1>
        <p style={{ 
          fontSize: '1rem', 
          color: 'var(--text-secondary)',
          margin: 0,
          fontWeight: 500,
          letterSpacing: '0.02em'
        }}>
          La piattaforma definitiva per la Nightlife.
        </p>
      </header>

      {/* HERO SECTION GIGANTE - RICHIESTA SPECIFICA */}
      <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: '24px',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(124,58,237,0.15)'
      }}>
          <div style={{ 
              position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', 
              background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', zIndex: 0 
          }} />
          <h2 style={{ 
              position: 'relative', zIndex: 1,
              fontSize: '1.8rem', 
              fontWeight: 900, 
              color: 'white', 
              lineHeight: 1.3,
              marginBottom: '1rem' 
          }}>
              Prova la demo, immagina già di gestire il tuo locale nel modo più <span style={{ color: 'var(--accent-light)' }}>comodo e facile possibile</span>.
          </h2>
          <p style={{ position: 'relative', zIndex: 1, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Seleziona un portale d'ingresso per esplorare l'ecosistema da diverse prospettive.
          </p>
      </div>

      {/* SEZIONE: ACCESSI PRIMARI */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
          
          <button 
              onClick={() => navigate('/client-auth')}
              style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'linear-gradient(135deg, rgba(20,20,20,0.8), rgba(0,0,0,1))',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
          >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={24} color="var(--accent-light)" />
                 </div>
                 <div>
                    <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem', color: 'white' }}>Portale Clienti</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Prenotazioni, scan QR e ordini al tavolo.</p>
                 </div>
              </div>
              <ChevronRight color="var(--text-tertiary)" />
          </button>

          <button 
              onClick={() => navigate('/staff-auth')}
              style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'linear-gradient(135deg, rgba(20,20,20,0.8), rgba(0,0,0,1))',
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
              }}
          >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={24} color="var(--warning)" />
                 </div>
                 <div>
                    <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.1rem', color: 'white' }}>Portale Staff</h3>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sicurezza, PR, Cambusa e Direzione.</p>
                 </div>
              </div>
              <ChevronRight color="var(--text-tertiary)" />
          </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 'auto' }}>
          Powered by Antigravity AI
      </p>

    </div>
  );
}
