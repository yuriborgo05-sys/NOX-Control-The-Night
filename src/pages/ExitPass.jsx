import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Shield, ArrowLeft, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { generateDynamicToken } from '../utils/qr';

export function ExitPass() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const navigate = useNavigate();
  const [qrToken, setQrToken] = useState('');

  useEffect(() => {
    const updateToken = () => {
      if (orderId) setQrToken(generateDynamicToken(orderId));
    };
    updateToken();
    const interval = setInterval(updateToken, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrToken}`;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-main)', 
      color: 'white', 
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2rem'
    }}>
      {/* Header Branding */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem', letterSpacing: '2px' }}>BAMBOO</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--accent-light)' }}>
          <Shield size={18} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase' }}>Digital Exit Pass</span>
        </div>
      </div>

      <Card style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '2rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '1.5rem',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Pass Valido per Uscita</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mostra questo QR al Bodyguard per registrare la tua uscita.</p>
        </div>

        <div style={{ 
          padding: '1.5rem', 
          background: 'white', 
          borderRadius: '24px',
          boxShadow: '0 0 40px rgba(124,58,237,0.3)'
        }}>
          <img src={qrUrl} alt="Exit QR" style={{ width: '220px', height: '220px', display: 'block' }} />
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px' }}>
            <CheckCircle2 size={18} color="var(--success)" />
            <span style={{ fontSize: '0.85rem' }}>ID Tavolo: {orderId?.substring(0, 8)}...</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px' }}>
            <Clock size={18} color="var(--warning)" />
            <span style={{ fontSize: '0.85rem' }}>Valido solo per stasera</span>
          </div>
        </div>
      </Card>

      <div style={{ textAlign: 'center', maxWidth: '300px' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Questo pass è personale e monouso. Una volta scansionato non sarà più utilizzabile.
        </p>
      </div>

      <button 
        onClick={() => navigate('/login')}
        style={{ 
          background: 'none', border: 'none', color: 'var(--accent-light)', 
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700,
          cursor: 'pointer', marginTop: 'auto'
        }}
      >
        <ArrowLeft size={18} /> TORNA ALLA HOME
      </button>
      
      <style>{`
        body { background: #000; }
      `}</style>
    </div>
  );
}
