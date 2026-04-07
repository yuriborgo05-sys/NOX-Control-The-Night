import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import {
  Wine, Info, AlertCircle, Plus, Trash2,
  ChevronRight, Filter, Grid, Search, X
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { placeOrder } from '../services/db';
import { noxMenu } from '../data/noxData';

const MIXERS_CATALOG = noxMenu.find(c => c.category === 'Analcolici')?.items.map(i => i.name) || [];

export function ManualTableCreate({ prName }) {
  const [selectedPr, setSelectedPr] = useState(prName || 'Organico');
  const [tableInfo, setTableInfo] = useState({ name: '', pax: 5, target: 'Pista' });
  const [bottles, setBottles] = useState([]); // {id, name, qty, category}
  const [mixers, setMixers] = useState([]);   // {name, qty}
  const [activeCategory, setActiveCategory] = useState('Tutti');
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const { addNotification } = useNotification();

  const PR_LIST = [
    { id: 'me', name: `Io (${prName})`, value: prName },
    { id: 'organico', name: 'Organico (Nox Staff)', value: 'Organico' },
    { id: 'sara', name: 'Sara B.', value: 'Sara B.' },
    { id: 'alex', name: 'Alex Rossi', value: 'Alex Rossi' },
  ];

  const allBottles = noxMenu.flatMap(c => c.items.map(i => ({ ...i, id: i.name, category: c.category })));

  const filteredCatalog = activeCategory === 'Tutti'
    ? allBottles.filter(b => b.category !== 'Analcolici')
    : noxMenu.find(c => c.category === activeCategory)?.items.map(i => ({ ...i, id: i.name, category: activeCategory })) || [];

  const totalBottles = bottles.reduce((sum, b) => sum + b.qty, 0);
  const totalMixers = mixers.reduce((sum, m) => sum + m.qty, 0);
  const requiredMixers = totalBottles * 6;
  const missingMixers = requiredMixers - totalMixers;

  const addBottle = (bottle) => {
    setBottles(prev => {
      const existing = prev.find(b => b.id === bottle.id);
      if (existing) return prev.map(b => b.id === bottle.id ? { ...b, qty: b.qty + 1 } : b);
      return [...prev, { ...bottle, qty: 1 }];
    });
    addNotification("Aggiunto", `${bottle.name} aggiunto al tavolo.`, "info");
  };

  const removeBottle = (bottleId) => {
    setBottles(prev => prev.map(b => b.id === bottleId ? { ...b, qty: b.qty - 1 } : b).filter(b => b.qty > 0));
  };

  const updateMixer = (mixerName, delta) => {
    setMixers(prev => {
      const existing = prev.find(m => m.name === mixerName);
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) return prev.filter(m => m.name !== mixerName);
        return prev.map(m => m.name === mixerName ? { ...m, qty: newQty } : m);
      }
      if (delta > 0) return [...prev, { name: mixerName, qty: 1 }];
      return prev;
    });
  };

  const getMixerQty = (name) => mixers.find(m => m.name === name)?.qty || 0;

  const handleCreate = async () => {
    if (!tableInfo.name) {
      addNotification("Errore", "Inserisci il nome del tavolo.", "error"); return;
    }
    if (totalBottles > 0 && totalMixers !== requiredMixers) {
      addNotification("Regola Analcolici", `Devi selezionare esattamente ${requiredMixers} analcolici per le bottiglie scelte (${totalMixers} selezionati).`, "warning"); return;
    }

    const orderData = {
      tableInfo, bottles, mixers,
      pr: selectedPr,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    await placeOrder(orderData);
    addNotification("Tavolo Creato", `Il tavolo ${tableInfo.name} è stato aperto con successo.`, "success");
    setTableInfo({ name: '', pax: 5, target: 'Pista' });
    setBottles([]);
    setMixers([]);
  };

  return (
    <Card style={{ padding: '1.25rem', position: 'relative' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <Wine size={20} color="var(--accent-color)" /> Prenotazione Catalogo Full
      </h3>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>
          PR Titolare (Assegnazione)
        </label>
        <select
          className="input-base"
          value={selectedPr}
          onChange={e => setSelectedPr(e.target.value)}
          style={{ width: '100%', color: 'var(--accent-light)', borderColor: 'var(--accent-color)', background: 'rgba(124,58,237,0.05)' }}
        >
          {PR_LIST.map(p => (
            <option key={p.id} value={p.value} style={{ color: 'black' }}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <input className="input-base" placeholder="Nome Tavolo (es. Gruppo Rossi)" value={tableInfo.name} onChange={e => setTableInfo({ ...tableInfo, name: e.target.value })} />
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input type="number" className="input-base" placeholder="Persone" value={tableInfo.pax} onChange={e => setTableInfo({ ...tableInfo, pax: e.target.value })} style={{ flex: 1 }} />
          <select className="input-base" value={tableInfo.target} onChange={e => setTableInfo({ ...tableInfo, target: e.target.value })} style={{ flex: 2 }}>
            <option value="dj" style={{ color: 'black' }}>Dietro DJ</option>
            <option value="lateral" style={{ color: 'black' }}>Laterali Pista</option>
            <option value="bar" style={{ color: 'black' }}>Fronte Bar</option>
            <option value="entrance" style={{ color: 'black' }}>Angoli Entrate</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>
          <Filter size={12} style={{ marginRight: '4px' }} /> Categoria Alcolici
        </label>
        <select
          className="input-base"
          value={activeCategory}
          onChange={e => setActiveCategory(e.target.value)}
          style={{ width: '100%', color: 'white' }}
        >
          {['Tutti', ...noxMenu.map(c => c.category)].map(cat => (
            <option key={cat} value={cat} style={{ color: 'black' }}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Seleziona Bottiglia</span>
          <button onClick={() => setShowFullCatalog(true)} style={{ background: 'none', border: 'none', color: 'var(--accent-light)', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Grid size={12} /> SFOGLIA TUTTO
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '150px', overflowY: 'auto' }}>
          {filteredCatalog.map(b => (
            <div key={b.id} onClick={() => addBottle(b)} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', cursor: 'pointer' }}>
              <span>{b.name}</span>
              <Plus size={16} color="var(--accent-light)" />
            </div>
          ))}
        </div>
      </div>

      {bottles.length > 0 && (
        <div style={{ background: 'rgba(124, 58, 237, 0.05)', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
          {bottles.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem' }}>{b.qty}x {b.name}</span>
              <button onClick={() => removeBottle(b.id)} style={{ color: 'var(--error)', background: 'none', border: 'none' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      {totalBottles > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ANALCOLICI SELEZIONATI</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{totalMixers} / {requiredMixers}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
            {MIXERS_CATALOG.map(m => (
              <div key={m} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.65rem' }}>{m}</span>
                <button onClick={() => updateMixer(m, 1)} style={{ color: 'var(--accent-light)', background: 'none', border: 'none' }}>({getMixerQty(m)}) +</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button variant="primary" onClick={handleCreate} style={{ width: '100%' }} disabled={totalBottles === 0 || totalMixers !== requiredMixers}>
        CONFERMA TAVOLO
      </Button>

      {showFullCatalog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.98)', zIndex: 10000, padding: '2rem', overflowY: 'auto' }}>
          <button onClick={() => setShowFullCatalog(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'white' }}><X size={32} /></button>
          <h2 style={{ marginBottom: '2rem' }}>Catalogo Completo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {allBottles.filter(b => b.category !== 'Analcolici').map(b => (
              <div key={b.id} onClick={() => { addBottle(b); setShowFullCatalog(false); }} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)' }}>{b.category}</div>
                <div style={{ fontWeight: 800 }}>{b.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
