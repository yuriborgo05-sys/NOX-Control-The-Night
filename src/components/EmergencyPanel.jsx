import React, { useState, useEffect } from 'react';
import { Card } from './Card';
import { ShieldAlert, ShieldCheck, HeartPulse, Car, Loader2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useNoxStore } from '../store';
import { recordSOS } from '../services/db';

export function EmergencyPanel() {
  const { addNotification } = useNotification();
  const { userTable, prAssigned } = useNoxStore();
  const [pendingType, setPendingType] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Auto-unlock logic if something hangs
  useEffect(() => {
    if (isSending) {
      const t = setTimeout(() => setIsSending(false), 8000);
      return () => clearTimeout(t);
    }
  }, [isSending]);

  const handleSOS = async (type) => {
    setIsSending(true);
    try {
      await recordSOS(type.toUpperCase(), {
        tableName: userTable || 'Tavolo Anonimo',
        pr: prAssigned || 'Nessuno',
        category: type.toUpperCase(),
        sentAt: new Date().toISOString()
      });
      addNotification("SOS INVIATO", "Richiesta ricevuta dalla security.", "success");
    } catch (err) {
      console.error("SOS Error:", err);
      addNotification("ERRORE SINCRO", "Controlla la connessione internet.", "error");
    } finally {
      setIsSending(false);
      setPendingType(null);
    }
  };

  const btnStyle = (bg, shadow) => ({
    width: '100%',
    padding: '1.25rem',
    borderRadius: '20px',
    border: 'none',
    color: 'white',
    fontWeight: 800,
    fontSize: '0.9rem',
    background: bg,
    cursor: 'pointer',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    boxShadow: shadow,
    transition: 'opacity 0.2s',
    opacity: isSending ? 0.6 : 1,
    position: 'relative',
    zIndex: 10
  });

  return (
    <>
      <Card style={{ 
        background: 'rgba(255, 59, 92, 0.03)', 
        border: '1px solid rgba(255, 59, 92, 0.15)',
        padding: '1.25rem',
        marginTop: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          display: 'flex', alignItems: 'center', gap: '0.6rem', 
          color: 'var(--error)', fontSize: '0.9rem', marginBottom: '1.25rem',
          fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase'
        }}>
          <ShieldAlert size={18} /> Sicurezza & Emergenza
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button 
            onClick={() => setPendingType('security')}
            disabled={isSending}
            style={btnStyle('linear-gradient(135deg, #ff3b30, #cc2d25)', '0 6px 15px rgba(255, 59, 48, 0.3)')}
          >
            <ShieldCheck size={22} /> SICUREZZA
          </button>

          <button 
            onClick={() => setPendingType('medical')}
            disabled={isSending}
            style={btnStyle('linear-gradient(135deg, #ff9500, #e68600)', '0 6px 15px rgba(255, 149, 0, 0.3)')}
          >
            <HeartPulse size={22} /> MALORE
          </button>
        </div>
      </Card>

      {pendingType && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
          zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#15151e', padding: '2.5rem', borderRadius: '32px',
            width: '100%', maxWidth: '380px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ 
              width: '70px', height: '70px', background: 'rgba(255,59,92,0.1)', 
              borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem', color: '#ff3b30'
            }}>
              <ShieldAlert size={36} />
            </div>
            <h2 style={{ color: 'white', fontWeight: 900, marginBottom: '1rem' }}>CONFERMI?</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: '2.5rem' }}>
              L'utilizzo di questi bottoni è una cosa seria.<br/>
              <strong>L'abuso comporta il ban immediato.</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button 
                onClick={() => handleSOS(pendingType)}
                disabled={isSending}
                style={btnStyle('#ff3b30', '0 10px 25px rgba(255,59,48,0.3)')}
              >
                {isSending ? <Loader2 className="animate-spin" /> : 'SÌ, CONFERMO'}
              </button>
              <button 
                onClick={() => setPendingType(null)}
                style={btnStyle('rgba(255,255,255,0.05)', 'none')}
              >
                ANNULLA
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
