import React, { useState, useEffect } from 'react';
import { streamOrders, streamAnalytics } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { EmergencyPanel } from '../components/EmergencyPanel';
import { PRLeaderboard } from '../components/PRLeaderboard';
import { Card } from '../components/Card';
import { Accordion } from '../components/Accordion';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, PieChart, TrendingUp, Download, Users, 
  Crown, Star, Wine, BarChart3, Filter, MapPin, 
  AlertCircle, Snowflake, Package, Siren, Car 
} from 'lucide-react';
import { useNox } from '../context/NoxContext';
import { useNoxStore } from '../store';

const TABS = ['KPI & Clientela', 'Logistica & Sicurezza', 'Bottiglie & Bar', 'Heatmap', 'Staff Performance'];



export function DirectionAnalytics() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { config } = useNox();
  const [activeTab, setActiveTab] = useState(0);
  const { 
    analytics: stats, 
    orders: liveOrders, 
    isInitialSyncDone 
  } = useNoxStore();

  // Derive PR statistics from live orders
  const derivedPrData = liveOrders.reduce((acc, order) => {
    const prName = order.pr || 'Organico';
    if (!acc[prName]) {
      acc[prName] = { name: prName, avatar: prName.charAt(0), fatturato: 0, bottiglie: 0, tavoli: new Set(), persone: 0, mediaSpesa: 0 };
    }
    acc[prName].fatturato += order.total || 0;
    acc[prName].bottiglie += order.items?.reduce((sum, i) => sum + i.qty, 0) || 0;
    acc[prName].tavoli.add(order.table);
    acc[prName].persone += order.people || 0;
    return acc;
  }, {});

  const prList = Object.values(derivedPrData).map(pr => ({
    ...pr,
    tavoli: pr.tavoli.size,
    mediaSpesa: pr.tavoli.size > 0 ? pr.fatturato / pr.tavoli.size : 0
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '3rem' }}>

      {/* ─── HEADER ─── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--gold-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--gold)' }}>
                <span style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--gold)' }}>{user?.name?.charAt(0) || 'D'}</span>
            </div>
            <div>
                <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'white', letterSpacing: '0.05em' }}>DIREZIONE MASTER</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>Ecosistema {config?.clubName || 'NOX'} v2.0</p>
            </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,69,58,0.15)', border: '1px solid rgba(255,69,58,0.3)', color: '#ff453a', padding: '0.7rem 1.2rem', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LogOut size={20} />
          <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>ESCI</span>
        </button>
      </header>

      {/* ─── GLOBAL FILTERS (Compact) ─── */}
      <Accordion title="Filtri Globali" icon={<Filter size={15} />} defaultOpen={false}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {[
            { label: 'Periodo', opts: ['Ultimi 6 Mesi (Storico)', 'Mese Corrente', 'Oggi', 'Ieri', 'Ultima Settimana'] },
            { label: 'Locale', opts: ['Tutti i Locali', `${config?.clubName || 'NOX'} Club`] },
            { label: 'Evento', opts: ['Tutti gli Eventi', `Venerdì ${config?.clubName || 'NOX'}`, 'Sabato Privé'] },
            { label: 'PR', opts: ['Tutti i PR', 'Alex Rossi', 'Giulia B.', 'Marco T.'] },
            { label: 'Tipologia Cliente', opts: ['Tutti', 'Prima Volta', 'Abituali', 'VIP'] },
          ].map(({ label, opts }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', minWidth: '110px' }}>{label}</span>
              <select className="input-base" style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}>
                {opts.map(o => <option key={o} style={{ color: 'black' }}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
      </Accordion>

      {/* ─── TAB BAR ─── */}
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', padding: '1rem 0 0.75rem', scrollbarWidth: 'none' }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)} style={{
            padding: '0.45rem 0.85rem', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: 'none', flexShrink: 0,
            background: activeTab === i ? 'var(--accent-color)' : 'var(--bg-card)',
            color: activeTab === i ? 'white' : 'var(--text-secondary)',
            boxShadow: activeTab === i ? '0 2px 12px var(--accent-glow)' : 'none',
            transition: 'all 0.2s ease'
          }}>{tab}</button>
        ))}
      </div>

      {/* ─── TAB CONTENT ─── */}

      {/* TAB 0: KPI & Clientela */}
      {activeTab === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Cliente del Mese */}
          <Card style={{ padding: '1.25rem', background: 'linear-gradient(135deg, var(--gold-bg), rgba(0,0,0,0.3))', borderColor: 'rgba(255,208,96,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Crown size={36} color="var(--gold)" />
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--gold)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cliente del Mese</p>
                <strong style={{ fontSize: '1.4rem', display: 'block', marginTop: '0.1rem' }}>Davide Bianchi</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Spesa: <strong style={{ color: 'var(--gold)' }}>€ 5.400</strong> — Console VIP</span>
              </div>
            </div>
          </Card>

          {/* Entry Types KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Card style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.3rem' }}>Uomini (Males)</p>
              <strong style={{ fontSize: '1.2rem', color: 'var(--accent-light)' }}>{stats.maleEntries || 0} <small style={{fontSize:'0.7rem', opacity:0.6}}>({Math.round((stats.maleEntries/(stats.totalEntries||1))*100)}%)</small></strong>
            </Card>
            <Card style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 0.3rem' }}>Donne (Females)</p>
              <strong style={{ fontSize: '1.2rem', color: 'var(--warning)' }}>{stats.femaleEntries || 0} <small style={{fontSize:'0.7rem', opacity:0.6}}>({Math.round((stats.femaleEntries/(stats.totalEntries||1))*100)}%)</small></strong>
            </Card>
          </div>

          {/* Gender Breakdown detailed */}
          <Card style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Bilancio Pubblico</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  <span>Rapporto Genere</span>
                  <span>{stats.maleEntries || 0} M / {stats.femaleEntries || 0} F</span>
              </div>
              <div style={{ display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ width: `${((stats.maleEntries || 0)/(stats.totalEntries || 1))*100}%`, background: '#3b82f6', transition: 'width 0.5s ease' }}></div>
                  <div style={{ width: `${((stats.femaleEntries || 0)/(stats.totalEntries || 1))*100}%`, background: '#ec4899', transition: 'width 0.5s ease' }}></div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.75rem', textAlign: 'center' }}>
                Totale Presenze: <strong>{stats.totalEntries || 0} persone</strong>
              </p>
          </Card>

          {/* App Conversion */}
          <Card style={{ padding: '1.25rem', borderLeft: '4px solid var(--accent-glow)' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Conversione App &rarr; Tavolo</p>
              {(() => {
                  const uniqueAccess = new Set((stats.appAccesses || []).map(a => a.userId)).size;
                  const bookings = (stats.tableBookings || []).length || 0;
                  const totalBottles = (stats.tableBookings || []).reduce((s, b) => s + (b.bottles || 0), 0);
                  const totalPeople = (stats.tableBookings || []).reduce((s, b) => s + (b.people || 0), 0);
                  return (
                    <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ fontSize: '1.5rem' }}>{uniqueAccess > 0 ? Math.round((bookings/uniqueAccess)*100) : 0}%</strong>
                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                <div>{uniqueAccess} Accessi Unici</div>
                                <div style={{ color: 'var(--success)' }}>{bookings} Prenotazioni stasera</div>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'gray', marginTop: '0.5rem' }}>Volume: {totalBottles} Bottiglie / {totalPeople} Persone portate.</p>
                    </div>
                  );
              })()}
          </Card>
        </div>
      )}

      {/* TAB 1: Logistica & Sicurezza */}
      {activeTab === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Incidents Report */}
          <Card style={{ borderLeft: '4px solid var(--error)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Incidenti e Risse</p>
                    <strong style={{ fontSize: '1.5rem', color: 'var(--error)' }}>{(stats.incidents || []).length} segnalati</strong>
                </div>
                <AlertCircle size={32} color="var(--error)" />
            </div>
          </Card>

          {/* Emergency Services */}

          {/* Emergency Services */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Card style={{ padding: '1rem', borderTop: '2px solid #ff0000' }}>
                <Siren size={18} color="#ff0000" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>SOS Inviati</p>
                <strong style={{ fontSize: '1.2rem' }}>{stats.sosAlerts}</strong>
            </Card>
            <Card style={{ padding: '1rem', borderTop: '2px solid #000' }}>
                <Car size={18} color="white" style={{ marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>Chiamate UBER</p>
                <strong style={{ fontSize: '1.2rem' }}>{stats.uberCalls}</strong>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Bottiglie */}
      {activeTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Accordion title="Economia Bottiglie" icon={<Wine size={15} />} defaultOpen={true} borderColor="var(--warning)">
            {[
              { label: 'Tavoli Totali (Live)', value: liveOrders.length, sub: 'In-App Orders', color: 'var(--text-primary)' },
              { label: 'Fatturato Tavoli', value: `€ ${stats.tableRevenue || 0}`, sub: 'Validati', color: 'var(--success)' },
              { label: 'Media Spesa per Tavolo', value: `€ ${liveOrders.length > 0 ? Math.round(stats.tableRevenue / liveOrders.length) : 0}`, sub: 'Effettiva', color: 'var(--accent-light)' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem' }}>{label}</span>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ color, fontSize: '1rem', display: 'block' }}>{value}</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{sub}</span>
                </div>
              </div>
            ))}
          </Accordion>

          <Accordion title="Top Bottiglie Vendute" icon={<TrendingUp size={15} />} borderColor="var(--accent-color)">
            {[
              ['Dom Pérignon Vintage', 24, 'var(--gold)'],
              ['Belvedere Vodka 1L', 18, 'var(--accent-light)'],
              ['Moët & Chandon Ice', 12, 'var(--success)'],
              ['Gin Bombay Sapphire', 6, 'var(--text-secondary)'],
            ].map(([name, count, color], i) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-card)', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>{i + 1}. {name}</span>
                <strong style={{ color }}>{count} pz</strong>
              </div>
            ))}
            <button style={{ width: '100%', marginTop: '0.75rem', padding: '0.65rem', background: 'transparent', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Download size={15} /> Esporta CSV Completo
            </button>
          </Accordion>

          <Accordion title="Top Mixers (Analcolici)" icon={<Wine size={15} />} borderColor="var(--warning)">
            {[
              ['Red Bull', 1420, 'var(--accent-color)'],
              ['Schweppes Lemon', 850, 'var(--warning)'],
              ['Tonica', 640, 'var(--success)'],
              ['Coca-Cola', 420, 'var(--error)'],
            ].map(([name, count, color], i) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-card)', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem' }}>{i + 1}. {name}</span>
                <strong style={{ color }}>{count} pz</strong>
              </div>
            ))}
          </Accordion>

          {/* New Lattine Section moved from Logistics */}
          <Accordion title="Volume Complessivo Lattine" icon={<Package size={15} />} borderColor="var(--warning)" defaultOpen={true}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ fontSize: '0.85rem' }}>Lattine con Bottiglie</span>
                  <strong style={{ color: 'var(--success)' }}>{stats.cansSoldBottles}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ fontSize: '0.85rem' }}>Lattine Ordinazioni Extra</span>
                  <strong style={{ color: 'var(--warning)' }}>{stats.cansSoldExtra}</strong>
              </div>
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700 }}>TOTALE LATTINE</span>
                  <strong style={{ color: 'var(--warning)' }}>{stats.cansSoldBottles + stats.cansSoldExtra}</strong>
              </div>
          </Accordion>
        </div>
      )}

      {/* TAB 3: Heatmap */}
      {activeTab === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mappa interattiva della sala. I colori indicano la spesa attiva per tavolo in tempo reale.</p>
          <Card style={{ background: '#050508', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', position: 'relative', padding: '2.5rem 0.75rem 0.75rem' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0.4rem', background: 'var(--accent-color)', borderRadius: '10px 10px 0 0' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', color: 'white' }}>🎵 DJ BOOTH</span>
              </div>
              {[
                { id: 'T1', level: 1 }, { id: 'T2', level: 3 }, { id: 'T3', level: 1 }, { id: 'T4', level: 4 },
                { id: 'T5', level: 0 }, { id: 'T6', level: 1 }, { id: 'T7', level: 2 }, { id: 'T8', level: 0 },
              ].map(({ id, level }) => {
                const bgMap = ['rgba(255,255,255,0.03)', 'rgba(59,130,246,0.2)', 'rgba(245,158,11,0.4)', 'rgba(239,68,68,0.5)', 'rgba(239,68,68,0.85)'];
                const borderMap = ['transparent', 'rgba(59,130,246,0.5)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)', 'red'];
                const shadowMap = ['none', 'none', '0 0 8px rgba(245,158,11,0.3)', '0 0 14px rgba(239,68,68,0.4)', '0 0 24px red'];
                const emoji = ['', '', '⭐', '🔥', '💣'];
                return (
                  <div key={id} style={{ height: '52px', borderRadius: '10px', background: bgMap[level], border: `1px solid ${borderMap[level]}`, boxShadow: shadowMap[level], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: level === 0 ? 'var(--text-tertiary)' : 'white' }}>
                    {id} {emoji[level]}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem', fontSize: '0.72rem', color: 'var(--text-secondary)', padding: '0.5rem 0.75rem', borderTop: '1px solid var(--border-card)' }}>
              <span>⬜ Vuoto</span><span style={{ color: '#3b82f6' }}>◼ Attivo</span><span style={{ color: 'var(--warning)' }}>◼ Caldo</span><span style={{ color: 'var(--error)' }}>◼ Fuoco</span>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: PR Performance */}
      {activeTab === 4 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Barbershop-style Ranked Leaderboard */}
          <Card style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Crown size={18} color="var(--gold)" />
              <strong style={{ fontSize: '1rem' }}>Classifica PR Live</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>Basata su ordini validati</span>
            </div>
            {prList.length > 0 ? (
               <PRLeaderboard data={prList} />
            ) : (
               <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Nessun dato PR disponibile per questa sessione.</p>
            )}
          </Card>

          {/* Upselling Analysis */}
          <Accordion title="Analisi Upselling Live" icon={<TrendingUp size={15} />} borderColor="var(--success)">
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Bottiglie extra ordinate dal cliente dopo l'ingresso (misura la vera capacità di vendita al tavolo).
            </p>
            {[
              { name: 'Alex Rossi', pre: 18, extra: 6, total: 24 },
              { name: 'Marco T.', pre: 16, extra: 3, total: 19 },
              { name: 'Giulia B.', pre: 12, extra: 2, total: 14 },
              { name: 'Francesca N.', pre: 8, extra: 1, total: 9 },
            ].map(({ name, pre, extra, total }) => (
              <div key={name} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <strong style={{ fontSize: '0.92rem' }}>{name}</strong>
                  <strong style={{ color: 'var(--accent-light)' }}>Tot: {total} bott.</strong>
                </div>
                {/* Stacked bar */}
                <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.35rem' }}>
                  <div style={{ width: `${Math.round((pre / total) * 100)}%`, background: 'var(--accent-color)', transition: 'width 0.5s' }}></div>
                  <div style={{ flex: 1, background: 'var(--success)', opacity: 0.85 }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>■ Prenotate: {pre}</span>
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>■ Extra Live: +{extra}</span>
                </div>
              </div>
            ))}
          </Accordion>

          {/* Top Image Girls */}
          <Accordion title="Top Ragazze Immagine" icon={<Star size={15} />} borderColor="#ff3b5c">
             <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Basata su tavoli serviti storicamente e feedback clienti.</p>
             {[
               { name: 'Elena', tavoli: 142, rating: '4.9', color: '#ff3b5c' },
               { name: 'Sofia', tavoli: 110, rating: '4.7', color: 'var(--accent-light)' },
               { name: 'Chiara', tavoli: 85, rating: '4.5', color: 'var(--warning)' },
             ].map((ig, i) => (
               <div key={ig.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                     <span style={{ fontWeight: 800, color: i === 0 ? 'var(--gold)' : 'var(--text-secondary)' }}>#{i+1}</span>
                     <strong style={{ fontSize: '0.9rem' }}>{ig.name}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <strong style={{ color: ig.color, fontSize: '0.9rem', display: 'block' }}>{ig.tavoli} Tavoli</strong>
                     <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>⭐ {ig.rating} Avg</span>
                  </div>
               </div>
             ))}
          </Accordion>

        </div>
      )}
    </div>
  );
}
