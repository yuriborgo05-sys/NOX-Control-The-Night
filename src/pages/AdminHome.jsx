import React, { useState } from 'react';
import { Accordion } from '../components/Accordion';
import { useAuth } from '../context/AuthContext';
import { EmergencyPanel } from '../components/EmergencyPanel';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AlertTriangle } from 'lucide-react';
import { NoxIcon } from '../components/NoxIcon';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useNox } from '../context/NoxContext';
import { useNoxStore } from '../store';
import { playCheckInSound, playBottleDeliveredSound, playGiftDrinkSound, playFraudAlertSound } from '../utils/audio';
import { hapticCheckIn, hapticBottleDelivered, hapticGiftDrink, hapticFraud } from '../utils/haptics';
import { 
  validateEntryQR, 
  validateBottleQR, 
  redeemDrinkQR, 
  updateSystemState,
  streamClubConfig,
  updateClubConfig,
  streamOrders,
  streamAnalytics,
  archiveCurrentSession,
  syncGlobalStatsManual
} from '../services/db';
import { EveningReport } from '../features/admin/EveningReport';
import { QRScanner } from '../components/QRScanner';

console.log('BOOT-110: REAL AdminHome.jsx EXECUTING (FINAL RESTORE)');

const formatTime = (ts) => {
  if (!ts) return '--:--';
  const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

export function AdminHome() {
  console.log('BOOT-111: AdminHome RENDER START');
  const { user, logout } = useAuth();
  const { config: globalConfig } = useNox();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanType, setScanType] = useState('ingresso');
  const [eventConfig, setEventConfig] = useState({ eventTitle: '', eventCover: '', eventDate: '' });
  const [showExitReport, setShowExitReport] = useState(false);
  const { analytics: stats, orders: liveOrders, emergencyAlerts } = useNoxStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const { addNotification } = useNotification();
  const [now, setNow] = useState(Date.now());

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const calculateAge = (timestamp) => {
    if (!timestamp) return 0;
    const ts = timestamp.seconds ? timestamp.seconds * 1000 : new Date(timestamp).getTime();
    return Math.floor((now - ts) / 60000);
  };
  
  const [scanLogs, setScanLogs] = useState([
     { id: '1', time: '23:15:42', date: new Date().toLocaleDateString(), event: `Serata ${globalConfig?.clubName || 'NOX'}`, venue: globalConfig?.clubName || 'Locale', guestName: 'Marco T.', status: 'Entrato regolarmente', operator: 'Staff', type: 'QR Ingresso' }
  ]);

  React.useEffect(() => {
    const unsub1 = streamClubConfig(setEventConfig);
    return () => { unsub1(); };
  }, []);

  const handleRecalibrate = async () => {
    setIsSyncing(true);
    await syncGlobalStatsManual();
    setIsSyncing(false);
    addNotification("Statistiche Ricalibrate", "I totali sono stati ricalcolati dallo storico storico degli ordini.", "success");
  };

  const handleUpdateEvent = async () => {
    await updateClubConfig(eventConfig);
    addNotification("Configurazione Salvata", "La copertina e il titolo della serata sono stati aggiornati.", "success");
  };

  const handleScanSuccess = async (decodedText) => {
    setIsScanning(false);
    await performRealScan(scanType, decodedText);
  };

  const performRealScan = async (type, targetId) => {
    const timeStr = formatTime(Date.now() / 1000);

    try {
      let data;
      if (type === 'ingresso') {
        data = await validateEntryQR(targetId || 'test_user_id');
        playCheckInSound(); hapticCheckIn();
        setScanResult({ status: 'ok', msg: `Ingresso Validato: ${data.name || 'Ospite'} (${timeStr})` });
        addNotification("Accesso Consentito", "Il QR Visitatore è stato validato con successo.", "success");
      }
      if (type === 'drink') {
        data = await redeemDrinkQR(targetId || 'test_user_id');
        playGiftDrinkSound(); hapticGiftDrink();
        setScanResult({ status: 'ok', msg: `Drink Omaggio Riscattato! (${timeStr})` });
        addNotification("Drink Riscattato", "Promozione attivata, drink assegnato in cassa.", "success");
      }

      const newLog = { 
        id: Date.now().toString(), 
        time: timeStr, 
        date: new Date().toLocaleDateString(), 
        event: `Serata ${globalConfig?.clubName || 'NOX'}`, 
        venue: globalConfig?.clubName || 'Locale', 
        guestName: data?.name || 'Utente Scansionato', 
        status: 'Validato OK', 
        operator: user?.name || 'Admin', 
        type: type.toUpperCase() 
      };
      setScanLogs(prev => [newLog, ...prev]);
    } catch (err) {
      playFraudAlertSound(); hapticFraud();
      setScanResult({ status: 'error', msg: `ERRORE: ${err.message} (${timeStr})` });
      addNotification("Allerta Validazione", err.message, "error");
    }
    setTimeout(() => setScanResult(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, paddingBottom: '2rem' }}>
      
      {emergencyAlerts.some(a => calculateAge(a.timestamp) >= 7) && (
        <Card style={{ 
          background: 'var(--error)', color: 'white', padding: '1rem', 
          borderRadius: '16px', display: 'flex', alignItems: 'center', 
          gap: '1rem', animation: 'pulse 1.5s infinite', border: 'none'
        }}>
          <AlertTriangle size={32} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.9rem', textTransform: 'uppercase' }}>Allerta Critica Security!</strong>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Un'emergenza non è stata gestita per oltre 7 minuti. Intervenire o contattare la security via radio!</span>
          </div>
        </Card>
      )}

      {emergencyAlerts.length > 0 && !emergencyAlerts.some(a => calculateAge(a.timestamp) >= 7) && (
        <div style={{ background: 'rgba(255,59,92,0.1)', border: '1px solid var(--error)', padding: '0.75rem 1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <AlertTriangle size={18} color="var(--error)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--error)', fontWeight: 700 }}>
             {emergencyAlerts.length} Emergenze Attive in Corso
          </span>
          <Button variant="secondary" onClick={() => navigate('/admin/management')} style={{ marginLeft: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderColor: 'var(--error)', color: 'var(--error)' }}>VEDI TUTTE</Button>
        </div>
      )}
      
      {isScanning && (
        <QRScanner 
          title={`Scansione ${scanType.toUpperCase()}`}
          onResult={handleScanSuccess}
          onClose={() => setIsScanning(false)}
        />
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{fontSize: '1.5rem'}}>Strumenti Cassa</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Operatore: {user?.name}</p>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
          <NoxIcon name="log-out" size={24} />
        </button>
      </header>

      <Card style={{ padding: '1.25rem 1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
           <NoxIcon name="scan-line" size={24} color="var(--accent-color)" /> Validazione Terminale
        </h3>

        {scanResult && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '12px', 
            background: scanResult.status === 'ok' ? 'var(--success-bg)' : 'var(--error-bg)',
            border: `1px solid ${scanResult.status === 'ok' ? 'rgba(0,208,132,0.3)' : 'rgba(255,59,92,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            animation: 'fadeIn 0.2s ease-out',
            marginBottom: '1rem'
          }}>
            {scanResult.status === 'ok' ? <NoxIcon name="check-circle-2" color="var(--success)" /> : <NoxIcon name="alert-circle" color="var(--error)" />}
            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: scanResult.status === 'ok' ? 'var(--success)' : 'var(--error)' }}>{scanResult.msg}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <Accordion title="0. Gestione Serata (Cover Clienti)" icon={<NoxIcon name="star" size={16} />} borderColor="var(--accent-light)">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem' }}>
                <input className="input-base" placeholder="Titolo Serata" value={eventConfig.eventTitle} onChange={e => setEventConfig({...eventConfig, eventTitle: e.target.value})} />
                <input className="input-base" placeholder="URL Immagine Copertina" value={eventConfig.eventCover} onChange={e => setEventConfig({...eventConfig, eventCover: e.target.value})} />
                <input className="input-base" placeholder="Data/Orario (es. Sabato 23:30)" value={eventConfig.eventDate} onChange={e => setEventConfig({...eventConfig, eventDate: e.target.value})} />
                <Button variant="primary" onClick={handleUpdateEvent} style={{ width: '100%', padding: '0.75rem' }}>Salva & Pubblica</Button>
             </div>
          </Accordion>

          <Accordion title="1. Scansione Ingressi Porta" icon={<NoxIcon name="qr-code" size={16} />} defaultOpen={true} borderColor="var(--success)">
            <Button variant="secondary" onClick={() => { setScanType('ingresso'); setIsScanning(true); }} style={{ borderColor: 'var(--success)', color: 'var(--success)', padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}>📸 Attiva Camera Ingresso</Button>
          </Accordion>
  
          <Accordion title="2. Validazione Drink Omaggio" icon={<NoxIcon name="wine" size={16} />} borderColor="var(--warning)">
            <Button variant="secondary" onClick={() => { setScanType('drink'); setIsScanning(true); }} style={{ borderColor: 'var(--warning)', color: 'var(--warning)', padding: '0.85rem 0.5rem', fontSize: '0.8rem' }}>📸 Attiva Camera Drink</Button>
          </Accordion>
        </div>
      </Card>

      <Card style={{ padding: '1rem' }}>
         <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             <NoxIcon name="history" size={20} /> Storico Scansioni Ingressi
         </h3>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {scanLogs.map(log => (
                <div key={log.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', borderLeft: `3px solid ${log.status.includes('Entrato') ? 'var(--success)' : 'var(--error)'}` }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{log.guestName} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({log.type})</span></strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.time}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <span>Stato: <strong style={{color: log.status.includes('Entrato') ? 'var(--success)' : 'var(--warning)'}}>{log.status}</strong></span>
                      <span>Op: {log.operator}</span>
                   </div>
                </div>
            ))}
         </div>
      </Card>

      <Button variant="primary" onClick={() => navigate('/admin/management')} style={{ marginTop: '1rem', padding: '1rem' }}>Apri Gestione Tavoli/Ordini</Button>

      <Card style={{ marginTop: '1rem', cursor: 'pointer', borderColor: 'var(--accent-color)' }} onClick={() => navigate('/admin/customers')}>
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
               <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <NoxIcon name="users" size={20} color="var(--accent-color)" /> Pannello dei Clienti
               </h3>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ricerca, banna, o ispeziona The Log List Database.</p>
            </div>
         </div>
      </Card>

      <Button 
        variant="primary" 
        onClick={() => setShowExitReport(true)} 
        style={{ 
          marginTop: '2rem', padding: '1.25rem', background: 'var(--error)', 
          borderColor: 'var(--error)', color: 'white', fontWeight: 900,
          boxShadow: '0 10px 30px rgba(255,59,92,0.2)'
        }}
      >
        🔚 CHIUDI SERATA & GENERA REPORT
      </Button>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <button 
          onClick={handleRecalibrate}
          disabled={isSyncing}
          style={{ 
            background: 'none', border: '1px solid rgba(255,255,255,0.1)', 
            color: 'gray', fontSize: '0.7rem', padding: '0.4rem 0.8rem', 
            borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' 
          }}
        >
          <NoxIcon name="refresh-ccw" size={12} className={isSyncing ? 'animate-spin' : ''} />
          {isSyncing ? 'Sincronizzazione...' : 'Ricalibra Statistiche'}
        </button>
      </div>

      {showExitReport && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'white' }}>
           <EveningReport 
              stats={stats} 
              liveOrders={liveOrders} 
              onCancel={() => setShowExitReport(false)}
              onConfirm={async () => {
                 if (window.confirm("Sei sicuro? Tutti i dati attivi verranno archiviati e cancellati dalla dashboard live.")) {
                    await archiveCurrentSession();
                    addNotification("Sessione Archiviata", "La serata è stata chiusa e i dati sono sicuri in archivio.", "success");
                    setShowExitReport(false);
                    navigate('/login');
                 }
              }}
           />
        </div>
      )}

      <EmergencyPanel />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 59, 92, 0.4); }
          50% { transform: scale(1.01); }
          100% { transform: scale(1); box-shadow: 0 0 0 15px rgba(255, 59, 92, 0); }
        }
      `}</style>
    </div>
  );
}

export default AdminHome;
