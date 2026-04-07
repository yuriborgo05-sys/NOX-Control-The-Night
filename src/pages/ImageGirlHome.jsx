import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users as UsersIcon, QrCode, LogOut, Volume2, Send, Star, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useNox } from '../context/NoxContext';
import { useNavigate } from 'react-router-dom';
import { hapticFraud } from '../utils/haptics';
import { streamStaffMessages, sendStaffMessage, streamOrders, saveReview, recordEntry } from '../services/db';
import { formatTime } from '../utils/formatTime';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNoxStore } from '../store';

export function ImageGirlHome() {
  const { user, logout } = useAuth();
  const { config } = useNox();
  const navigate = useNavigate();

  const { addNotification } = useNotification();
  const { 
    orders: liveOrders, 
    staffMessages: chat, 
    isInitialSyncDone 
  } = useNoxStore();

  // Chat tracking (local UI status)
  const [isRead, setIsRead] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [reviewData, setReviewData] = useState({ table: '', text: '', rating: 'POSITIVA' });
  const [reviewSent, setReviewSent] = useState(false);

  // Guest List State
  const [activeSection, setActiveSection] = useState('operativa'); // 'operativa' | 'lista'
  const [guestName, setGuestName] = useState('');
  const [guestGender, setGuestGender] = useState('D');
  const [searchQuery, setSearchQuery] = useState('');
  const [guestList, setGuestList] = useState(() => {
    const saved = localStorage.getItem('nox_guestlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('nox_guestlist', JSON.stringify(guestList));
  }, [guestList]);

  const addGuest = () => {
    if (!guestName.trim()) return;
    const newGuest = { id: Date.now(), name: guestName, gender: guestGender, checkedIn: false, timestamp: Date.now() };
    setGuestList([newGuest, ...guestList]);
    setGuestName('');
    addNotification("AGGIUNTO ALLA LISTA", `${guestName} è stato inserito con successo.`, "success");
  };

  const handleCheckIn = (guest) => {
    setGuestList(prev => prev.map(g => g.id === guest.id ? { ...g, checkedIn: true } : g));
    // In db.js: recordEntry(type, gender)
    recordEntry('normale', guest.gender);
    addNotification("CHECK-IN COMPLETATO", `${guest.name} è entrato nel locale.`, "success");
  };

  useEffect(() => {
    // Check for unread messages when store 'chat' updates
    const lastReadId = localStorage.getItem(`nox_last_read_${user?.id}`);
    if (chat.length > 0 && chat[0].id !== lastReadId && chat[0].sender !== 'Tu' && chat[0].sender !== user?.name) {
      setIsRead(false);
    }
  }, [chat, user?.id, user?.name]);

  // Derive top 2 spending tables
  const topTables = liveOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((acc, o) => {
      const existing = acc.find(t => t.table === o.table);
      if (existing) {
        existing.spend += o.total || 0;
        existing.bottles += o.items?.reduce((s, i) => s + i.qty, 0) || 0;
      } else {
        acc.push({ table: o.table, client: o.name, pr: o.pr, spend: o.total || 0, bottles: o.items?.reduce((s, i) => s + i.qty, 0) || 0 });
      }
      return acc;
    }, [])
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 2);

  const handleReply = async () => {
     if(!replyText.trim()) return;
     await sendStaffMessage({ sender: 'Tu', text: replyText });
     setReplyText('');
     setIsRead(true);
  };

  const handleSOS = () => {
    hapticFraud(); // Vibrazione prolungata
    // Richiesta reale in DB
    sendStaffMessage({ sender: 'Security System', text: `🚨 SOS ESTREMO RICHIESTO DA ${user?.name} in SALA!` });
    addNotification("SOS INVIATO", "La sicurezza sta arrivando immediatamente alla tua posizione.", "error");
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, paddingBottom: '6rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--accent-glow)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--accent-light)' }}>
                <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{user?.name?.charAt(0)}</span>
            </div>
            <div>
                <h2 style={{ fontSize: '1rem', margin: 0, color: 'white' }}>IMAGE TEAM</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0 }}>{user?.name}</p>
            </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{ background: 'rgba(255,69,58,0.1)', border: 'none', color: '#ff453a', padding: '0.6rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <LogOut size={18} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>ESCI</span>
        </button>
      </header>

      {/* TABS SEPARATOR */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={() => setActiveSection('operativa')} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: activeSection === 'operativa' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: activeSection === 'operativa' ? 'white' : 'var(--text-secondary)', fontWeight: 700, transition: '0.2s' }}>OPERATIVA</button>
          <button onClick={() => setActiveSection('lista')} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', border: 'none', background: activeSection === 'lista' ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', color: activeSection === 'lista' ? 'white' : 'var(--text-secondary)', fontWeight: 700, transition: '0.2s' }}>LISTA</button>
      </div>

      {activeSection === 'operativa' ? (
        <>

      {/* CHIAMATA E CHAT BIDIREZIONALE */}
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', marginTop: '1rem' }}>
          <Volume2 size={24} className={!isRead ? "icon-glow" : ""} color={!isRead ? "var(--error)" : "white"} /> 
          Centrale Operativa
      </h3>
      
      <Card style={{ background: !isRead ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-card)', borderColor: !isRead ? 'var(--error)' : 'var(--border-card)', animation: !isRead ? 'pulse 2s infinite' : 'none' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '1rem', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
           {chat.map((msg, idx) => {
             const isMe = msg.sender === 'Tu' || msg.sender === user?.name;
             const isNew = idx === 0 && !isRead;
             return (
               <div key={msg.id || idx} style={{ 
                 alignSelf: isMe ? 'flex-end' : 'flex-start', 
                 background: isMe ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)', 
                 padding: '1rem', 
                 borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', 
                 border: !isMe && isNew ? '1px solid var(--error)' : '1px solid rgba(255,255,255,0.05)',
                 maxWidth: '85%',
                 boxShadow: !isMe && isNew ? '0 0 15px rgba(239,68,68,0.2)' : 'none'
               }}>
                   <strong style={{ fontSize: '0.8rem', color: msg.sender === 'Capo PR' ? 'var(--warning)' : 'white', display: 'block', marginBottom: '0.4rem' }}>{msg.sender === user?.name ? 'Tu' : msg.sender} • {formatTime(msg.timestamp)}</strong>
                   <p style={{ fontSize: '1rem', margin: 0 }}>{msg.text}</p>
               </div>
             );
           })}
        </div>

        {!isRead && chat.length > 0 && (
            <Button variant="primary" onClick={() => {
              setIsRead(true);
              if (chat[0]?.id) localStorage.setItem(`nox_last_read_${user?.id}`, chat[0].id);
            }} style={{ width: '100%', background: 'var(--error)', marginBottom: '1rem' }}>Segna Messaggi come Letti</Button>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <input 
               type="text" 
               className="input-base" 
               placeholder="Rispondi alla regia..." 
               value={replyText}
               onChange={e => setReplyText(e.target.value)}
               style={{ flex: 1, marginBottom: 0 }}
            />
            <Button variant="primary" onClick={handleReply} style={{ padding: '0.8rem 1.2rem' }}><Send size={18}/></Button>
        </div>
      </Card>

      {/* TAVOLI TOP SPESA */}
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', marginTop: '1.5rem', marginBottom: '0.2rem' }}>
          <Star size={20} color="var(--accent-color)" /> Focus Serata (Top Tavoli)
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>I tavoli con la spesa bottiglie più elevata. Priorità assoluta di animazione.</p>
      <Card style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem' }}>
         {topTables.length > 0 ? topTables.map(t => (
           <div key={t.table} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <strong style={{ display: 'block' }}>Tavolo {t.table}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cliente: {t.client} - PR: {t.pr || 'Organico'}</span>
              </div>
              <strong style={{ color: 'var(--accent-color)' }}>{t.bottles} Bottiglie</strong>
           </div>
         )) : (
           <p style={{ textAlign: 'center', color: 'gray', padding: '1rem', fontSize: '0.8rem' }}>Nessun tavolo attivo rilevante.</p>
         )}
      </Card>

      {/* RECENSIONE TAVOLI INTERNA RIGIDA */}
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', marginTop: '1.5rem', marginBottom: '0.2rem' }}>
          <ThumbsUp size={20} color="var(--success)" /> Rapporto Sicurezza / PR
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Scegli il tavolo e compila il rapporto per avvisare regia e PR di spese o problemi.</p>
        
      {!reviewSent ? (
          <Card>
            <select 
              className="input-base" 
              style={{ marginBottom: '0.75rem' }}
              value={reviewData.table}
              onChange={e => setReviewData({...reviewData, table: e.target.value})}
            >
               <option value="" disabled style={{color:'black'}}>Seleziona Tavolo Target...</option>
               {liveOrders.map(o => (
                 <option key={o.id} value={o.table} style={{color:'black'}}>Tavolo {o.table} (Cliente: {o.name})</option>
               ))}
               <option value="Generale" style={{color:'black'}}>Feedback Generale Serata</option>
            </select>
            <textarea 
              maxLength={999}
              placeholder="Scrivi una nota (max 999 car). Es. 'Tutto bene, offrono tanto'..."
              className="input-base"
              style={{ minHeight: '80px', resize: 'vertical', marginBottom: '0.2rem' }}
              value={reviewData.text}
              onChange={e => setReviewData({...reviewData, text: e.target.value})}
            />
            <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'gray', marginBottom: '1rem' }}>Max 999 caratteri</div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Esito dell'Esperienza Cliente:</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    saveReview({ ...reviewData, rating: 'POSITIVA', type: 'staff', sender: user?.name, tag: `TAV ${reviewData.table}` });
                    setReviewSent(true);
                  }} 
                  style={{ flex: 1, borderColor: 'var(--success)', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <ThumbsUp size={16} /> POSITIVA
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => {
                    saveReview({ ...reviewData, rating: 'NEGATIVA', type: 'staff', sender: user?.name, tag: `TAV ${reviewData.table}` });
                    setReviewSent(true);
                  }} 
                  style={{ flex: 1, borderColor: 'var(--error)', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <ThumbsDown size={16} /> NEGATIVA
                </Button>
            </div>
          </Card>
      ) : (
          <Card style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
              <CheckCircle2 size={48} color="var(--success)" style={{ marginBottom: '1rem' }} />
              <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Rapporto Inviato in Regia</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Grazie per la tua segnalazione operativa.</p>
              <Button variant="secondary" onClick={() => setReviewSent(false)} style={{ marginTop: '1.5rem' }}>Nuova Segnalazione</Button>
          </Card>
      )}

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes pulse-sos {
          0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
          70% { box-shadow: 0 0 0 20px rgba(255, 0, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
      `}</style>
      
      {activeSection === 'lista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* ADD GUEST FORM */}
            <Card style={{ borderLeft: '4px solid var(--accent-light)' }}>
                <h4 style={{ margin: 0, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserPlus size={18}/> Aggiungi Ragazzo/a</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="input-base" 
                      placeholder="Nome e Cognome..." 
                      style={{ flex: 1, marginBottom: 0 }}
                      value={guestName}
                      onChange={e => setGuestName(e.target.value)}
                    />
                    <select 
                      className="input-base" 
                      style={{ width: '80px', marginBottom: 0, color: 'black' }}
                      value={guestGender}
                      onChange={e => setGuestGender(e.target.value)}
                    >
                        <option value="D">D</option>
                        <option value="U">U</option>
                    </select>
                </div>
                <Button variant="primary" onClick={addGuest} style={{ width: '100%', marginTop: '0.75rem' }}>AGGIUNGI IN LISTA</Button>
            </Card>

            {/* SEARCH & LIST */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Search size={18} color="var(--text-secondary)" />
                <input 
                  type="text" 
                  placeholder="Cerca nella tua lista..." 
                  style={{ background: 'none', border: 'none', color: 'white', flex: 1, fontSize: '0.9rem', outline: 'none' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            <Card style={{ padding: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>NAME / GENDER</span>
                    <span>ACTION</span>
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {guestList
                      .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(g => (
                        <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: g.checkedIn ? 0.4 : 1 }}>
                            <div>
                                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{g.name}</strong>
                                <span style={{ fontSize: '0.7rem', color: g.gender === 'D' ? 'var(--accent-light)' : 'var(--accent-color)' }}>{g.gender === 'D' ? '♀ FEMMINA' : '♂ MASCHIO'}</span>
                            </div>
                            {g.checkedIn ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 700 }}>
                                  <CheckCircle2 size={16}/> IN LOCALE
                              </div>
                            ) : (
                              <Button variant="secondary" onClick={() => handleCheckIn(g)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,250,96,0.1)', borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                                  <QrCode size={14}/> CHECK-IN
                              </Button>
                            )}
                        </div>
                      ))}
                    {guestList.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'gray' }}>
                          <UsersIcon size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                          <p style={{ margin: 0, fontSize: '0.8rem' }}>La tua lista è vuota.</p>
                      </div>
                    )}
                </div>
            </Card>
        </div>
      )}

      {/* FLOATING SOS BUTTON */}
      <button 
        onClick={handleSOS}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff0000, #990000)',
          border: '2px solid #ff4444',
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 8px 32px rgba(255,0,0,0.6)',
          zIndex: 9999,
          cursor: 'pointer',
          animation: 'pulse-sos 2s infinite'
        }}
      >
        <AlertTriangle size={32} />
      </button>

      {activeSection === 'operativa' && <div style={{ height: '0' }} />} {/* Dummy for flex */}
      </>
      ) : null }
    </div>
  );
}
