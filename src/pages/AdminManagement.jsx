import React, { useState, useEffect } from 'react';
import { streamOrders, validateBottleQR, streamSystemState, updateSystemState } from '../services/db';
import { useNotification } from '../context/NotificationContext';
import { 
  Wifi, WifiOff, Zap, ArrowLeft, Users, 
  TableProperties, Wine, CreditCard, ShieldAlert 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export function AdminManagement() {
  const navigate = useNavigate();
  const [liveOrders, setLiveOrders] = useState([]);
  const [hackerMode, setHackerMode] = useState(false);
  const { addNotification } = useNotification();

  useEffect(() => {
    const unsubOrders = streamOrders(setLiveOrders);
    const unsubSystem = streamSystemState((state) => {
      setHackerMode(state && state.hackerMode);
    });
    return () => { unsubOrders(); unsubSystem(); };
  }, []);

  const handleSeed = async () => {
    try {
      await updateSystemState({ 
        hackerMode: false, 
        strobeMode: false,
        lastUpdate: new Date().toISOString(),
        clubClosed: false
      });
      addNotification("Sistema Inizializzato", "Il database è ora pronto per la serata.", "success");
    } catch (err) {
      addNotification("Errore Seeding", err.message, "error");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', flex: 1, paddingBottom: '2rem' }}>
       <header style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
           <h2 style={{ margin: 0 }}>Gestione Logistica Staff</h2>
           <div style={{ marginLeft: 'auto' }}>
              <Button variant="secondary" onClick={handleSeed} style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem' }}>INIZIALIZZA ECOISTEMA</Button>
           </div>
        </header>

       <Card style={{ marginBottom: '1.5rem', borderTop: '4px solid var(--accent-color)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             <TableProperties size={20} color="var(--accent-color)" /> Elenco Tavoli Serata
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Sostituisci cliente assegnato, cambia PR, forza gli stati per guasti hardware.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <strong>Console VIP 14</strong>
                     <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Occupato / Entrati</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                     <span>Cliente: <strong>D. Bianchi</strong></span>
                     <span>PR: <strong>Sara</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                     <Button variant="secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }}>Ri-assegna PR</Button>
                     <Button variant="secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', color: 'var(--error)' }}>Libera Tavolo</Button>
                  </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--warning)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                     <strong>Pista 4</strong>
                     <span style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>In Attesa Arrivo</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                     <span>Cliente: <strong>M. Rossi</strong></span>
                     <span>PR: <strong>Alex</strong></span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                     <Button variant="secondary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', color: 'var(--success)', borderColor: 'var(--success)' }}>Forza Check-In Override</Button>
                  </div>
              </div>
          </div>
       </Card>

       <Card style={{ marginBottom: '1.5rem', borderTop: '4px solid var(--warning)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             <Wine size={20} color="var(--warning)" /> Override Ordini Bottiglie
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Visione globale stato ordini ai tavoli. Consente lo scavalcamento della procedura standard se necessario.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {liveOrders.map(order => (
              <div key={order.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                     <strong>{order.item || 'Bottiglia'}</strong>
                     <span style={{ color: order.status === 'pending' ? 'var(--warning)' : 'var(--success)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        {order.status === 'pending' ? 'In Consegna' : 'Consegnata'}
                     </span>
                  </div>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Tavolo {order.table} • Ordine #{order.id.slice(0,6)}</span>
                  
                  {order.status === 'pending' && (
                    <Button 
                      variant="primary" 
                      onClick={() => validateBottleQR(order.id)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', fontSize: '0.85rem' }}
                    >
                       <ShieldAlert size={16} /> Forza Stato: "Consegnata" 
                    </Button>
                  )}
              </div>
             ))}
          </div>
       </Card>

       <Card style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             <CreditCard size={20} color="var(--success)" /> Stato Pagamenti (Frode Check)
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-card)' }}>
             <div>
                 <strong style={{ display: 'block' }}>Ordine #9482</strong>
                 <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Carte di Credito • € 500</span>
             </div>
             <strong style={{ color: 'var(--success)' }}>PAID OK</strong>
          </div>
       </Card>

    </div>
  );
}
