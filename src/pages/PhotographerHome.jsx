import React, { useState, useEffect } from 'react';
import { streamOrders, streamStaffMessages, sendStaffMessage } from '../services/db';
import { formatTime } from '../utils/formatTime';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Accordion } from '../components/Accordion';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Camera, Zap, MessageSquare, Users, Star, 
  Flame, CheckCircle2, Volume2, VolumeX 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmergencyPanel } from '../components/EmergencyPanel';
import { hapticSoftPop } from '../utils/haptics';
import { useNotification } from '../context/NotificationContext';
import { useRef } from 'react';
import { playVIPAlertSound, playNotificationSound } from '../utils/audio';
import { speak, enableSpeech } from '../utils/speech';
import { useNoxStore } from '../store';

export function PhotographerHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { 
    orders, 
    staffMessages: chats, 
    serviceCalls, 
    isInitialSyncDone 
  } = useNoxStore();

  const [msgInput, setMsgInput] = useState('');
  const [hotTables, setHotTables] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const isFirstLoad = useRef(true);
  const knownVipOrders = useRef(new Set());

  // Derivazione Tavoli Caldi e Alert VIP
  useEffect(() => {
    if (orders) {
      const vips = orders.filter(o => o.total >= 1000);
      
      // VIP Notification Logic
      if (isInitialSyncDone && !isFirstLoad.current) {
        vips.forEach(order => {
          if (!knownVipOrders.current.has(order.id)) {
            if (voiceEnabled) speak(`Attenzione, ordine V I P al tavolo ${order.table}`);
            addNotification('🚨 VIP ALERT', `Ordine da €${order.total} al Tavolo ${order.table}. Corri per le foto!`, 'warning');
            playVIPAlertSound();
            knownVipOrders.current.add(order.id);
          }
        });
      } else {
        vips.forEach(o => knownVipOrders.current.add(o.id));
      }

      const highValue = orders
        .filter(o => o.total >= 500)
        .map(o => ({ 
          id: o.id, 
          name: o.table, 
          spend: `€ ${o.total}`, 
          activity: `Recente: ${o.items?.[0]?.name || 'Bottiglia'}`, 
          priority: o.total >= 1000 ? 'High' : 'Medium' 
        }));
      setHotTables(highValue);
      isFirstLoad.current = false;
    }
  }, [orders, voiceEnabled, isInitialSyncDone]);

  // Gestione Chiamate Foto (Service Calls)
  useEffect(() => {
    if (!isInitialSyncDone) return;
    const photoCalls = (serviceCalls || []).filter(c => c.request === 'fotografo' && c.status !== 'completed');
    if (photoCalls.length > 0) {
       // Voice Alert for last call
       const latest = photoCalls[0];
       // (Solo se non abbiamo già notificato questa chiamata specifica)
    }
  }, [serviceCalls?.length, isInitialSyncDone]);

  const handleSend = async () => {
    if(!msgInput.trim()) return;
    await sendStaffMessage({ sender: 'Fotografo', text: msgInput });
    setMsgInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '3rem' }}>
      
      {/* ─── HEADER ─── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--accent-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent-light)' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{user?.name?.charAt(0)}</span>
            </div>
            <div>
                <h2 style={{ fontSize: '1rem', margin: 0, color: 'white' }}>VIP LENS CORE</h2>
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
              background: voiceEnabled ? 'rgba(255,255,100,0.1)' : 'rgba(255,255,255,0.05)', 
              border: 'none', color: voiceEnabled ? '#ffd700' : 'gray', 
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

      {/* ─── CUSTOMER CALLS (SERVICE STREAM) ─── */}
      <Accordion title={`Chiamate Clienti (${serviceCalls.length})`} icon={<Camera size={16} color="var(--accent-light)" />} defaultOpen={true} borderColor="var(--accent-light)" badge={serviceCalls.length > 0 ? "NEW" : ""} badgeColor="var(--success)">
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {serviceCalls.length === 0 && <p style={{ textAlign: 'center', color: 'gray', padding: '1rem', fontSize: '0.8rem' }}>Nessuna chiamata diretta dai tavoli.</p>}
            {serviceCalls.map(call => (
               <div key={call.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem', display: 'block' }}>Tavolo {call.table}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chiamata delle {formatTime(call.timestamp)}</span>
                  </div>
                  <Button variant="primary" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem' }} onClick={async () => {
                      hapticSoftPop();
                      await completeServiceCall(call.id);
                  }}>EVADI</Button>
               </div>
            ))}
         </div>
      </Accordion>

      {/* ─── HOT TABLES (FLASH HEATMAP) ─── */}
      <Accordion title="Flash Heatmap (Tavoli Caldi)" icon={<Flame size={16} color="var(--warning)" />} defaultOpen={false} borderColor="var(--warning)">
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {hotTables.map(t => (
               <div key={t.id} style={{ 
                background: 'rgba(255,149,0,0.05)', 
                border: t.priority === 'High' ? '1px solid rgba(255,149,0,0.4)' : '1px solid rgba(255,255,255,0.05)',
                padding: '1rem',
                borderRadius: '12px',
                position: 'relative',
                overflow: 'hidden'
               }}>
                  {t.priority === 'High' && <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--warning)', color: 'black', fontSize: '0.65rem', padding: '0.2rem 0.5rem', fontWeight: 800, borderRadius: '0 0 0 8px' }}>VIP PRIORITY</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                     <strong style={{ fontSize: '1.05rem' }}>{t.name}</strong>
                     <span style={{ color: 'var(--success)', fontWeight: 700 }}>{t.spend}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{t.activity}</p>
                  <Button variant="primary" style={{ width: '100%', marginTop: '0.8rem', padding: '0.6rem', fontSize: '0.85rem' }} onClick={() => hapticSoftPop()}>
                     VADO AL TAVOLO
                  </Button>
               </div>
            ))}
         </div>
      </Accordion>

      {/* ─── SOCIAL COORDINATION CHAT ─── */}
      <Accordion title="Coordinamento Staff" icon={<MessageSquare size={16} />} borderColor="var(--accent-color)">
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {chats.map((c, i) => (
               <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                     <strong style={{ fontSize: '0.8rem', color: 'var(--accent-light)' }}>{c.sender}</strong>
                     <span style={{ fontSize: '0.7rem', color: 'gray' }}>{formatTime(c.timestamp)}</span>
                  </div>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>{c.text}</p>
               </div>
            ))}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="input-base" 
                placeholder="Scrivi allo staff..." 
                value={msgInput}
                onChange={e => setMsgInput(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.6rem', flex: 1 }} 
              />
              <Button variant="primary" onClick={handleSend} style={{ padding: '0.6rem' }}><CheckCircle2 size={18}/></Button>
            </div>
         </div>
      </Accordion>

      <EmergencyPanel />
    </div>
  );
}
