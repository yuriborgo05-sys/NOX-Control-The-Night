import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LogOut, ScanLine, CheckCircle2, AlertTriangle, Shield, Radio, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { QRScanner } from '../components/QRScanner';
import { validateGroupEntry, validateIndividualExit, resolveEmergencyAlert } from '../services/db';
import { playCheckInSound, playNotificationSound, playFraudAlertSound } from '../utils/audio';
import { useNoxStore } from '../store';

export function BodyguardHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [scanResult, setScanResult] = useState(null);
  const [alertSent, setAlertSent] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState('entry'); // 'entry' | 'exit'
  const [now, setNow] = useState(Date.now());

  const { 
    emergencyAlerts, 
    setEmergencyAlerts, 
  } = useNoxStore();

  // Timer to refresh alert age every 15s
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const handleScanSuccess = async (decodedText) => {
    setIsScanning(false);
    
    try {
      if (scanMode === 'entry') {
        const res = await validateGroupEntry(decodedText);
        if (res.success) {
          playCheckInSound();
          setScanResult({ status: 'ok', msg: `INGRESSO OK: ${res.table} (${res.pax} Persone)` });
          addNotification("Check-In Gruppo", `${res.table} è entrato con ${res.pax} ospiti.`, "success");
        } else {
          playFraudAlertSound();
          setScanResult({ status: 'error', msg: res.msg });
        }
      } else {
        const res = await validateIndividualExit(decodedText);
        if (res.success) {
          playNotificationSound();
          setScanResult({ status: 'ok', msg: `USCITA OK: ${res.table} (Rimasti: ${res.rem})` });
          addNotification("Uscita Registrata", `Il cliente del ${res.table} è uscito.`, "info");
        } else {
          playFraudAlertSound();
          setScanResult({ status: 'error', msg: res.msg });
        }
      }
    } catch (err) {
      setScanResult({ status: 'error', msg: "Errore durante la scansione." });
    }
    
    setTimeout(() => setScanResult(null), 5000);
  };

  const handleResolveAlert = async (id) => {
    await resolveEmergencyAlert(id);
    addNotification("Assistenza Completata", "L'emergenza è stata chiusa.", "success");
  };

  const handleCallBackup = () => {
    setAlertSent(true);
    addNotification("🚨 RINFORZI CHIAMATI", "Tutti i bodyguard sono stati allertati sulla tua posizione.", "error");
    setTimeout(() => setAlertSent(false), 5000);
  };

  const calculateAge = (timestamp) => {
    if (!timestamp) return 0;
    const ts = timestamp.seconds ? timestamp.seconds * 1000 : new Date(timestamp).getTime();
    return Math.floor((now - ts) / 60000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, paddingBottom: '3rem' }}>
      
      {isScanning && (
        <QRScanner 
          title={scanMode === 'entry' ? "Verifica Ingresso" : "Verifica Uscita"}
          onResult={handleScanSuccess}
          onClose={() => setIsScanning(false)}
        />
      )}

      {/* --- EMERGENCY ALERTS SECTION (CRITICAL) --- */}
      {emergencyAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.5rem' }}>
          <h2 style={{ 
            color: 'white', 
            fontSize: '1.1rem', 
            fontWeight: 900, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.6rem', 
            background: 'var(--error)', 
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            animation: 'pulse 1.5s infinite' 
          }}>
            <AlertTriangle size={24} /> EMERGENZE ATTIVE ({emergencyAlerts.length})
          </h2>
          
          {emergencyAlerts.map(alert => {
            const age = calculateAge(alert.timestamp);
            const isCritical = age >= 7;
            
            return (
              <Card key={alert.id} style={{ 
                padding: '1.25rem', 
                border: `2px solid ${isCritical ? 'var(--error)' : 'rgba(255,59,48,0.3)'}`,
                background: isCritical ? 'rgba(255,59,48,0.15)' : 'rgba(255,59,48,0.05)',
                boxShadow: isCritical ? '0 0 30px rgba(255,59,48,0.3)' : 'none',
                position: 'relative',
                overflow: 'hidden',
                animation: isCritical ? 'blink-red 2s infinite' : 'none'
              }}>
                {isCritical && (
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, padding: '0.3rem', 
                    background: 'var(--error)', color: 'white', fontSize: '0.65rem', 
                    fontWeight: 900, textAlign: 'center', letterSpacing: '1px' 
                  }}>
                    NON GESTITO DA OLTRE 7 MINUTI - INTERVENIRE IMMEDIATAMENTE!
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: isCritical ? '1.2rem' : 0 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.75rem', color: isCritical ? 'white' : 'var(--error)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 800 }}>
                      {alert.category || 'ALLERTA'} • {age} MIN FA
                    </h4>
                    <p style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0.5rem 0', color: 'white' }}>
                      TAVOLO: {alert.tableName}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      PR Responsabile: <strong style={{ color: 'white' }}>{alert.pr}</strong>
                    </p>
                  </div>
                  <Button 
                    variant="primary" 
                    onClick={() => handleResolveAlert(alert.id)}
                    style={{ background: 'var(--success)', borderColor: 'var(--success)', whiteSpace: 'nowrap', fontWeight: 900 }}
                  >
                    INTERVENUTO
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- HEADER --- */}
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 1.25rem', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(30,30,40,0.9), rgba(10,10,15,0.95))',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: 44, height: 44, borderRadius: '14px',
            background: 'linear-gradient(135deg, #ff3b30, #cc2d25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(255,59,48,0.3)',
          }}>
            <Shield size={22} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 900, letterSpacing: '0.5px', color: 'white' }}>SECURITY</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>{user?.name}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ 
          background: 'rgba(255,69,58,0.1)', border: 'none', color: '#ff453a', 
          padding: '0.5rem 0.8rem', borderRadius: '10px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700 
        }}>
          <LogOut size={16} /> ESCI
        </button>
      </header>

      {/* --- SCANNER CARD --- */}
      <Card style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.3rem', borderRadius: '12px' }}>
          <button 
            onClick={() => setScanMode('entry')}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', background: scanMode === 'entry' ? 'var(--accent-color)' : 'transparent', color: scanMode === 'entry' ? 'white' : 'gray', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            INGRESSO GRUPPO
          </button>
          <button 
            onClick={() => setScanMode('exit')}
            style={{ flex: 1, padding: '0.6rem', borderRadius: '10px', border: 'none', background: scanMode === 'exit' ? '#eb4432' : 'transparent', color: scanMode === 'exit' ? 'white' : 'gray', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            USCITA SINGOLA
          </button>
        </div>

        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '1rem', color: 'white' }}>
          <ScanLine size={20} color={scanMode === 'entry' ? "var(--accent-color)" : "#eb4432"} /> {scanMode === 'entry' ? 'Validazione Ingresso' : 'Validazione Uscita'}
        </h3>

        {scanResult && (
          <div style={{
            padding: '0.85rem', borderRadius: '14px', marginBottom: '1rem',
            background: scanResult.status === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(255,59,48,0.1)',
            border: `1px solid ${scanResult.status === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(255,59,48,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
          }}>
            {scanResult.status === 'ok' ? <CheckCircle2 size={18} color="var(--success)" /> : <AlertTriangle size={18} color="var(--error)" />}
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: scanResult.status === 'ok' ? 'var(--success)' : 'var(--error)' }}>{scanResult.msg}</span>
          </div>
        )}

        <Button 
          variant={scanMode === 'entry' ? 'primary' : 'danger'}
          onClick={() => setIsScanning(true)} 
          style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 900 }}
        >
          <ScanLine size={20} /> AVVIA SCANNER
        </Button>
      </Card>

      {/* --- BACKUP CALL CARD --- */}
      <Card style={{ padding: '1.25rem', background: 'rgba(255,59,48,0.04)', border: '1px solid rgba(255,59,48,0.15)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1rem', color: 'var(--error)' }}>
          <Radio size={20} /> Supporto Rapido
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Invia un segnale di aiuto immediato a tutti i colleghi security in servizio.
        </p>

        {!alertSent ? (
          <Button 
            variant="danger"
            onClick={handleCallBackup} 
            style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 900 }}
          >
            <Radio size={20} /> RICHIAMO RINFORZI
          </Button>
        ) : (
          <div style={{
            width: '100%', padding: '1rem', borderRadius: '16px',
            background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)',
            color: '#ff453a', fontWeight: 800, fontSize: '0.85rem', textAlign: 'center',
            animation: 'pulse 1.5s infinite',
          }}>
            🚨 RICHIESTA INVIATA — Team in movimento
          </div>
        )}
      </Card>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { box-shadow: 0 0 0 15px rgba(255, 59, 48, 0); transform: scale(1); }
        }
        @keyframes blink-red {
          0% { border-color: var(--error); }
          50% { border-color: transparent; }
          100% { border-color: var(--error); }
        }
      `}</style>
    </div>
  );
}
