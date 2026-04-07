import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, GlassWater, History, CheckCircle, XCircle, Clock, Wine, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';

export function CustomerProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [drinkState, setDrinkState] = useState('disponibile');
  const cycleDrinkState = () => {
     if (drinkState === 'disponibile' && 'vibrate' in navigator) navigator.vibrate([150, 50, 150]);
     const states = ['disponibile', 'usato'];
     setDrinkState(states[(states.indexOf(drinkState) + 1) % states.length]);
  };
  const isAvailable = drinkState === 'disponibile';

  // Stato bottiglia simulato per dimostrazione ("pagata" -> "in preparazione" -> "pronta" -> "in consegna" -> "Chiusa (QR Validato)")
  const [bottleState, setBottleState] = useState('in preparazione');
  const cycleBottleState = () => {
      const states = ['pagata', 'in preparazione', 'pronta', 'in consegna', 'QR Validato (Chiusa)'];
      setBottleState(states[(states.indexOf(bottleState) + 1) % states.length]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', flex: 1, paddingBottom: '2rem' }}>
       <header style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/customer')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><ArrowLeft size={24} /></button>
          <h2 style={{ margin: 0 }}>Profilo Cliente</h2>
       </header>

       <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div className="vip-avatar-container">
            <Avatar name={user?.name || 'Utente Demo'} size={60} />
          </div>
          <div>
             <h3 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {user?.name || 'Utente Demo'} 
                <span style={{ fontSize: '0.65rem', background: 'gold', color: 'black', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>BLACK CARD</span>
             </h3>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>👑 Top VIP (Spesa Storica &gt; 1500€)</p>
          </div>
       </div>

       {/* QR Ingresso Regolare */}
       <Card style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem 1rem' }}>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem', border: '4px solid var(--accent-color)' }}>
             <QrCode size={180} color="black" />
          </div>
          <h3 style={{ marginBottom: '0.5rem' }}>QR Ingresso Personale</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '0 1rem' }}>Mostra questo QR alla sicurezza. Diventerà inutilizzabile immediatamente dopo l'accesso.</p>
       </Card>

       {/* STATUS ORDINI BOTTIGLIE - LIVE TIMELINE */}
       <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingLeft: '0.5rem' }}><Wine size={20} color="var(--accent-color)"/> Ordini in Corso</h3>
       <Card style={{ marginBottom: '1.5rem', borderColor: bottleState === 'in consegna' ? 'var(--success)' : 'var(--border-card)', cursor: 'pointer' }} onClick={cycleBottleState}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                  <h4 style={{ margin: 0 }}>Dom Perignon Vintage</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Ordine #9482 • 500 €</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>TAV. 14</div>
          </div>
          
          {/* Tracking Timeline */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '1rem', marginBottom: bottleState === 'in consegna' ? '1.5rem' : 0 }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                 <div style={{ height: 10, width: 10, borderRadius: '50%', background: ['pagata', 'in preparazione', 'pronta', 'in consegna', 'QR Validato (Chiusa)'].includes(bottleState) ? 'var(--success)' : '#333' }}></div>
                 <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pagata in App</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                 <div style={{ height: 10, width: 10, borderRadius: '50%', background: ['in preparazione', 'pronta', 'in consegna', 'QR Validato (Chiusa)'].includes(bottleState) ? 'var(--accent-color)' : '#333', boxShadow: bottleState === 'in preparazione' ? '0 0 10px var(--accent-color)' : 'none' }}></div>
                 <span style={{ fontSize: '0.85rem', color: bottleState === 'in preparazione' ? 'white' : 'var(--text-secondary)', fontWeight: bottleState === 'in preparazione' ? 600 : 400 }}>Cassa: In Preparazione</span>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                 <div style={{ height: 10, width: 10, borderRadius: '50%', background: ['in consegna', 'QR Validato (Chiusa)'].includes(bottleState) ? 'var(--warning)' : '#333', boxShadow: bottleState === 'in consegna' ? '0 0 10px var(--warning)' : 'none' }}></div>
                 <span style={{ fontSize: '0.85rem', color: bottleState === 'in consegna' ? 'white' : 'var(--text-secondary)', fontWeight: bottleState === 'in consegna' ? 600 : 400 }}>In Consegna al Tavolo</span>
             </div>
          </div>

          {bottleState === 'QR Validato (Chiusa)' && (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'gray', marginTop: '1rem' }}>
                <CheckCircle2 size={16} /> <span>Consegna Completata dal Cameriere. Chiuso.</span>
             </div>
          )}
          
          <p style={{ fontSize: '0.65rem', textAlign: 'center', color: 'gray', marginTop: '1rem', fontStyle: 'italic' }}>👆 (Tocca la card per testare le fasi dal punto di vista gestionale)</p>
       </Card>

       {/* DRINK OMAGGIO ANIMATO E CON STATI REALI */}
       <Card onClick={cycleDrinkState} style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', background: isAvailable ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16,185,129,0.05) 100%)' : 'rgba(255,255,255,0.02)', borderColor: isAvailable ? 'var(--success)' : 'var(--border-card)', position: 'relative', overflow: 'hidden', cursor: 'pointer', opacity: isAvailable ? 1 : 0.6 }}>
          {isAvailable && (<div style={{ position: 'absolute', top: 0, bottom: 0, left: '-100%', width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: 'shimmer 2.5s infinite' }} />)}
          <div style={{ background: isAvailable ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', zIndex: 1 }}><GlassWater size={36} color={isAvailable ? "var(--success)" : "var(--text-secondary)"} /></div>
          <div style={{ flex: 1, zIndex: 1 }}>
            <h4 style={{ color: isAvailable ? 'var(--success)' : 'var(--text-secondary)', marginBottom: '0.2rem', fontSize: '1.1rem' }}>1x Drink Omaggio</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
               {drinkState === 'disponibile' && <><CheckCircle size={14} color="var(--success)"/><span style={{ fontSize: '0.85rem', color: 'var(--text-primary)'}}>Da utilizzare in cassa</span></>}
               {drinkState === 'usato' && <><CheckCircle size={14} color="gray"/><span style={{ fontSize: '0.85rem', color: 'gray'}}>Già riscattato.</span></>}
            </div>
          </div>
       </Card>

       <style>{`@keyframes shimmer { 0% { left: -100% } 100% { left: 200% } }`}</style>
    </div>
  );
}
