import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, ShieldCheck } from 'lucide-react';
import { useOracle } from '../context/OracleContext';
import { useAuth } from '../context/AuthContext';
import { Card } from './Card';
import { Button } from './Button';
import { hapticSoftPop } from '../utils/haptics';

export function VirtualAssistant() {
  const { user } = useAuth();
  const { askOracle } = useOracle();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Ciao! Sono l'Oracolo del Bamboo. Chiedimi pure su orari, prezzi, ruoli dello staff o funzioni dell'app.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');

  const toggleOpen = () => {
    hapticSoftPop();
    setIsOpen(!isOpen);
  };

  // --- KNOWLEDGE BASE (ORACLE V3 - PROJECT HEART) ---
  const KNOWLEDGE = {
    schedules: {
      days: "Apertura: Mercoledì, Venerdì, Sabato e Domenica.",
      hours: "Mer & Dom: 23:30 - 04:00. Ven & Sab: 21:00 - 04:00.",
      closed: "Chiuso: Lunedì, Martedì e Giovedì."
    },
    bottles: [
      { names: ['dom perignon', 'dom p', 'champagne'], price: "€ 500", full: "Dom Pérignon Vintage: € 500" },
      { names: ['belvedere', 'vodka', 'belve'], price: "€ 350", full: "Belvedere Vodka 1.75L: € 350" },
      { names: ['moet', 'moet ice', 'ice'], price: "€ 250", full: "Moët & Chandon Ice: € 250" },
      { names: ['gin', 'bombay', 'sapphire'], price: "€ 150", full: "Gin Bombay Sapphire: € 150" },
      { names: ['cristal', 'roederer'], price: "€ 800", full: "Louis Roederer Cristal: € 800" }
    ],
    zones: [
      { names: ['verde', 'pista'], min: "€ 500", desc: "Zona Pista (Verde): Spesa minima € 500." },
      { names: ['gialla', 'vip', 'social'], min: "€ 1.500", desc: "Zona VIP Social (Gialla): Spesa minima € 1.500." },
      { names: ['rossa', 'console', 'fire'], min: "€ 3.000", desc: "Zona Console/Fire (Rossa): Spesa minima € 3.000." }
    ],
    features: {
      ar: "AR Hostess: Seleziona una ragazza nel menu VIP, clicca 'Proietta Ologramma' e vedrai il suo modello 3D 1:1 sul tuo tavolo tramite WebXR.",
      chat: "Silent Chat: Messaggistica anonima tra tavoli. Inserisci il numero tavolo e invia testi o 'regali' digitali.",
      angel: "Angel Mode: Protezione attiva. Se il telefono rileva un urto (rissa/caduta), parte un countdown di 15s. Se non annullato, la security arriva al tavolo.",
      hacker: "Hacker Mode: Disabilitazione Wi-Fi/4G per massimizzare il ballo e l'interazione sociale (esclusiva Admin)."
    },
    roles: {
      pr: "PR: Gestisci tavoli, usa AI Matchmaker e scala la classifica (Serata/Mensile). Bonus per upselling live.",
      capo_pr: "Capo PR: Coordina le Image Girls dalla Regia, monitora la Heatmap e gestisce il ranking globale.",
      immagine: "Ragazze Immagine: Ricevi ordini di posizionamento, lascia feedback sui tavoli e interagisci via AR.",
      fotografo: "Fotografo: Segui la Heatmap 'Tavoli Caldi' per scatti VIP e coordina con la regia.",
      bodyguard: "Security: Intervento immediato su alert Angel Mode o segnalazioni staff.",
      cassiera: "Admin: Validazione rapida QR e gestione 'Hacker Mode' per il mood del locale.",
      cliente: "Cliente: Esperienza billionaire con AR, Silent Chat, Angel Mode e Priority Service.",
      cameriere: "Cameriere: Consegna e validazione QR al tavolo. Incasso contanti con alert frode."
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    
    // AI ORACLE RESPONSE
    const response = askOracle(input, user?.role || 'user');
    setInput('');

    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: response, sender: 'bot' }]);
    }, 4500); // 4.5s processing simulation
  };

  return (
    <>
      <div className="assistant-bubble" onClick={toggleOpen}>
        <MessageCircle size={28} />
      </div>

      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '12rem',
          right: '1.5rem',
          width: 'calc(100% - 3rem)',
          maxWidth: '360px',
          zIndex: 1000,
          animation: 'slideInBot 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <Card style={{ padding: 0, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.9)' }}>
            <div style={{ background: 'var(--accent-color)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Bot size={20} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '0.9rem' }}>Bamboo AI Oracle</strong>
                  {(user?.role === 'admin' || user?.role === 'head_pr') && (
                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <ShieldCheck size={10} /> Accesso Dati Riservato Attivo
                    </span>
                  )}
                </div>
              </div>
              <X size={20} onClick={toggleOpen} style={{ cursor: 'pointer' }} />
            </div>

            <div style={{ height: '300px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(0,0,0,0.4)' }}>
              {messages.map(m => (
                <div key={m.id} style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  background: m.sender === 'user' ? 'var(--accent-color)' : 'rgba(255,255,255,0.08)',
                  padding: '0.6rem 0.9rem',
                  borderRadius: m.sender === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  maxWidth: '85%',
                  fontSize: '0.85rem',
                  lineHeight: '1.4'
                }}>
                  {m.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleSend} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <input 
                type="text" 
                className="input-base" 
                placeholder="Chiedi qualcosa..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.5)' }}
              />
              <button type="submit" style={{ background: 'var(--accent-color)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </form>
          </Card>
        </div>
      )}

      <style>{`
        @keyframes slideInBot {
          from { transform: scale(0.8) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
