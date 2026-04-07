import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Sparkles, X, Scan, Info, Camera, Zap, Share2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { hapticCheckIn, hapticSoftPop } from '../utils/haptics';

export function ARHostess() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();
  const [scanning, setScanning] = useState(true);
  const [arEnabled, setArEnabled] = useState(false);

  // Get hostess name from query or state (default Elena)
  const hostessName = new URLSearchParams(location.search).get('name') || 'Elena';

  useEffect(() => {
    // Simulate surface scanning
    const timer = setTimeout(() => {
        setScanning(false);
        addNotification("Superficie Rilevata", "Puoi proiettare l'ologramma ora.", "success");
    }, 3000);
    return () => clearTimeout(timer);
  }, [addNotification]);

  const handleBack = () => {
    hapticSoftPop();
    navigate('/customer');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'black', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      
      {/* ─── AR VIEWPORT (The Motor) ─── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle, #1a1a2e 0%, #000 100%)' }}>
        
        {/* Google Model Viewer */}
        <model-viewer
          src="https://modelviewer.dev/shared-assets/models/RobotExpressive.glb" 
          ios-src="https://modelviewer.dev/shared-assets/models/RobotExpressive.usdz"
          ar
          ar-modes="webxr scene-viewer quick-look"
          camera-controls
          shadow-intensity="1.5"
          environment-image="neutral"
          exposure="1"
          auto-rotate
          ar-placement="floor"
          ar-scale="fixed"
          alt="Holographic Hostess (20k-80k Poly, KTX2 Optimized)"
          style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
        >
          {/* Custom AR Button */}
          <button slot="ar-button" style={{ 
            position: 'absolute', bottom: '4rem', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, var(--accent-color), #db2777)', color: 'white', border: 'none',
            padding: '1.4rem 3rem', borderRadius: '50px', fontWeight: 900, fontSize: '1.1rem',
            boxShadow: '0 0 30px rgba(124,58,237,0.6)', zIndex: 10, cursor: 'pointer',
            letterSpacing: '0.05em', animation: 'heartbeat 2s infinite'
          }}>
            🕶️ PROIETTA SUL TAVOLO
          </button>
          
          {/* UX: Positioning Indicator */}
          <div slot="hotspot-dot" data-position="0 0 0" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px dashed var(--accent-color)', animation: 'rotate 4s linear infinite', opacity: arEnabled ? 0.6 : 0 }}></div>
        </model-viewer>

        {/* Scan Overlay (Holographic Effect Simulation) */}
        {scanning && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                <div style={{ width: '280px', height: '280px', border: '1px solid var(--accent-color)', borderRadius: '30px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 0%, var(--accent-color) 50%, transparent 100%)', opacity: 0.3, height: '100%', animation: 'scanLoop 2.5s infinite ease-in-out' }}></div>
                    <Scan size={64} color="var(--accent-color)" className="icon-glow" style={{ opacity: 0.8 }} />
                    
                    {/* Corner accents */}
                    <div style={{ position: 'absolute', top: 20, left: 20, width: 20, height: 20, borderTop: '2px solid white', borderLeft: '2px solid white' }}></div>
                    <div style={{ position: 'absolute', top: 20, right: 20, width: 20, height: 20, borderTop: '2px solid white', borderRight: '2px solid white' }}></div>
                    <div style={{ position: 'absolute', bottom: 20, left: 20, width: 20, height: 20, borderBottom: '2px solid white', borderLeft: '2px solid white' }}></div>
                    <div style={{ position: 'absolute', bottom: 20, right: 20, width: 20, height: 20, borderBottom: '2px solid white', borderRight: '2px solid white' }}></div>
                </div>
                <h2 style={{ marginTop: '2rem', color: 'white', letterSpacing: '0.2em', fontSize: '0.9rem', fontWeight: 900 }}>MAPPING SURFACE...</h2>
                <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: 'var(--accent-color)', animation: 'progressLoad 3s forwards' }}></div>
                </div>
            </div>
        )}

        {/* Holographic HUD UI */}
        {!scanning && (
            <div style={{ position: 'absolute', top: '1.5rem', left: '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }}>
                <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 12, height: 12, background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 15px var(--success)', animation: 'heartbeat 1.5s infinite' }}></div>
                        <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: 800, letterSpacing: '0.05em' }}>REALTÀ AUMENTATA: {hostessName.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontWeight: 700 }}>SCALA 1:1</div>
                </div>
            </div>
        )}

        <button onClick={handleBack} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '0.75rem', borderRadius: '50%', zIndex: 10, cursor: 'pointer', transition: 'all 0.3s' }}>
            <X size={20} />
        </button>
      </div>

      {/* ─── CONTROLS ─── */}
      <div style={{ background: '#0a0a0f', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem 2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'white' }}>Ologramma {hostessName}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                    <Sparkles size={14} color="var(--accent-color)" />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Premium Digital Double v2.4</p>
                </div>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(124,58,237,0.1)', borderRadius: '10px' }}>
                <Zap color="var(--accent-color)" size={24} />
            </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button className="btn-secondary" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem', cursor: 'not-allowed', opacity: 0.5 }}>
                CAMBIA OUTFIT
            </button>
            <button className="btn-secondary" style={{ padding: '1rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)', color: 'white', borderRadius: '14px', fontWeight: 700, fontSize: '0.85rem' }} onClick={() => window.location.reload()}>
                RICALIBRA
            </button>
        </div>
        
        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textAlign: 'center', fontStyle: 'italic' }}>
            Inquadra il tuo tavolo per una visualizzazione ottimale dell'ologramma.
        </p>
      </div>

      <style>{`
        @keyframes scanLoop {
            0% { transform: translateY(-100%); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes progressLoad {
            from { width: 0%; }
            to { width: 100%; }
        }
        @keyframes heartbeat {
            0% { transform: translateX(-50%) scale(1); }
            50% { transform: translateX(-50%) scale(1.05); }
            100% { transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}
