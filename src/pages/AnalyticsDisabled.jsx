import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function AnalyticsDisabled() {
  const navigate = useNavigate();
  return (
    <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <Card style={{ padding: '2rem', textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
          <BarChart3 size={32} color="var(--accent-color)" />
        </div>
        <h2 style={{ marginBottom: '1rem' }}>Sincronizzazione in Corso</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          Il modulo Analytics è temporaneamente disattivato per ottimizzazione della rete. 
          Riprova tra qualche istante.
        </p>
        <Button variant="outline" onClick={() => navigate(-1)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> TORNA INDIETRO
        </Button>
      </Card>
    </div>
  );
}
