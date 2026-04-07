import React, { useState, useEffect } from 'react';
import { streamServiceCalls, completeServiceCall, streamCashOrders, confirmCashPayment, streamWaiterOrders, completeWaiterDelivery } from '../services/db';
import { formatTime } from '../utils/formatTime';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Accordion } from '../components/Accordion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EmergencyPanel } from '../components/EmergencyPanel';
import { playCheckInSound, playNotificationSound } from '../utils/audio';
import { hapticSoftPop } from '../utils/haptics';
import { useNotification } from '../context/NotificationContext';
import { useRef } from 'react';
import { speak, enableSpeech } from '../utils/speech';
import { 
  Volume2, VolumeX, LogOut, Bell, CheckCircle2, 
  AlertTriangle, Coins, RefreshCw, IceCream, Trash2, Package 
} from 'lucide-react';

export function WaiterHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [serviceCalls, setServiceCalls] = useState([]);
  const [cashOrders, setCashOrders] = useState([]);
  const [waiterOrders, setWaiterOrders] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const { addNotification } = useNotification();
  
  const prevWaiterCount = useRef(0);
  const prevCallsCount = useRef(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const unsub1 = streamServiceCalls((data) => {
      if (!isFirstLoad.current && data.length > prevCallsCount.current) {
        if (voiceEnabled) speak(`Chiamata di servizio al tavolo ${data[0].table || 'Sconosciuto'}`);
        addNotification('Richiesta Servizio', `Il tavolo ${data[0].table} sta chiamando!`, 'warning');
      }
      setServiceCalls(data);
      prevCallsCount.current = data.length;
    });
    const unsub2 = streamCashOrders(setCashOrders);
    const unsub3 = streamWaiterOrders((data) => {
      if (!isFirstLoad.current && data.length > prevWaiterCount.current) {
        if (voiceEnabled) speak(`Ritira ordine al tavolo ${data[0].table || 'Sconosciuto'}`);
        addNotification('Ritiro Pronto', 'Un ordine è pronto in Cambusa. Vai subito al banco!', 'info');
        playNotificationSound();
      }
      setWaiterOrders(data);
      prevWaiterCount.current = data.length;
      isFirstLoad.current = false;
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [voiceEnabled]);

  const completeService = async (id) => {
    hapticSoftPop();
    await completeServiceCall(id);
  };

  const confirmCash = async (id) => {
    playCheckInSound();
    await confirmCashPayment(id);
    alert('Pagamento Confermato! La Cassa inizierà a preparare la bottiglia.');
  };

  const reportFraud = (id) => {
    hapticSoftPop();
    if(window.confirm('Sicuro di voler segnalare un mancato pagamento? La direzione e la security verranno avvisati.')) {
        // Logic to report fraud to firestore could go here
    }
  };

  const deliverOrder = async (id) => {
    hapticSoftPop();
    await completeWaiterDelivery(id);
    // State will be updated via the stream listener automatically
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '3rem' }}>
      
      {/* ─── HEADER ─── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3b82f6' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#3b82f6' }}>{user?.name?.charAt(0)}</span>
            </div>
            <div>
                <h2 style={{ fontSize: '1rem', margin: 0, color: 'white' }}>SERVIZIO SALA</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>{user?.name}</p>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button 
            onClick={() => {
              if (!voiceEnabled) enableSpeech();
              setVoiceEnabled(!voiceEnabled);
            }}
            style={{ 
              background: voiceEnabled ? 'rgba(0,180,255,0.1)' : 'rgba(255,255,255,0.05)', 
              border: 'none', color: voiceEnabled ? '#1e90ff' : 'gray', 
              padding: '0.5rem', borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700
            }}
          >
            {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {voiceEnabled ? 'VOCE ON' : 'VOCE OFF'}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,69,58,0.1)', border: 'none', color: '#ff453a', padding: '0.6rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={18} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>ESCI</span>
          </button>
        </div>
      </header>

      {/* ─── HERO ACTIONS ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
         <Card style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), transparent)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Bell size={24} color="#3b82f6" style={{ margin: '0 auto 0.5rem' }} />
            <strong style={{ fontSize: '1.5rem', display: 'block', color: 'white' }}>{serviceCalls.length}</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chiamate</span>
         </Card>
         <Card style={{ padding: '1rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), transparent)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Coins size={24} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
            <strong style={{ fontSize: '1.5rem', display: 'block', color: 'white' }}>{cashOrders.length}</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Da Incassare</span>
         </Card>
      </div>

      {/* ─── RITIRO ORDINI CAMBUSA ─── */}
      <Accordion title={`Ritiro Ordini Bar (${waiterOrders.length})`} icon={<Package size={16} />} defaultOpen={true} borderColor="var(--accent-color)" badge={waiterOrders.length > 0 ? "NUOVO" : ""} badgeColor="var(--success)">
         {waiterOrders.length === 0 ? (
           <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Nessun ordine da ritirare al Bar.</p>
         ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {waiterOrders.map(order => (
                <div key={order.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: 'var(--bg-card)', borderLeft: '4px solid var(--accent-color)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                       <strong style={{ display: 'block', fontSize: '1.05rem', color: 'white' }}>Tavolo {order.tableId}</strong>
                       <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>Pronto in Cambusa</span>
                     </div>
                     <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{order.time}</span>
                   </div>
                   
                   <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.75rem' }}>
                      <div style={{ marginBottom: '0.4rem' }}>
                        <span style={{ color: 'var(--accent-light)', fontWeight: 700 }}>BOTTIGLIE: </span>
                        {order.bottles?.map(b => `${b.qty}x ${b.name || b.id}`).join(', ')}
                      </div>
                      <div>
                        <span style={{ color: 'var(--warning)', fontWeight: 700 }}>MIXERS: </span>
                        {order.mixers?.map(m => `${m.qty}x ${m.name}`).join(', ')}
                      </div>
                   </div>

                   <Button variant="primary" onClick={() => deliverOrder(order.id)} style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}>
                      📦 Segna come CONSEGNATO al tavolo
                   </Button>
                </div>
              ))}
           </div>
         )}
      </Accordion>

      {/* ─── SEZIONE INCASSI ─── */}
      <Accordion title={`Incassi al Tavolo (${cashOrders.length})`} icon={<Coins size={16} />} defaultOpen={true} borderColor="var(--success)" badge={cashOrders.length > 0 ? "URGENTE" : ""} badgeColor="var(--error)">
         {cashOrders.length === 0 ? (
           <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Nessun incasso in sospeso.</p>
         ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {cashOrders.map(order => (
                <div key={order.id} style={{ background: 'var(--bg-card-hover)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: '12px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{order.table}</strong>
                       <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatTime(order.timestamp)}</span>
                   </div>
                   <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-card)' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 600 }}>{order.bottles}</span>
                      <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--success)', marginTop: '0.2rem' }}>€ {order.total}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--warning)', display: 'block', marginTop: '0.2rem' }}>⚠️ Da riscuotere</span>
                   </div>
                   {/* Metodo Pagamento */}
                   <div style={{ 
                     display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                     padding: '0.7rem', borderRadius: '14px', marginBottom: '0.75rem',
                     background: (order.paymentMethod === 'POS' || order.total > 300)
                       ? 'rgba(59,130,246,0.12)' : 'rgba(255,149,0,0.12)',
                     border: `2px solid ${(order.paymentMethod === 'POS' || order.total > 300) ? '#3b82f6' : '#ff9500'}`,
                   }}>
                     <span style={{ fontSize: '1.3rem' }}>{(order.paymentMethod === 'POS' || order.total > 300) ? '💳' : '💵'}</span>
                     <strong style={{ 
                       fontSize: '0.95rem', fontWeight: 900, letterSpacing: '0.06em',
                       color: (order.paymentMethod === 'POS' || order.total > 300) ? '#3b82f6' : '#ff9500',
                     }}>
                       {(order.paymentMethod === 'POS' || order.total > 300) ? 'PAGAMENTO POS' : 'PAGAMENTO CONTANTI'}
                     </strong>
                   </div>
                   <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="primary" onClick={() => confirmCash(order.id)} style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem', background: 'var(--success)', whiteSpace: 'nowrap' }}>✅ Incassato</Button>
                      <Button variant="secondary" onClick={() => reportFraud(order.id)} style={{ padding: '0.75rem', fontSize: '0.85rem', color: 'var(--error)', borderColor: 'var(--error)' }}><AlertTriangle size={16} /></Button>
                   </div>
                </div>
             ))}
           </div>
         )}
      </Accordion>

      {/* ─── SEZIONE CHIAMATE AL TAVOLO ─── */}
      <Accordion title={`Servizio Tavoli (${serviceCalls.length})`} icon={<Bell size={16} />} defaultOpen={true} borderColor="var(--accent-color)">
         {serviceCalls.length === 0 ? (
           <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>Tutto tranquillo.</p>
         ) : (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {serviceCalls.map(call => (
                <div key={call.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'var(--bg-app)', borderLeft: '3px solid #3b82f6', borderRadius: '8px' }}>
                   <div>
                     <strong style={{ display: 'block', fontSize: '0.95rem' }}>{call.table}</strong>
                     <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                        {call.request.includes('Ghiaccio') && <IceCream size={12}/>}
                        {call.request.includes('Pulizia') && <Trash2 size={12}/>}
                        {call.request.includes('Lattine') && <RefreshCw size={12}/>}
                        {call.request}
                     </span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{formatTime(call.timestamp)}</span>
                      <button onClick={() => completeService(call.id)} style={{ background: 'rgba(0,208,132,0.1)', border: '1px solid rgba(0,208,132,0.3)', color: 'var(--success)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <CheckCircle2 size={16} />
                      </button>
                   </div>
                </div>
             ))}
           </div>
         )}
      </Accordion>

      <EmergencyPanel />
    </div>
  );
}
