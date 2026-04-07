import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Accordion } from '../components/Accordion';
import { 
  QrCode, Ticket, User, Star, Users, Clock, Wine, 
  ChevronRight, Music, Camera, MapPin, Phone, 
  Trophy, EyeOff, Eye, Sparkles, LogOut, Minus, 
  Plus, Instagram, Globe, MessageCircle, Share2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { playCheckInSound, playNotificationSound } from '../utils/audio';
import { hapticCheckIn, hapticSoftPop } from '../utils/haptics';
import { useRef } from 'react';
import { streamOrders, recordServiceCall, streamAnalytics, streamClubConfig } from '../services/db';

import { generateDynamicToken } from '../utils/qr';
import { EmergencyPanel } from '../components/EmergencyPanel';
import { useNox } from '../context/NoxContext';
import { useNoxStore } from '../store';
import { CustomerHeader } from '../features/customer/CustomerHeader';
import { CustomerStatusCard } from '../features/customer/CustomerStatusCard';

console.log('BOOT-100: REAL CustomerHome.jsx EXECUTING');

export function CustomerHome() {
  console.log('BOOT-101: CustomerHome RENDER START');
  const { user, logout } = useAuth();
  const { 
    hasEntered, 
    liveDuration, 
    entryTime, 
    userTable,
    setCustomerEntry,
    setCustomerExit
  } = useNoxStore();
  const { config } = useNox();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [privacyShield, setPrivacyShield] = useState(false);
  const [eventConfig, setEventConfig] = useState({
    eventTitle: "BAMBOO SPECIAL NIGHT",
    eventDate: "SABATO 05 APRILE",
    eventCover: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop"
  });

  // Stream club config for event cover
  useEffect(() => {
    const unsub = streamClubConfig((data) => {
      setEventConfig(data);
    });
    return () => unsub();
  }, []);

  // States
  const [canQty, setCanQty] = useState(1);
  const [canType, setCanType] = useState('Coca Cola');
  const [showCanSelector, setShowCanSelector] = useState(false);

  const MIXERS_LIST = [
    { name: 'Coca Cola', price: 5 },
    { name: 'Lemon Soda', price: 5 },
    { name: 'Succo Arancia', price: 5 },
    { name: 'Succo Ananas', price: 5 },
    { name: 'Tonica Schweppes', price: 5 },
    { name: 'Red Bull', price: 8 },
    { name: 'Acqua Naturale', price: 3 },
    { name: 'Acqua Frizzante', price: 3 },
  ];

  const [topTables, setTopTables] = useState([]);
  const [monthlyRecord] = useState({ table: 'Tavolo VIP 2', spend: 15400, date: '12 Marzo' });
  const [allOrders, setAllOrders] = useState([]);
  const [qrToken, setQrToken] = useState('');
  
  const prevStatuses = useRef({}); // { orderId: status }
  const isFirstLoadOrders = useRef(true);

  // Viewers FOMO
  const [viewers, setViewers] = useState(28);
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(v => Math.max(15, v + Math.floor(Math.random() * 5) - 2));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Dynamic QR (Time-Sync Security)
  const [activeOrderId, setActiveOrderId] = useState(null);

  useEffect(() => {
    const updateToken = () => {
      const targetId = activeOrderId || qrToken || user?.id; // Try order first
      if (targetId) setQrToken(generateDynamicToken(targetId));
    };
    updateToken();
    const interval = setInterval(updateToken, 30000); // 30s for better security
    return () => clearInterval(interval);
  }, [user, activeOrderId, qrToken]);

  // Stream orders for top tables and status tracking
  useEffect(() => {
     const unsubOrders = streamOrders((orders) => {
        setAllOrders(orders);
        
        // Find active order for this user/table to drive the security QR
        const myOrder = orders.find(o => o.table === userTable);
        if (myOrder) setActiveOrderId(myOrder.id);
        
        // Status Notification Logic
       if (!isFirstLoadOrders.current) {
         orders.forEach(order => {
           // Only notify for THIS user's table or name
           if (order.userName === user?.name || order.table === userTable) {
             const prevStatus = prevStatuses.current[order.id];
             if (prevStatus && prevStatus !== order.status) {
                let msg = "";
                if (order.status === 'preparing') msg = "Il tuo ordine è in preparazione!";
                if (order.status === 'ready') msg = "In arrivo! Il cameriere sta portando le bottiglie.";
                if (order.status === 'delivered') msg = "Buon divertimento! Ordine consegnato.";
                
                if (msg) {
                  addNotification("Aggiornamento Ordine", msg, "info");
                  playNotificationSound();
                }
             }
             prevStatuses.current[order.id] = order.status;
           }
         });
       } else {
         orders.forEach(o => { prevStatuses.current[o.id] = o.status; });
         isFirstLoadOrders.current = false;
       }

       const summaries = orders.reduce((acc, o) => {
          const t = o.table || 'Anonimo';
          acc[t] = (acc[t] || 0) + (o.total || 0);
          return acc;
       }, {});
       const sorted = Object.entries(summaries)
          .map(([table, spend]) => ({ table, spend }))
          .sort((a,b) => b.spend - a.spend)
          .slice(0, 3);
       if(sorted.length > 0) setTopTables(sorted);
    });
    return () => { if(unsubOrders) unsubOrders(); };
  }, [user, userTable]);

  // VIP Progression
  const totalSpend = allOrders
    .filter(o => o.userName === user?.name || o.table === userTable)
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const goldTarget = 1000;
  const progress = Math.min(100, Math.round((totalSpend / goldTarget) * 100));

  // Permanenza gestita da Zustand
  const { updateLiveDuration } = useNoxStore();
  
  useEffect(() => {
    let timer;
    if (hasEntered) {
      updateLiveDuration();
      timer = setInterval(updateLiveDuration, 60000);
    }
    return () => clearInterval(timer);
  }, [hasEntered, entryTime]);

  const simulateEntry = () => {
    if (!hasEntered) {
      playCheckInSound();
      hapticCheckIn();
      setCustomerEntry('Tavolo Demo', 'Sara B.');
      addNotification("✅ Ingresso Confermato", `Benvenuto! Scansione ingresso completata.`, "success");
    } else {
      const durationMins = Math.max(1, Math.round((Date.now() - entryTime) / 60000));
      setCustomerExit();
      addNotification("👋 Arrivederci!", `Uscita registrata. Permanenza: ${durationMins} min.`, "info");
    }
  };

  // Profile summary
  const profileStats = {
    totalSpend,
    totalBottles: allOrders.filter(o => o.userName === user?.name).reduce((s, o) => s + (o.items?.reduce((a, i) => a + i.qty, 0) || 0), 0),
    totalOrders: allOrders.filter(o => o.userName === user?.name).length,
  };

  const activeOrderForSharing = allOrders.find(o => (o.userName === user?.name || o.table === userTable) && o.isEntered);

  const handleSharePass = async () => {
    if (!activeOrderForSharing) return;
    const shareUrl = `${window.location.origin}/exit-pass?id=${activeOrderForSharing.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Pass Uscita Bamboo',
          text: `Ecco il pass per uscire dal Bamboo per il ${activeOrderForSharing.table}. Scansionalo all'uscita!`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      addNotification("Link Copiato", "Invia il link ai tuoi amici per l'uscita.", "success");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, paddingBottom: '2rem' }}>
      
      {/* ─── HEADER ─── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="vip-avatar-container">
            <Avatar name={user?.name || 'Cliente'} size={44} />
          </div>
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Benvenuto</p>
            <h2 style={{ fontSize: '1.3rem', margin: 0, lineHeight: 1.2 }}>{user?.name || 'Cliente'}</h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--error-bg)', padding: '0.3rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(255,59,92,0.25)' }}>
            <span style={{ height: 6, width: 6, borderRadius: '50%', background: 'var(--error)', animation: 'heartbeat 1.5s infinite', display: 'inline-block' }}></span>
            <span style={{ fontSize: '0.72rem', color: 'var(--error)', fontWeight: 700 }}>{viewers}</span>
          </div>
          <button onClick={() => { setPrivacyShield(!privacyShield); hapticSoftPop(); }} style={{ background: privacyShield ? 'var(--accent-color)' : 'var(--bg-card)', border: '1px solid var(--border-card)', color: privacyShield ? 'white' : 'var(--text-secondary)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {privacyShield ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,69,58,0.1)', border: 'none', color: '#ff453a', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <LogOut size={18} />
          </button>
        </div>
      </header>
      
      {/* ─── EVENT HERO COVER (POINT 5) ─── */}
      {eventConfig && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '200px',
          borderRadius: '24px',
          overflow: 'hidden',
          marginBottom: '0.5rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <img 
            src={eventConfig.eventCover || eventConfig.imageUrl || eventConfig.cover || 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop'} 
            alt="Event Cover" 
            onError={(e) => { 
                if (e.target.src !== 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop') {
                    e.target.src = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop';
                }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '1.25rem'
          }}>
            <span style={{ 
              fontSize: '0.65rem', 
              color: 'var(--accent-light)', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em',
              marginBottom: '0.25rem'
            }}>
              {eventConfig.eventDate}
            </span>
            <h1 style={{ 
              fontSize: '1.4rem', 
              color: 'white', 
              margin: 0, 
              fontWeight: 900,
              textShadow: '0 2px 10px rgba(0,0,0,0.5)'
            }}>
              {eventConfig.eventTitle}
            </h1>
          </div>
          <div style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '0.4rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.65rem',
            fontWeight: 800,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            LIVE EVENT
          </div>
        </div>
      )}

      {/* ─── STATUS CARD ─── */}
      <div style={{
        background: hasEntered
          ? 'linear-gradient(135deg, var(--success-bg), rgba(0,0,0,0.2))'
          : 'linear-gradient(135deg, var(--accent-glow), rgba(0,0,0,0.2))',
        border: `1px solid ${hasEntered ? 'rgba(0,208,132,0.3)' : 'rgba(124,58,237,0.3)'}`,
        borderRadius: '20px', padding: '1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {hasEntered ? 'Stato Ingresso' : 'Prenotazione'}
          </p>
          <strong style={{ fontSize: '1.1rem', color: hasEntered ? 'var(--success)' : 'var(--text-primary)', display: 'block' }}>
            {hasEntered ? '✅ Entrato' : '⏳ In attesa di ingresso'}
          </strong>
          {hasEntered && <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>Tempo: {liveDuration} min</span>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem 0' }}>{userTable}</p>
          <strong style={{ color: 'var(--accent-light)', fontSize: '0.85rem' }}>PR: {user?.prAssigned || 'Sara B.'}</strong>
        </div>
      </div>

      {/* ─── HERO CTA: PRE ORDINE ─── */}
      <button
        onClick={() => navigate('/catalog')}
        style={{
          width: '100%', padding: '1.25rem', borderRadius: '18px', cursor: 'pointer',
          background: hasEntered
            ? 'linear-gradient(135deg, #a855f7, #7c3aed, #6366f1)' 
            : 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.08))',
          boxShadow: hasEntered ? '0 6px 30px rgba(124,58,237,0.4)' : '0 2px 10px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: '1rem',
          color: hasEntered ? 'white' : 'var(--text-primary)',
          border: hasEntered ? 'none' : '1px solid rgba(168,85,247,0.2)',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: '16px',
          background: hasEntered ? 'rgba(255,255,255,0.15)' : 'rgba(168,85,247,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Wine size={26} color={hasEntered ? 'white' : '#a855f7'} />
        </div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <strong style={{ fontSize: '1.05rem', display: 'block', marginBottom: '0.15rem' }}>
            {hasEntered ? '🍾 Ordina al Tavolo' : '🛒 Pre-Ordina la Serata'}
          </strong>
          <span style={{ fontSize: '0.78rem', color: hasEntered ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
            {hasEntered ? 'Scegli bottiglie e mixer per il tuo tavolo' : 'Seleziona in anticipo e salta la coda'}
          </span>
        </div>
        <ChevronRight size={20} style={{ opacity: 0.5 }} />
      </button>

      {/* ─── TOP 3 DASHBOARD (spostato in alto) ─── */}
      <Card style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderColor: 'var(--success)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', margin: '0 0 0.75rem 0', color: 'white' }}>
          <Trophy size={18} color="var(--success)" /> Top Tavoli Stasera
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {topTables.map((r, i) => (
            <div key={r.table} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `4px solid ${i === 0 ? 'var(--gold)' : i === 1 ? 'silver' : '#cd7f32'}` }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>#{i+1} {r.table}</span>
              <strong style={{ color: i === 0 ? 'var(--gold)' : 'white' }}>€ {r.spend}</strong>
            </div>
          ))}
          <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>🏆 Record del Mese</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>{monthlyRecord.table}</strong>
              <strong style={{ fontSize: '0.95rem' }}>€ {monthlyRecord.spend}</strong>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── IL TUO PROFILO (Pulito - Senza Fedeltà) ─── */}
      <Card style={{ padding: '1.25rem', background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', margin: '0', color: 'white' }}>
            <User size={18} color="var(--accent-light)" /> Il Tuo Profilo
          </h3>
          <span style={{ fontSize: '1rem' }} title="RFM Tier">
            {profileStats.totalSpend >= 1500 ? '🐳 VIP Tier' : profileStats.totalSpend >= 300 ? '🔥 Hot Tier' : '❄️ Standard'}
          </span>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
          {[
            { label: 'Spesa Serata', value: `€ ${profileStats.totalSpend}`, color: 'var(--accent-light)' },
            { label: 'Ordini', value: profileStats.totalOrders, color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem', borderRadius: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', margin: '0 0 0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
              <strong style={{ color: s.color, fontSize: '1.1rem' }}>{s.value}</strong>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/profile')} style={{ width: '100%', padding: '0.65rem', background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          Vedi Storico Completo <ChevronRight size={14} />
        </button>
      </Card>

      {/* ─── ACCORDION SECTIONS ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {hasEntered && totalSpend >= 500 && (
          <Accordion title="Servizio Fotografo VIP" icon={<Camera size={16} />} badge="Chiamata" badgeColor="var(--accent-color)" borderColor="var(--accent-light)">
             <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Richiedi il fotografo ufficiale per uno shooting privato.</p>
             <Button variant="primary" style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem' }} onClick={() => { 
                hapticCheckIn(); 
                recordServiceCall('fotografo', { table: userTable });
                addNotification('Fotografo', 'Il fotografo sta arrivando al tuo tavolo!', 'success');
             }}>Richiama Fotografo</Button>
          </Accordion>
      )}

      {hasEntered && (
          <Accordion title="Gift Bottle (Invia Regalo)" icon={<Wine size={16} />} borderColor="var(--gold)" badge="MSG" badgeColor="var(--gold)">
             <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Offri una bottiglia ad un altro tavolo con messaggio.</p>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <input type="text" className="input-base" placeholder="Numero Tavolo (es. P3)" style={{ fontSize: '0.85rem', padding: '0.75rem' }} />
                <textarea maxLength={60} className="input-base" placeholder="Il tuo messaggio (max 60 car.)" style={{ fontSize: '0.85rem', padding: '0.75rem', minHeight: '60px' }} />
             </div>
             <Button variant="secondary" onClick={() => { hapticCheckIn(); navigate('/catalog?gift=true'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--gold)', borderColor: 'var(--gold)', background: 'rgba(255,208,96,0.05)' }}>
                <Wine size={16} /> SCEGLI BOTTIGLIA & INVIA
             </Button>
          </Accordion>
      )}

      {hasEntered && totalSpend >= 500 && (
          <Accordion title="Jukebox Privé (Esclusiva VIP)" icon={<Music size={16} />} badge="250€" badgeColor="var(--accent-color)" borderColor="var(--accent-light)">
             <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Salta la coda del DJ. Fai scoppiare la tua traccia preferita.</p>
             <Button variant="primary" style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem' }} onClick={() => { 
                hapticCheckIn(); 
                recordServiceCall('jukebox', { table: userTable });
                addNotification('DJ Alert', 'Richiesta VIP inviata in Console.', 'success');
             }}>Scegli Canzone & Paga</Button>
          </Accordion>
      )}

      <Accordion title="Prenotazione Tavolo" icon={<Ticket size={16} />} defaultOpen={true} borderColor="var(--accent-color)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Tavolo', value: userTable, color: 'var(--accent-light)' },
            { label: 'Persone', value: activeOrderForSharing ? `${activeOrderForSharing.pax} Ospiti` : '6 Ospiti', color: 'var(--text-primary)' },
            { label: 'Spesa Minima', value: '€ 500', color: 'var(--warning)' },
            { label: 'PR Titolare', value: user?.prAssigned || 'Sara B.', color: 'var(--text-primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
              <strong style={{ color }}>{value}</strong>
            </div>
          ))}
        </div>

        {/* QR Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ 
            padding: '1.25rem', background: 'white', borderRadius: '28px',
            boxShadow: '0 0 40px rgba(124,58,237,0.2)'
          }}>
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrToken}`} 
              alt="QR Entry" 
              style={{ width: '150px', height: '150px', display: 'block' }} 
            />
          </div>
          
          {activeOrderForSharing && (
            <Button 
              variant="primary" 
              onClick={handleSharePass}
              style={{ 
                width: '100%', 
                background: 'linear-gradient(135deg, #25D366, #128C7E)', // WhatsApp Green 
                borderColor: '#128C7E',
                gap: '8px'
              }}
            >
              <Share2 size={18} /> DIVIDI PASS USCITA ({activeOrderForSharing.paxCheckedIn - activeOrderForSharing.paxCheckedOut} RIMASTI)
            </Button>
          )}
          
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', textAlign: 'center', margin: 0 }}>
            {activeOrderForSharing ? 'Condividi questo pass con i tuoi amici per l\'uscita.' : 'Mostra questo codice all\'ingresso per far entrare il gruppo.'}
          </p>
        </div>

        {!hasEntered && (
          <button onClick={() => navigate('/reserve')} style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: 'var(--accent-light)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Modifica Prenotazione <ChevronRight size={16} />
          </button>
        )}
      </Accordion>

      {hasEntered && (
          <Accordion title="Chiama Servizio" icon={<Wine size={16} />} borderColor="var(--accent-color)">
           <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Richiedi assistenza al tuo tavolo.</p>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => { recordServiceCall('ghiaccio', { table: userTable }); addNotification('Ghiaccio', 'Il cameriere sta arrivando', 'success'); }} style={{ padding: '0.75rem', fontSize: '0.8rem' }}>🧊 Ghiaccio</Button>
              <Button variant="secondary" onClick={() => setShowCanSelector(!showCanSelector)} style={{ padding: '0.75rem', fontSize: '0.8rem', background: showCanSelector ? 'rgba(255,255,255,0.1)' : '' }}>🥤 Analcolici</Button>
              <Button variant="secondary" onClick={() => { recordServiceCall('pulizia', { table: userTable }); addNotification('Pulizia', 'Il cameriere sta arrivando', 'success'); }} style={{ padding: '0.75rem', fontSize: '0.8rem' }}>🧹 Pulizia</Button>
              <Button variant="secondary" onClick={() => { recordServiceCall('sos', { table: userTable }); addNotification('SOS', 'La sicurezza è stata allertata', 'error'); }} style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--error)', borderColor: 'var(--error)' }}>🚨 SOS</Button>
            </div>

            {showCanSelector && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>Ordina Analcolici</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <select className="input-base" style={{ flex: 1, marginBottom: 0, color: 'black' }} value={canType} onChange={e => setCanType(e.target.value)}>
                          {MIXERS_LIST.map(m => <option key={m.name} value={m.name}>{m.name} — € {m.price}</option>)}
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '10px', padding: '0 0.5rem' }}>
                          <button onClick={() => setCanQty(Math.max(1, canQty - 1))} style={{ border: 'none', background: 'none', padding: '0.4rem', cursor: 'pointer' }}><Minus size={14}/></button>
                          <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, color: 'black' }}>{canQty}</span>
                          <button onClick={() => setCanQty(canQty + 1)} style={{ border: 'none', background: 'none', padding: '0.4rem', cursor: 'pointer' }}><Plus size={14}/></button>
                      </div>
                  </div>
                  <Button variant="primary" onClick={() => { recordServiceCall('lattine', { qty: canQty, type: canType }); addNotification('Analcolici', `${canQty}x ${canType} in arrivo`, 'success'); setShowCanSelector(false); }} style={{ width: '100%' }}>CONFERMA ORDINE</Button>
              </div>
            )}
         </Accordion>
      )}

      <Accordion title="Lascia Recensione" icon={<Star size={16} />} borderColor="rgba(255,255,255,0.15)">
        <button onClick={() => navigate('/reviews')} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          ⭐ Valuta Serata, Servizio e Esperienza
        </button>
      </Accordion>

      <EmergencyPanel />

      </div>

      {/* ─── FOOTER: Contatti & Info ─── */}
      <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Contatti & Info
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MapPin size={16} color="var(--accent-light)" />
            <div>
              <p style={{ fontSize: '0.8rem', margin: 0, fontWeight: 600 }}>Corso Moncalieri, 145</p>
              <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-secondary)' }}>10100 Torino TO</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Phone size={16} color="var(--success)" />
            <div>
              <p style={{ fontSize: '0.8rem', margin: 0, fontWeight: 600 }}>+39 335 675 7894</p>
              <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-secondary)' }}>Prenotazioni & Info 24/7</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={16} color="var(--warning)" />
            <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-secondary)' }}>
              <strong>Orari:</strong> Mer, Dom 23:30-04 | Ven, Sab 21:00-04
            </p>
          </div>
        </div>

        {/* Social & Links */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #833AB4, #E1306C, #F56040)',
            color: 'white', textDecoration: 'none', border: 'none',
          }}>
            <Instagram size={14} /> Instagram
          </a>
          <a href="https://toomuch.it" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'white', textDecoration: 'none',
          }}>
            <Globe size={14} /> Sito Web
          </a>
          <a href="https://wa.me/393356757894" target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
            background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)',
            color: '#25D366', textDecoration: 'none',
          }}>
            <MessageCircle size={14} /> WhatsApp
          </a>
        </div>
      </div>

      {/* Dev Only */}
      <p onClick={simulateEntry} style={{ fontSize: '0.65rem', textAlign: 'center', color: 'rgba(255,255,255,0.12)', textDecoration: 'underline', cursor: 'pointer', marginTop: '0.5rem', paddingBottom: '2rem' }}>
        [Dev: Simula Scanner {hasEntered ? 'Uscita' : 'Ingresso'}]
      </p>

      <style>{`@keyframes heartbeat { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.08);opacity:.85} }`}</style>
    </div>
  );
}
