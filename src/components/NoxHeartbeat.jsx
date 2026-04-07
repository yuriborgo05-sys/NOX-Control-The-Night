import React, { useEffect, useState } from 'react';
import { useNoxStore } from '../store';
import { initGlobalSync } from '../services/db';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

/**
 * 💓 NoxHeartbeat Component
 * This is the central nervous system of the app.
 * It initializes the global data sync and monitors network connectivity.
 */
export function NoxHeartbeat() {
  const store = useNoxStore();
  const { isOffline, setOfflineStatus, isInitialSyncDone } = store;
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // 1. Initialize Global Data Sync (One connection for the whole app)
    const stopSync = initGlobalSync(store);

    // 2. Monitor Browser Network Connectivity
    const handleOnline = () => {
      setOfflineStatus(false);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };
    const handleOffline = () => {
      setOfflineStatus(true);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) setOfflineStatus(true);

    return () => {
      stopSync();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && !isOffline && isInitialSyncDone) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '0.6rem',
      padding: '0.6rem 1rem',
      borderRadius: '100px',
      background: isOffline ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
      color: 'white',
      fontSize: '0.75rem',
      fontWeight: 700,
      boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.1)',
      transition: 'all 0.3s ease',
      animation: 'slideDown 0.3s ease-out'
    }}>
      {isOffline ? <WifiOff size={16} /> : (isInitialSyncDone ? <Wifi size={16} /> : <RefreshCw size={16} className="animate-spin" />)}
      <span>{isOffline ? 'OFFLINE - Backup Locale Attivo' : (isInitialSyncDone ? 'CONNESSO' : 'SINCRONIZZAZIONE...')}</span>

      <style>{`
        @keyframes slideDown {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
