import React, { useEffect, useState } from 'react';
import { WifiOff, Zap } from 'lucide-react';

export function HackerModeOverlay({ active }) {
  const [flashlight, setFlashlight] = useState(false);

  useEffect(() => {
    let interval;
    if (active) {
      // Simulate Flashlight Hack (Visual only, as real flashlight API is limited)
      interval = setInterval(() => {
        setFlashlight(f => !f);
      }, 200);
    } else {
      setFlashlight(false);
    }
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: flashlight ? 'white' : 'black',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      transition: 'background 0.1s ease',
      color: flashlight ? 'black' : 'white'
    }}>
      <WifiOff size={80} style={{ marginBottom: '2rem', animation: 'pulse 1s infinite' }} />
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 900 }}>SEGNALE DISTURBATO</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.8 }}>
        ⚠️ Interferenza rilevata in Console.<br/>
        Stacca gli occhi dallo schermo...
      </p>
      
      <div style={{ 
        padding: '1.5rem', 
        border: `3px solid ${flashlight ? 'black' : 'var(--accent-color)'}`, 
        borderRadius: '20px',
        animation: 'shake 0.5s infinite'
      }}>
        <h2 style={{ fontSize: '2rem', margin: 0 }}>💃 É IL MOMENTO DI BALLARE!</h2>
      </div>

      <p style={{ marginTop: '3rem', fontSize: '0.8rem', opacity: 0.5 }}>
        Il segnale verrà ripristinato al termine del Drop.
      </p>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0% { transform: translate(0, 0) rotate(0); }
          25% { transform: translate(5px, -5px) rotate(1deg); }
          50% { transform: translate(-5px, 5px) rotate(-1deg); }
          75% { transform: translate(5px, 5px) rotate(1deg); }
          100% { transform: translate(0, 0) rotate(0); }
        }
      `}</style>
    </div>
  );
}
