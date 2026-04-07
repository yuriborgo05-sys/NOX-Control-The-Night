import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine, Camera } from 'lucide-react';

export function QRScanner({ onResult, onClose, title = "Scansione QR Code" }) {
  const scannerRef = useRef(null);
  const regionRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader-region");
    scannerRef.current = scanner;

    const config = { 
      fps: 10, 
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true
    };

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" }, 
          config, 
          (decodedText) => {
            onResult(decodedText);
            stopScanner();
          },
          (errorMessage) => {
            // Sucesso nella scansione di frame individuali ma non ancora un QR
            // Non logghiamo per non sporcare la console
          }
        );
      } catch (err) {
        console.error("Scanner failed to start:", err);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        onClose();
      } catch (err) {
        console.error("Failed to stop scanner:", err);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      {/* Header Close button */}
      <div style={{
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 1001
      }}>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          color: 'white',
          padding: '0.75rem',
          borderRadius: '50%',
          cursor: 'pointer'
        }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'white', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <ScanLine color="var(--accent-color)" /> {title}
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Inquadra il QR all'interno dell'area di scansione.</p>
      </div>

      {/* Scanner Visual Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '350px',
        aspectRatio: '1',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '2px solid rgba(255,255,255,0.1)',
        boxShadow: '0 0 50px rgba(124,58,237,0.3)'
      }}>
        <div id="qr-reader-region" style={{ width: '100%', height: '100%' }}></div>
        
        {/* Animated Scanner Bar */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--accent-color), transparent)',
          boxShadow: '0 0 15px var(--accent-color)',
          zIndex: 10,
          animation: 'scan-anim 2s ease-in-out infinite'
        }}></div>

        {/* Camera Decoration if empty */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.1,
          zIndex: 0
        }}>
          <Camera size={80} />
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s infinite' }}></div>
        Camera di sistema pronta per scansione
      </div>

      <style>{`
        @keyframes scan-anim {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
