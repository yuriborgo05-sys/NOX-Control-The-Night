import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { 
  streamCambusaOrders, 
  updateOrderStatus, 
  triggerHelpCambusa, 
  streamServiceCalls, 
  completeServiceCall 
} from '../services/db';
import { 
  LogOut, PackageOpen, CheckCircle, AlertTriangle, Clock, 
  Wine, Snowflake, Package, Trash2, Bell, Volume2, VolumeX 
} from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNoxStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { formatTime } from '../utils/formatTime';
import { useRef } from 'react';
import { speak, enableSpeech } from '../utils/speech';

export function CambusaHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { orders: globalOrders, serviceCalls: globalCalls } = useNoxStore();
  
  const [orders, setOrders] = useState([]);
  const [serviceCalls, setServiceCalls] = useState([]);
  const [stats, setStats] = useState({ completed: 12, pending: 0 });
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const prevOrdersCount = useRef(0);
  const prevCallsCount = useRef(0);
  const isFirstLoad = useRef(true);

  // Sync Local Search/Filter with Global Store
  useEffect(() => {
    setOrders(globalOrders.filter(o => o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'pending_bar'));
    
    // Voice & Notifications for NEW orders
    if (!isFirstLoad.current && globalOrders.length > prevOrdersCount.current) {
        const newOrder = globalOrders[0];
        if (voiceEnabled) speak(`Nuovo ordine al tavolo ${newOrder.table || 'Sconosciuto'}`);
        addNotification('Nuovo Ordine', 'È appena arrivato un nuovo ordine bottiglie!', 'info');
    }
    prevOrdersCount.current = globalOrders.length;
    setStats(prev => ({ ...prev, pending: globalOrders.filter(o => o.status === 'pending').length }));
  }, [globalOrders, voiceEnabled]);

  useEffect(() => {
    const cambusaRelevant = globalCalls.filter(c => 
      c.request?.toLowerCase().includes('ghiaccio') || 
      c.request?.toLowerCase().includes('lattin') ||
      c.request?.toLowerCase().includes('analcolic') ||
      c.request?.toLowerCase().includes('mixer')
    );
    
    if (!isFirstLoad.current && cambusaRelevant.length > prevCallsCount.current) {
      if (voiceEnabled) speak(`Richiesta di ${cambusaRelevant[0].request} al tavolo ${cambusaRelevant[0].table || 'Sconosciuto'}`);
      addNotification('Nuova Chiamata', 'Richiesta di ghiaccio o analcolici al tavolo.', 'warning');
      playNotificationSound();
    }
    setServiceCalls(cambusaRelevant);
    prevCallsCount.current = cambusaRelevant.length;
    isFirstLoad.current = false;
  }, [globalCalls, voiceEnabled]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    await updateOrderStatus(orderId, newStatus);
    if (newStatus === 'ready') {
      addNotification('Ordine Pronto', 'I camerieri sono stati avvisati per il ritiro.', 'success');
    }
  };

  const handleCompleteService = async (id) => {
    await completeServiceCall(id);
    addNotification('Chiamata Evasa', 'La richiesta singola è stata completata.', 'info');
  };

  const handleHelpPress = async () => {
    await triggerHelpCambusa();
    addNotification('Aiuto Richiesto', 'Un cameriere sta arrivando per darti una mano.', 'warning');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, paddingBottom: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', background: 'var(--accent-glow)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-light)' }}>
             <PackageOpen size={24} color="var(--accent-light)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>CAMBUSA CORE</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>{user?.name || 'Operatore'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            onClick={() => {
              if (!voiceEnabled) enableSpeech();
              setVoiceEnabled(!voiceEnabled);
            }}
            style={{ 
              background: voiceEnabled ? 'rgba(0,255,100,0.1)' : 'rgba(255,255,255,0.05)', 
              border: 'none', color: voiceEnabled ? '#00ff66' : 'gray', 
              padding: '0.5rem', borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700
            }}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {voiceEnabled ? 'VOCE ON' : 'VOCE OFF'}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', padding: '0.5rem', borderRadius: '10px', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Hero Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
         <Card style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(124,58,237,0.05)' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>In Arrivo (Full)</span>
            <p style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>{stats.pending}</p>
         </Card>
         <Card style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(59,130,246,0.05)' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Sfusi (Ice/Cans)</span>
            <p style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--accent-light)' }}>{serviceCalls.length}</p>
         </Card>
         <Card style={{ padding: '0.75rem', textAlign: 'center', background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Evasi Totali</span>
            <p style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0, color: 'var(--success)' }}>{stats.completed}</p>
         </Card>
      </div>

      <Button variant="secondary" onClick={handleHelpPress} style={{ width: '100%', borderColor: 'var(--error)', color: 'var(--error)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
         <AlertTriangle size={18} /> Supporto Operativo (Chiama Cameriere)
      </Button>

      {/* ─── DUAL TABLE LAYOUT ─── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth > 900 ? '1.2fr 0.8fr' : '1fr', 
        gap: '1.5rem',
        marginTop: '0.5rem' 
      }}>
        
        {/* SECTION 1: ORDINI TAVOLO DIRECT (BOTTIGLIE + MIXER) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wine size={16} color="var(--accent-color)" /> Ordini Tavolo (Full)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.length === 0 && <p style={{textAlign: 'center', color: 'gray', padding: '2rem'}}>Nessun ordine bottiglia in arrivo.</p>}
            {orders.map(order => (
              <Card key={order.id} style={{ 
                padding: '1rem', 
                borderLeft: order.status === 'ready' ? '4px solid var(--success)' : 
                           order.status === 'preparing' ? '4px solid var(--warning)' : '4px solid var(--error)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Tavolo {order.tableId}</h4>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      <Clock size={10} style={{display:'inline', marginRight: '4px'}}/> {formatTime(order.timestamp)} | PR: {order.pr || 'Organico'}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '0.65rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px',
                    background: order.status === 'ready' ? 'rgba(0,255,100,0.1)' : order.status === 'preparing' ? 'rgba(255,200,0,0.1)' : 'rgba(255,0,0,0.1)',
                    color: order.status === 'ready' ? 'var(--success)' : order.status === 'preparing' ? 'var(--warning)' : 'var(--error)'
                  }}>
                    {order.status === 'pending' ? 'IN ATTESA' : order.status === 'preparing' ? 'IN PREPARAZIONE' : 'PRONTO'}
                  </span>
                </div>

                <div style={{ marginBottom: '1rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong style={{fontSize: '0.75rem', color: 'var(--accent-light)', textTransform: 'uppercase'}}>📦 BOTTIGLIE</strong>
                    <div style={{ marginTop: '0.4rem', color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>
                      {order.bottles?.map((b, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                          <span>{b.name || b.id}</span>
                          <span style={{ color: 'var(--accent-color)' }}>x{b.qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {order.mixers?.length > 0 && (
                    <div>
                      <strong style={{fontSize: '0.75rem', color: 'var(--warning)', textTransform: 'uppercase'}}>🥤 INCLUSI (Soft Drinks)</strong>
                      <div style={{ marginTop: '0.4rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                        {order.mixers.map((m, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.1rem 0' }}>
                            <span>{m.name}</span>
                            <span>x{m.qty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {order.status === 'pending' && (
                  <Button variant="secondary" onClick={() => handleStatusUpdate(order.id, 'preparing')} style={{ width: '100%', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                    Conferma Ricezione
                  </Button>
                )}
                {order.status === 'preparing' && (
                  <Button variant="primary" onClick={() => handleStatusUpdate(order.id, 'ready')} style={{ width: '100%' }}>
                    Segna come PRONTO
                  </Button>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* SECTION 2: CHIAMATE SFUSE (GHIACCIO, LATTINE SINGOLE) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Snowflake size={16} color="var(--accent-light)" /> Chiamate Sfuse (Ice/Mixer)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {serviceCalls.length === 0 && <p style={{textAlign: 'center', color: 'gray', padding: '2rem'}}>Nessuna richiesta sfusa.</p>}
            {serviceCalls.map(call => (
              <Card key={call.id} style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.02)',
                borderLeft: `4px solid ${call.request.includes('Ghiaccio') ? 'var(--accent-light)' : 'var(--warning)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '1.2rem', color: 'white' }}>{call.table}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatTime(call.timestamp)}</span>
                </div>
                
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.75rem', 
                  padding: '0.75rem', background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '10px', marginBottom: '1rem' 
                }}>
                  {call.request.includes('Ghiaccio') ? <Snowflake color="var(--accent-light)" size={20} /> : <Package color="var(--warning)" size={20} />}
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{call.request.toUpperCase()}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="primary" onClick={() => handleCompleteService(call.id)} style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem' }}>
                    <CheckCircle size={14} style={{marginRight: '4px'}}/> Evaso
                  </Button>
                  <Button variant="secondary" onClick={() => handleHelpPress()} style={{ padding: '0.6rem', borderColor: 'var(--error)', color: 'var(--error)' }}>
                    <AlertTriangle size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
