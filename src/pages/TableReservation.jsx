import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Info, MapPin } from 'lucide-react';
import { TableMap } from '../components/TableMap';
import { noxTables, getTableById } from '../data/noxData';
import { saveReservation } from '../services/db';
import { useAuth } from '../context/AuthContext';
import { useNox } from '../context/NoxContext';

export function TableReservation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { config } = useNox();
  const [people, setPeople] = useState(4);
  const [pr, setPr] = useState('');
  const [tableId, setTableId] = useState(null);

  const selectedTable = tableId ? getTableById(tableId) : null;

  const handleSubmit = async () => {
    try {
      await saveReservation({
        userId: user?.id || 'guest',
        userName: user?.name || 'Guest',
        people,
        pr,
        tableId,
        tableName: selectedTable?.name || 'Non specificato',
        minSpend: calculateMinimumSpend()
      });
      navigate(-1);
    } catch (error) {
       console.error("Reservation failed:", error);
    }
  }

  const calculateMinimumSpend = () => {
    let base = 180 + Math.max(0, people - 4) * 45; 
    if (selectedTable && base < selectedTable.minSpend) {
      base = selectedTable.minSpend;
    }
    return base;
  };

  // Build status map (demo: all free)
  const demoStatuses = {};
  noxTables.forEach(t => {
    // Simulate some occupied/reserved tables for visual effect
    if (t.id === 'P1') demoStatuses[t.id] = { status: 'occupied', occupant: 'Bianchi', spend: 1200 };
    else if (t.id === 'P5') demoStatuses[t.id] = { status: 'reserved', occupant: 'Rossi' };
    else if (t.id === 'P9') demoStatuses[t.id] = { status: 'vip', occupant: 'VIP Guest', spend: 3500 };
    else demoStatuses[t.id] = { status: 'free' };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', paddingBottom: '2rem', flex: 1 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.3rem', margin: 0 }}>Prenota Tavolo</h2>
      </header>

      {/* Map Interactive Module */}
      <Card style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
           <MapPin size={20} color="var(--accent-color)" /> Mappa del Locale
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
           Tocca un tavolo per selezionarlo. Il layout rispecchia la disposizione reale del locale.
        </p>
        
        <TableMap 
          selectedTableId={tableId} 
          onSelectTable={setTableId} 
          tableStatuses={demoStatuses}
          mode="booking"
        />
        
        {selectedTable && (
           <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(94, 92, 230, 0.12)', borderRadius: '14px', border: '1px solid rgba(94,92,230,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <strong style={{ color: 'var(--accent-light)', fontSize: '1rem' }}>✅ {selectedTable.name}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Max {selectedTable.capacity} pers.</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                Spesa minima tavolo: <strong style={{ color: 'var(--warning)' }}>€ {selectedTable.minSpend}</strong>
              </p>
           </div>
        )}
      </Card>

      <Card style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Chi è il tuo PR?</label>
        <select className="input-base" style={{ marginBottom: '1.5rem' }} value={pr} onChange={(e) => setPr(e.target.value)}>
          <option value="" disabled style={{ color: 'black' }}>Seleziona un PR</option>
          <option value="nessuno" style={{ color: 'black' }}>Nessuno - Non ho un PR di riferimento</option>
          <option value="alex" style={{ color: 'black' }}>Alex Rossi</option>
          <option value="sara" style={{ color: 'black' }}>Sara Bianchi</option>
        </select>

        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>Numero Persone (Min. 4)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <button onClick={() => setPeople(Math.max(4, people - 1))} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>-</button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '1.5rem', fontWeight: 800 }}>{people}</div>
            <button onClick={() => setPeople(Math.min(selectedTable?.capacity || 20, people + 1))} style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>+</button>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--warning)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <Info color="var(--warning)" size={36} />
           <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>Spesa minima totale richiesta:</p>
              <h3 style={{ color: 'var(--warning)', margin: '0.3rem 0 0 0', fontSize: '1.4rem' }}>€ {calculateMinimumSpend()}</h3>
           </div>
        </div>
      </Card>

      <Button variant="primary" onClick={handleSubmit} style={{ marginTop: 'auto', padding: '1rem', fontSize: '1rem' }}>Procedi con la Prenotazione</Button>
    </div>
  );
}
