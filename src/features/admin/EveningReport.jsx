import React from 'react';
import { Card } from '../../components/Card';
import { Wine, Users, TrendingUp, Shield, AlertCircle, Star } from 'lucide-react';

export function EveningReport({ stats, liveOrders, onConfirm, onCancel }) {
  const date = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  
  // DRIVE PR DATA FROM LIVE ORDERS
  const prData = Object.values(liveOrders.reduce((acc, o) => {
    const pr = o.pr || 'Organico';
    if (!acc[pr]) acc[pr] = { name: pr, total: 0, bottles: 0, pax: 0 };
    acc[pr].total += (o.total || 0);
    acc[pr].bottles += (o.items?.length || 0);
    acc[pr].pax += (o.pax || 0);
    return acc;
  }, {})).sort((a, b) => b.total - a.total);

  const totalRevenue = stats.tableRevenue || 0;
  const totalEntries = stats.entries?.length || 0;
  const totalLiters = (liveOrders.reduce((sum, o) => sum + (o.items?.length || 0), 0) * 0.75).toFixed(1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="report-container" style={{ 
      background: 'white', color: 'black', padding: '2rem', height: '100%', overflowY: 'auto'
    }}>
      <style>{`
        @media print {
          nav, button, .no-print { display: none !important; }
          .report-container { padding: 0 !important; width: 100% !important; }
          body { background: white !important; color: black !important; }
        }
        .report-section { margin-bottom: 2rem; border-bottom: 2px solid #eee; padding-bottom: 1rem; }
        .report-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .stat-box { border: 1px solid #ddd; padding: 1rem; border-radius: 8px; }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, mb: 0 }}>BAMBOO</h1>
        <h2 style={{ textTransform: 'uppercase', color: '#666', fontSize: '1rem', letterSpacing: '2px' }}>Report Ufficiale Serata</h2>
        <p style={{ fontWeight: 600 }}>{date}</p>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        <button onClick={handlePrint} style={{ padding: '0.75rem 1.5rem', background: '#000', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>🖨️ STAMPA / SALVA PDF</button>
        <button onClick={onCancel} style={{ padding: '0.75rem 1.5rem', background: '#eee', color: '#666', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>ANNULLA</button>
        <button onClick={onConfirm} style={{ padding: '0.75rem 1.5rem', background: 'var(--error)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>⚠️ CONFERMA RESET TOTALE</button>
      </div>

      {/* Economia */}
      <div className="report-section">
        <h3><TrendingUp size={18} inline /> Riepilogo Finanziario</h3>
        <div className="report-grid">
          <div className="stat-box">
             <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>INCASSO TAVOLI TOTALE</p>
             <strong style={{ fontSize: '1.5rem' }}>€ {totalRevenue.toLocaleString()}</strong>
          </div>
          <div className="stat-box">
             <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>MEDIA PER TAVOLO</p>
             <strong style={{ fontSize: '1.5rem' }}>€ {liveOrders.length > 0 ? Math.round(totalRevenue / liveOrders.length) : 0}</strong>
          </div>
          <div className="stat-box">
             <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>VOLUME ALCOLICO STIMATO</p>
             <strong style={{ fontSize: '1.5rem' }}>{totalLiters} LITRI</strong>
          </div>
          <div className="stat-box">
             <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>ORDINI EVASI</p>
             <strong style={{ fontSize: '1.5rem' }}>{liveOrders.length}</strong>
          </div>
        </div>
      </div>

      {/* Classifica PR */}
      <div className="report-section">
        <h3><Star size={18} inline /> Performance PR / Staff</h3>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.75rem' }}>PR / Team</th>
              <th style={{ padding: '0.75rem' }}>Fatturato</th>
              <th style={{ padding: '0.75rem' }}>Bottiglie</th>
              <th style={{ padding: '0.75rem' }}>Ospiti</th>
            </tr>
          </thead>
          <tbody>
            {prData.map(pr => (
              <tr key={pr.name} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem' }}>{pr.name}</td>
                <td style={{ padding: '0.75rem' }}><strong>€ {pr.total.toLocaleString()}</strong></td>
                <td style={{ padding: '0.75rem' }}>{pr.bottles}</td>
                <td style={{ padding: '0.75rem' }}>{pr.pax}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Clientela */}
      <div className="report-section">
        <h3><Users size={18} inline /> Analisi Flusso Clienti</h3>
        <div className="report-grid">
           <div className="stat-box">
              <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>INGRESSI TOTALI VALIDATI</p>
              <strong style={{ fontSize: '1.5rem' }}>{totalEntries} PERSONE</strong>
           </div>
           <div className="stat-box">
              <p style={{ color: '#666', fontSize: '0.8rem', margin: 0 }}>GENDER RATIO</p>
              <div style={{ display: 'flex', gap: '1rem', mt: '0.5rem' }}>
                 <span style={{ color: '#3b82f6' }}>M: {stats.entries?.filter(e => e.gender === 'U').length || 0}</span>
                 <span style={{ color: '#ec4899' }}>F: {stats.entries?.filter(e => e.gender === 'D').length || 0}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Sicurezza */}
      <div className="report-section">
        <h3><Shield size={18} inline /> Sicurezza & Incidenti</h3>
        <div style={{ padding: '1rem', background: '#fff' }}>
           {stats.incidents?.length === 0 ? (
             <p>Nessun incidente grave registrato durante la serata. 🟢</p>
           ) : (
             <ul>
                {stats.incidents?.map((inc, i) => <li key={i}>{inc.type} - {new Date(inc.timestamp?.seconds * 1000).toLocaleTimeString()}</li>)}
             </ul>
           )}
        </div>
      </div>

      {/* Footer per Ufficio */}
      <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ width: '200px', borderTop: '1px solid black', textAlign: 'center', paddingTop: '0.5rem', fontSize: '0.8rem' }}>Firma Gestione</div>
        <div style={{ width: '200px', borderTop: '1px solid black', textAlign: 'center', paddingTop: '0.5rem', fontSize: '0.8rem' }}>Firma Proprietà</div>
      </div>
    </div>
  );
}
