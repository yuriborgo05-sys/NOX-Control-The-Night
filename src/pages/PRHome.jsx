import React, { useState, useEffect } from 'react';
import { streamPrStats, streamOrders, recordServiceCall } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { NoxIcon } from '../components/NoxIcon';
import { useNavigate } from 'react-router-dom';
import { EmergencyPanel } from '../components/EmergencyPanel';
import { ManualTableCreate } from '../components/ManualTableCreate';
import { useNox } from '../context/NoxContext';
import { useNotification } from '../context/NotificationContext';
import { useRef } from 'react';
import { playNotificationSound } from '../utils/audio';

export function PRHome() {
  const { user, logout } = useAuth();
  const { config } = useNox();
  const navigate = useNavigate();
  const [livePrData, setLivePrData] = useState({ revenue: 450, bottles: 3 });
  const [allOrders, setAllOrders] = useState([]);
  const [lbCategory, setLbCategory] = useState('fatturato');
  const [lbPeriod, setLbPeriod] = useState('serata');
  const [reqSent, setReqSent] = useState(null);
  const { addNotification } = useNotification();
  
  const prevStatuses = useRef({});
  const prevEntries = useRef({}); 
  const isFirstLoadOrders = useRef(true);

  useEffect(() => {
    if (user?.id) {
      const unsubStats = streamPrStats(user.id, (data) => {
        if (data) setLivePrData(data);
      });
      const unsubOrders = streamOrders((orders) => {
        setAllOrders(orders);
        
        // PR Notification Logic: Notify when THEIR tables' orders change status
        if (!isFirstLoadOrders.current) {
          orders.forEach(order => {
            const isMyOrder = order.pr === user?.name || order.prAssigned === user?.name;
            if (isMyOrder) {
              const prevStatus = prevStatuses.current[order.id];
              if (prevStatus && prevStatus !== order.status) {
                let msg = "";
                if (order.status === 'preparing') msg = `Ordine Tavolo ${order.table} in preparazione.`;
                if (order.status === 'ready') msg = `🔥 Ordine Tavolo ${order.table} PRONTO al ritiro!`;
                if (order.status === 'delivered') msg = `Ordine Tavolo ${order.table} consegnato con successo.`;
                
                if (msg) {
                  addNotification("Aggiornamento Tavolo", msg, "info");
                  playNotificationSound();
                }
              }
              
              // NEW Entry Detection
              const wasEntered = prevEntries.current[order.id];
              if (order.isEntered && !wasEntered) {
                addNotification("🛬 Arrivo Ospiti", `Il tuo tavolo ${order.table} (${order.pax} persone) è appena entrato!`, "success");
                playNotificationSound();
              }

              prevStatuses.current[order.id] = order.status;
              prevEntries.current[order.id] = order.isEntered;
            }
          });
        } else {
          orders.forEach(o => { 
            prevStatuses.current[o.id] = o.status; 
            prevEntries.current[o.id] = o.isEntered;
          });
          isFirstLoadOrders.current = false;
        }
      });
      return () => { unsubStats(); unsubOrders(); };
    }
  }, [user]);

  // Derive Dynamic Leaderboards from allOrders
  const dynamicPrData = allOrders.reduce((acc, order) => {
    const prName = order.pr || 'Organico';
    if (!acc[prName]) {
      acc[prName] = { name: prName, fatturato: 0, bottiglie: 0, tavoli: new Set(), persone: 0, me: prName === user?.name };
    }
    acc[prName].fatturato += order.total || 0;
    acc[prName].bottiglie += order.items?.reduce((sum, i) => sum + i.qty, 0) || 0;
    acc[prName].tavoli.add(order.table);
    acc[prName].persone += order.people || 0;
    return acc;
  }, {});

  const deriveRankable = (catKey) => {
    return Object.values(dynamicPrData)
      .map(pr => ({
        name: pr.name,
        me: pr.me,
        num: catKey === 'tavoli' ? pr[catKey].size : pr[catKey],
        val: catKey === 'fatturato' ? `€ ${pr.fatturato}` : `${catKey === 'tavoli' ? pr[catKey].size : pr[catKey]}`
      }))
      .sort((a, b) => b.num - a.num)
      .map((row, i) => ({ ...row, pos: i + 1 }));
  };

  const currentLB = deriveRankable(lbCategory === 'media_spesa' ? 'fatturato' : lbCategory); // Simplified for now

  const handleRunReq = async (type) => {
      setReqSent(type);
      try {
          // Usa il db reale per far arrivare la chiamata allo staff/cambusa
          await recordServiceCall('assistenza_pr', { prName: user?.name, request: type, table: `PR ${user?.name || ''}`.trim() });
      } catch (err) {
          console.error("Errore invio richiesta:", err);
      }
      setTimeout(() => setReqSent(null), 3500);
  }

  const downloadCSV = () => {
    const data = leaderboards[lbPeriod][lbCategory];
    let csvContent = "data:text/csv;charset=utf-8,Posizione,Nome,Valore\n";
    data.forEach(row => {
      csvContent += `${row.pos},${row.name},${row.val}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `classifica_${config?.clubName?.toLowerCase() || 'nox'}_${lbPeriod}_${lbCategory}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulated Leaderboards for Night and Month
  const leaderboards = {
      serata: {
          fatturato: [
              { pos: 1, name: 'Alex Rossi', val: '€ 1.200', num: 1200 },
              { pos: 2, name: 'Giulia B.', val: '€ 850', num: 850 },
              { pos: 3, name: user?.name || 'Tu', val: '€ 450', num: 450, me: true },
              { pos: 4, name: 'Francesca N.', val: '€ 200', num: 200 }
          ],
          bottiglie: [
              { pos: 1, name: 'Alex Rossi', val: '7', num: 7 },
              { pos: 2, name: user?.name || 'Tu', val: '3', num: 3, me: true },
              { pos: 3, name: 'Giulia B.', val: '2', num: 2 },
              { pos: 4, name: 'Francesca N.', val: '1', num: 1 }
          ],
          persone: [
              { pos: 1, name: 'Giulia B.', val: '42 Persone', num: 42 },
              { pos: 2, name: 'Alex Rossi', val: '28 Persone', num: 28 },
              { pos: 3, name: 'Francesca N.', val: '15 Persone', num: 15 },
              { pos: 4, name: user?.name || 'Tu', val: '9 Persone', num: 9, me: true }
          ],
          tavoli: [
              { pos: 1, name: 'Giulia B.', val: '4 Tavoli', num: 4 },
              { pos: 2, name: 'Alex Rossi', val: '3 Tavoli', num: 3 },
              { pos: 3, name: user?.name || 'Tu', val: '2 Tavoli', num: 2, me: true },
              { pos: 4, name: 'Francesca N.', val: '1 Tavoli', num: 1 }
          ],
          media_spesa: [
              { pos: 1, name: 'Alex Rossi', val: '€ 400', num: 400 },
              { pos: 2, name: user?.name || 'Tu', val: '€ 225', num: 225, me: true },
              { pos: 3, name: 'Giulia B.', val: '€ 212', num: 212 },
              { pos: 4, name: 'Francesca N.', val: '€ 200', num: 200 }
          ]
      },
      mese: {
          fatturato: [
              { pos: 1, name: 'Giulia B.', val: '€ 12.500', num: 12500 },
              { pos: 2, name: user?.name || 'Tu', val: '€ 10.800', num: 10800, me: true },
              { pos: 3, name: 'Alex Rossi', val: '€ 9.400', num: 9400 },
              { pos: 4, name: 'Francesca N.', val: '€ 4.500', num: 4500 }
          ],
          bottiglie: [
              { pos: 1, name: user?.name || 'Tu', val: '84', num: 84, me: true },
              { pos: 2, name: 'Giulia B.', val: '72', num: 72 },
              { pos: 3, name: 'Alex Rossi', val: '65', num: 65 },
              { pos: 4, name: 'Francesca N.', val: '30', num: 30 }
          ],
          persone: [
              { pos: 1, name: 'Giulia B.', val: '420 Persone', num: 420 },
              { pos: 2, name: 'Alex Rossi', val: '380 Persone', num: 380 },
              { pos: 3, name: user?.name || 'Tu', val: '310 Persone', num: 310, me: true },
              { pos: 4, name: 'Francesca N.', val: '150 Persone', num: 150 }
          ],
          tavoli: [
              { pos: 1, name: 'Alex Rossi', val: '35 Tavoli', num: 35 },
              { pos: 2, name: 'Giulia B.', val: '32 Tavoli', num: 32 },
              { pos: 3, name: user?.name || 'Tu', val: '28 Tavoli', num: 28, me: true },
              { pos: 4, name: 'Francesca N.', val: '12 Tavoli', num: 12 }
          ],
          media_spesa: [
              { pos: 1, name: 'Giulia B.', val: '€ 390', num: 390 },
              { pos: 2, name: user?.name || 'Tu', val: '€ 385', num: 385, me: true },
              { pos: 3, name: 'Alex Rossi', val: '€ 270', num: 270 },
              { pos: 4, name: 'Francesca N.', val: '€ 260', num: 260 }
          ]
      }
  };

  const lbData = currentLB.length > 0 ? currentLB : leaderboards.serata[lbCategory];
  const myPosIndex = lbData.findIndex(x => x.me);
  const me = lbData[myPosIndex] || { num: 0 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, paddingBottom: '3rem' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1.25rem', 
        borderRadius: '24px', 
        background: 'linear-gradient(135deg, rgba(20,20,20,0.8), rgba(10,10,10,0.95))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              width: '48px', 
              height: '48px', 
              background: 'linear-gradient(45deg, var(--accent-color), var(--accent-light))', 
              borderRadius: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(124,58,237,0.3)'
            }}>
                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white' }}>{user?.name?.charAt(0)}</span>
            </div>
            <div>
                <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 900, letterSpacing: '1px', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PR CORE</h2>
                <p style={{ color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} /> ONLINE: {user?.name}
                </p>
            </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.6rem 1rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.8rem' }}>
          <NoxIcon name="log-out" size={16} /> ESCI
        </button>
      </header>

      {/* DASHBOARD LIVE STATS RECAP */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <Card style={{ padding: '1rem', borderTop: '3px solid var(--accent-color)', background: 'rgba(94, 92, 230, 0.05)' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incasso Serata</h4>
          <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', margin: '0.2rem 0' }}>€ {livePrData.revenue}</p>
          <span style={{ fontSize: '0.65rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '2px' }}><NoxIcon name="arrow-up" size={10}/> Fatturato OK</span>
        </Card>
        <Card style={{ padding: '1rem', borderTop: '3px solid var(--warning)', background: 'rgba(255, 159, 10, 0.05)' }}>
          <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bott. Serata</h4>
          <p style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', margin: '0.2rem 0' }}>{livePrData.bottles}</p>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Trend in salita</span>
        </Card>
      </div>

      {/* LIVE TOP 3 DASHBOARD (Nuova Funzione) */}
      <Card style={{ padding: '1.25rem 1rem', background: 'rgba(0,0,0,0.3)', borderColor: 'var(--success)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', margin: '0 0 1rem 0', color: 'white' }}>
            <NoxIcon name="trophy" size={20} color="var(--success)" /> Live Top 3 Tables
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
             {Object.entries(allOrders.reduce((acc, o) => {
                 const table = o.table || 'Anonimo';
                 acc[table] = (acc[table] || 0) + (o.total || 0);
                 return acc;
             }, {})).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([table, spend], i) => {
                // Algoritmo RFM Visivo Semplificato
                let rfmBadge = '🔥 Hot';
                if (spend >= 1500) rfmBadge = '🐳 Whale';
                if (spend < 300) rfmBadge = '❄️ Cold';

                return (
                  <div key={table} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', borderLeft: `3px solid ${i === 0 ? 'var(--gold)' : i === 1 ? 'silver' : '#cd7f32'}` }}>
                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                       <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>#{i+1} {table}</span>
                       <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Status: {rfmBadge}</span>
                     </div>
                     <strong style={{ color: i === 0 ? 'var(--gold)' : 'white', fontSize: '1.05rem' }}>€ {spend}</strong>
                  </div>
                );
             })}
             
             <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>🏆 Record Mensile (Single Night)</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <strong style={{ color: 'var(--gold)', fontSize: '0.9rem' }}>Tavolo VIP 2</strong>
                   <strong style={{ fontSize: '1rem' }}>€ 15.400</strong>
                </div>
             </div>
          </div>
      </Card>

      {/* RECENT ORDERS FEED WITH GIFT MESSAGES */}
      <Card style={{ padding: '1.25rem 1rem', background: 'rgba(0,0,0,0.2)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', margin: '0 0 1rem 0', color: 'white' }}>
            <NoxIcon name="wine" size={20} color="var(--accent-light)" /> Ultimi Ordini
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {allOrders.slice(0, 5).map(order => (
                <div key={order.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{order.table}</strong>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-light)' }}>€ {order.total}</span>
                   </div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {order.items?.map(it => `${it.qty}x ${it.name}`).join(', ')}
                   </div>
                   {order.giftMessage && (
                      <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(255,208,96,0.08)', borderRadius: '10px', borderLeft: '3px solid var(--gold)' }}>
                         <p style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 800, margin: '0 0 0.2rem 0', textTransform: 'uppercase' }}>Messaggio Regalo</p>
                         <p style={{ fontSize: '0.8rem', color: 'white', fontStyle: 'italic', margin: 0 }}>"{order.giftMessage}"</p>
                      </div>
                   )}
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.6rem', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                      <span>PR: {order.pr}</span>
                      <span>{order.time}</span>
                   </div>
                </div>
             ))}
             {allOrders.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Nessun ordine recente</p>}
          </div>
      </Card>

      {/* CREAZIONE MANUALE TAVOLO */}
      <ManualTableCreate prName={user?.name || 'PR'} />

      {/* MAPPA TAVOLI */}
      <Card style={{ padding: '1rem', cursor: 'pointer', borderColor: 'var(--accent-color)' }} onClick={() => navigate('/reserve')}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NoxIcon name="map" size={22} color="var(--accent-color)" />
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Mappa Tavoli</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vedi disposizione, stato e disponibilità</p>
            </div>
          </div>
        </div>
      </Card>

      {/* RICHIESTE RAPIDE */}
      <Card style={{ padding: '1.25rem 1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><NoxIcon name="zap" size={18} color="var(--warning)"/> Richieste Rapide</h3>
        {!reqSent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button variant="secondary" onClick={() => handleRunReq('Ghiaccio')} style={{ flex: 1, padding: '0.75rem', display: 'flex', justifyContent: 'center', gap: '0.4rem', borderColor: 'rgba(255,255,255,0.1)' }}><NoxIcon name="ice-cream" size={16}/> Ghiaccio</Button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><NoxIcon name="cup-soda" size={14}/> Analcolici</p>
                <select className="input-base" style={{ marginBottom: '0.6rem', color: 'black' }} id="pr-drink-select">
                  <option value="" disabled style={{color:'black'}}>Seleziona bevanda...</option>
                  <option value="Coca Cola" style={{color:'black'}}>Coca Cola — € 5</option>
                  <option value="Lemon Soda" style={{color:'black'}}>Lemon Soda — € 5</option>
                  <option value="Succo Arancia" style={{color:'black'}}>Succo Arancia — € 5</option>
                  <option value="Succo Ananas" style={{color:'black'}}>Succo Ananas — € 5</option>
                  <option value="Tonica" style={{color:'black'}}>Tonica Schweppes — € 5</option>
                  <option value="Red Bull" style={{color:'black'}}>Red Bull — € 8</option>
                  <option value="Acqua Naturale" style={{color:'black'}}>Acqua Naturale — € 3</option>
                  <option value="Acqua Frizzante" style={{color:'black'}}>Acqua Frizzante — € 3</option>
                </select>
                <Button variant="secondary" onClick={() => handleRunReq('Analcolico')} style={{ width: '100%', padding: '0.6rem', borderColor: 'rgba(255,255,255,0.1)' }}>Invia Richiesta</Button>
              </div>
            </div>
        ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', padding: '0.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '8px' }}>
                <NoxIcon name="check-circle-2" size={18} /> Richiesta {reqSent} Inviata!
            </div>
        )}
      </Card>

      {/* LEADERBOARD (CLASSIFICA) CON DISTACCO */}
      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', margin: 0, color: 'white' }}>
              <NoxIcon name="trophy" size={20} color="gold" /> Classifica Staff
            </h3>
            <button onClick={downloadCSV} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>
               Scarica CSV
            </button>
        </div>

        {/* Period Selector Tabs */}
        <div style={{ display: 'flex', padding: '0 1.25rem 1rem 1.25rem', gap: '0.5rem' }}>
           <button 
             onClick={() => setLbPeriod('serata')}
             style={{ flex: 1, padding: '0.5rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, border: 'none', background: lbPeriod === 'serata' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: lbPeriod === 'serata' ? 'white' : 'var(--text-secondary)' }}
           >SERATA</button>
           <button 
             onClick={() => setLbPeriod('mese')}
             style={{ flex: 1, padding: '0.5rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700, border: 'none', background: lbPeriod === 'mese' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: lbPeriod === 'mese' ? 'white' : 'var(--text-secondary)' }}
           >MENSILE</button>
        </div>
        
        <div style={{ padding: '0 1.25rem', overflowX: 'auto', display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', scrollbarWidth: 'none' }}>
           {['fatturato', 'bottiglie', 'persone', 'tavoli', 'media_spesa'].map(cat => (
               <button 
                   key={cat} 
                   onClick={() => setLbCategory(cat)} 
                   style={{ padding: '0.5rem 1rem', fontSize: '0.7rem', fontWeight: 700, borderRadius: '20px', textTransform: 'uppercase', whiteSpace: 'nowrap', border: 'none', background: lbCategory === cat ? 'rgba(255,255,255,0.1)' : 'transparent', color: lbCategory === cat ? 'var(--accent-light)' : 'var(--text-secondary)', cursor: 'pointer' }}
               >
                  {cat.replace('_', ' ')}
               </button>
           ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
            {lbData.map((row, index) => {
                const isMe = row.me;
                let gapStr = '';
                if(index < myPosIndex) {
                    const diff = row.num - me.num;
                    gapStr = `Mancano ${diff} per superarlo`;
                } else if(index > myPosIndex) {
                    const diff = me.num - row.num;
                    gapStr = `Fronteggiato da ${diff}`;
                } else {
                    gapStr = 'Tu sei qui';
                }

                return (
                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', background: isMe ? 'rgba(94, 92, 230, 0.12)' : 'transparent', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '28px', textAlign: 'center' }}>
                                <strong style={{ fontSize: '1.1rem', color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--text-secondary)' }}>{index + 1}</strong>
                            </div>
                            <div>
                                <span style={{ fontWeight: isMe ? 900 : 500, fontSize: '0.9rem', color: isMe ? 'white' : 'rgba(255,255,255,0.8)' }}>{row.name} {isMe && '(IO)'}</span>
                                <span style={{ display: 'block', fontSize: '0.65rem', color: isMe ? 'var(--accent-light)' : (index < myPosIndex ? '#ff9f0a' : '#30d158'), marginTop: '0.1rem', fontWeight: 600 }}>{gapStr.toUpperCase()}</span>
                            </div>
                        </div>
                        <strong style={{ fontSize: '1rem', color: isMe ? 'white' : 'var(--text-secondary)' }}>{row.val}</strong>
                    </div>
                )
            })}
        </div>
      </Card>

      <EmergencyPanel />
    </div>
  );
}
