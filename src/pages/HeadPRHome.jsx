import React, { useState, useEffect } from 'react';
import { streamStaffMessages, sendStaffMessage, streamOrders, streamReviews } from '../services/db';
import { formatTime } from '../utils/formatTime';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
  LogOut, Trophy, BellRing, MessageSquare, MapPin,
  Send, DollarSign, Percent, Star, TrendingUp, Crown, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TableMap } from '../components/TableMap';
import { ManualTableCreate } from '../components/ManualTableCreate';
import { noxTables } from '../data/noxData';
import { useNoxStore } from '../store';
import { useNotification } from '../context/NotificationContext';

export function HeadPRHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const {
    orders: liveOrders,
    staffMessages: activeChat,
    emergencyAlerts,
    isInitialSyncDone
  } = useNoxStore();

  const [now, setNow] = useState(Date.now());
  const [callText, setCallText] = useState('');
  const [selectedCallTable, setSelectedCallTable] = useState('');
  const [liveReviews, setLiveReviews] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    const unsubReviews = streamReviews(setLiveReviews);
    return () => { 
      clearInterval(timer);
      unsubReviews(); 
    };
  }, []);

  const calculateAge = (timestamp) => {
    if (!timestamp) return 0;
    const ts = timestamp.seconds ? timestamp.seconds * 1000 : new Date(timestamp).getTime();
    return Math.floor((now - ts) / 60000);
  };

  const tableRevenue = liveOrders.reduce((sum, order) => sum + (order.total || 0), 0);
  const entryRevenue = 3450; 
  const totalRevenue = tableRevenue + entryRevenue;

  const handleCall = async () => {
    if (!callText.trim() && !selectedCallTable) return;
    const prefix = selectedCallTable ? `[TAVOLO ${selectedCallTable}] ` : '';
    await sendStaffMessage({
      sender: 'Capo PR',
      text: `${prefix}${callText.trim() || '📍 Chiamata Operativa'}`
    });
    setCallText('');
    setSelectedCallTable('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, paddingBottom: '3rem' }}>
      
      {/* --- EMERGENCY ESCALATION --- */}
      {emergencyAlerts.some(a => calculateAge(a.timestamp) >= 7) && (
        <Card style={{ 
          background: 'var(--error)', color: 'white', padding: '1rem', 
          borderRadius: '16px', display: 'flex', alignItems: 'center', 
          gap: '1rem', animation: 'pulse 1.5s infinite', border: 'none'
        }}>
          <AlertTriangle size={32} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem', textTransform: 'uppercase' }}>Allerta Critica Security!</strong>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Un'emergenza non è stata gestita per oltre 7 minuti. Contattare immediatamente la security via radio!</span>
          </div>
        </Card>
      )}

      {emergencyAlerts.length > 0 && !emergencyAlerts.some(a => calculateAge(a.timestamp) >= 7) && (
        <div style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid var(--error)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={18} color="var(--error)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--error)', fontWeight: 700 }}>
             {emergencyAlerts.length} Emergenze Attive in Corso
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--error)', fontWeight: 600 }}>SECURITY NOTIFICATA</span>
        </div>
      )}

      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.25rem',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(30,30,40,0.8), rgba(15,15,20,0.95))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(45deg, var(--accent-color), #4f46e5)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)'
          }}>
            <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'white' }}>{user?.name?.charAt(0)}</span>
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 900, letterSpacing: '1px', color: 'white' }}>MISSION CONTROL</h2>
            <p style={{ color: 'var(--accent-light)', fontSize: '0.7rem', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '1.5px' }}>RANK: CAPO PR / REGIA</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,69,58,0.1)', border: '1px solid rgba(255,69,58,0.2)', color: '#ff453a', padding: '0.6rem 1rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.8rem' }}>
          <LogOut size={16} /> ESCI
        </button>
      </header>

      {/* --- DASHBOARD INCASSI --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <Card style={{ padding: '1rem', background: 'rgba(59,130,246,0.1)', borderTop: '3px solid #3b82f6' }}>
          <h4 style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Incasso Ingressi</h4>
          <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: '0.2rem 0' }}>€ {entryRevenue}</p>
        </Card>
        <Card style={{ padding: '1rem', background: 'rgba(16,185,129,0.1)', borderTop: '3px solid var(--success)' }}>
          <h4 style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Incasso Tavoli</h4>
          <p style={{ fontSize: '1.2rem', fontWeight: 900, color: 'white', margin: '0.2rem 0' }}>€ {tableRevenue}</p>
        </Card>
        <Card style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(255,105,180,0.1))', borderTop: '3px solid var(--accent-color)' }}>
          <h4 style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase' }}>Totale Finale</h4>
          <p style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--accent-light)', margin: '0.2rem 0' }}>€ {totalRevenue}</p>
        </Card>
      </div>

      {/* --- SECTION 1: LIVE OVERVIEW --- */}
      <div>
        <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 800 }}>Overview Serata Live</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          <Card style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem' }}><MapPin size={18} color="var(--accent-color)" /> Heatmap Operativa</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>● {noxTables.length} PRIVÉ</span>
            </div>
            <TableMap
              selectedTableId={null}
              onSelectTable={(id) => {}}
              mode="heatmap"
              tableStatuses={{}}
            />
          </Card>

          <Card style={{ padding: '1.25rem', background: 'rgba(99,102,241,0.03)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1rem' }}><Trophy size={18} color="gold" /> Live Top 3 Tables</h3>
              <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: 700 }}>LIVE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Mapping tables logic here */}
            </div>
          </Card>

          <Card style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.2)' }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', margin: '0 0 1rem 0' }}>
               <BellRing size={18} color="var(--accent-light)" /> Ultimi Ordini Globali
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }}>
                {liveOrders.slice(0, 8).map(order => (
                  <div key={order.id} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{order.table}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>€{order.total}</span>
                    </div>
                  </div>
                ))}
             </div>
          </Card>

          <ManualTableCreate prName={user?.name || 'Capo PR'} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 92, 0.4); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); box-shadow: 0 0 0 15px rgba(255, 59, 92, 0); }
        }
      `}</style>
    </div>
  );
}
