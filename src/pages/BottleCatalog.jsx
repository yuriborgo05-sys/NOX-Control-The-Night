import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShoppingBag, Plus, Minus, CreditCard, 
  CheckCircle2, ShieldCheck, MapPin, Zap, Search, 
  Grid, X 
} from 'lucide-react';
import { noxMenu } from '../data/noxData';
import { playCoinSound, playBottleDeliveredSound } from '../utils/audio';
import { hapticSoftPop, hapticBottleDelivered } from '../utils/haptics';
import { useAuth } from '../context/AuthContext';
import { useNoxStore } from '../store';
import { useNotification } from '../context/NotificationContext';
import { placeOrder } from '../services/db';
import { CatalogHeader } from '../features/catalog/CatalogHeader';

export function BottleCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasEntered, userTable } = useNoxStore();
  const [category, setCategory] = useState(noxMenu[0].category);
  const [cart, setCart] = useState({});
  const [isCheckout, setIsCheckout] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('apple_pay');
  const [deliveryTarget, setDeliveryTarget] = useState('me');
  const [otherTable, setOtherTable] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFullMenu, setShowFullMenu] = useState(false);
  
  // Mixers logic (dynamically get from Analcolici category, fallback if not found)
  const MIXERS_CATALOG = noxMenu.find(c => c.category === 'Analcolici')?.items.map(i => i.name) || [];
  const [selectedMixers, setSelectedMixers] = useState({}); // { name: qty }
  const { addNotification } = useNotification();

  useEffect(() => {
    const timer = setTimeout(() => {
      addNotification("⚡ VIP Status Boost", "Il catalogo è ora ottimizzato per te. Priorità alta assegnata alle tue prossime richieste!", "success");
    }, 180000); // 3 minutes
    return () => clearTimeout(timer);
  }, [addNotification]);

  const addToCart = (bottle) => {
    playCoinSound();
    hapticSoftPop();
    setCart(prev => ({...prev, [bottle.name]: (prev[bottle.name] || 0) + 1}));
  };
  const removeFromCart = (bottle) => setCart(prev => { 
      const n = {...prev}; 
      if(n[bottle.name] > 1) n[bottle.name] -= 1; else delete n[bottle.name]; 
      return n; 
  });

  const total = React.useMemo(() => {
    return Object.entries(cart).reduce((acc, [name, qty]) => {
      let b; 
      for (const cat of noxMenu) {
        for (const itm of cat.items) {
          if (itm.name === name) { b = itm; break; }
        }
        if (b) break;
      }
      return acc + (b ? b.price * qty : 0);
    }, 0);
  }, [cart]);

  // Count only REAL bottles (exclude Analcolici from granting 6 free mixers)
  const totalBottles = React.useMemo(() => {
    return Object.entries(cart).reduce((acc, [name, qty]) => {
      const isAnalcolico = noxMenu.find(c => c.category === 'Analcolici')?.items.some(i => i.name === name);
      return acc + (isAnalcolico ? 0 : qty);
    }, 0);
  }, [cart]);

  const totalItems = Object.values(cart).reduce((a,b)=>a+b,0);
  
  const activeItems = noxMenu.find(c => c.category === category)?.items || [];
  const filteredItems = activeItems.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handlePayment = async () => {
    const orderItems = Object.entries(cart).map(([name, qty]) => ({ name, qty }));
    
    try {
      if (!user) {
        alert("Devi essere loggato per ordinare.");
        return;
      }
      await placeOrder({
        userId: user.id || 'anonymous',
        userName: user.name || 'Ospite',
        items: orderItems,
        total,
        paymentMethod,
        target: deliveryTarget,
        otherTable: deliveryTarget === 'other' ? otherTable : null,
        giftMessage: deliveryTarget === 'other' ? giftMessage : null,
        table: deliveryTarget === 'me' ? userTable : otherTable,
        mixers: selectedMixers,
        pr: user.prAssigned || 'Sara'
      });

      playBottleDeliveredSound();
      hapticBottleDelivered();
      setIsPaid(true);
    } catch (error) {
      console.error("Order failed:", error);
      alert("Errore nell'invio dell'ordine. Riprova.");
    }
  }

  if(isPaid) {
      return (
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', flex: 1, textAlign: 'center' }}>
            <CheckCircle2 color="var(--success)" size={80} style={{ marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))' }} />
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Pagamento Confermato</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Ordine Inviato (Tavolo {userTable} - PR: {user?.prAssigned || 'Sara'}). La Cassa sta preparando la tua comanda.</p>
            
            <Card style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', width: '100%', marginBottom: '2rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: 600, marginBottom: '0.5rem' }}>Segui in tempo reale</p>
                <p style={{ fontSize: '0.85rem' }}>Il cameriere riceverà i dettagli dell'ordine e consegnerà la bottiglia direttamente al tuo tavolo.</p>
            </Card>

            <Button variant="primary" style={{ width: '100%' }} onClick={() => navigate('/profile')}>Vai ai Miei Ordini</Button>
         </div>
      );
  }

  if(isCheckout) {
      return (
         <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', flex: 1 }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <button onClick={() => setIsCheckout(false)} style={{ background: 'none', border: 'none', color: 'white' }}><ArrowLeft size={24} /></button>
              <h2 style={{ margin: 0 }}>Checkout Ordine</h2>
            </header>

            <Card style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-secondary)' }}><MapPin size={18}/> Consegna</h4>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Button variant={deliveryTarget === 'me' ? 'primary' : 'secondary'} onClick={() => setDeliveryTarget('me')} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>Al mio Tavolo</Button>
                    <Button variant={deliveryTarget === 'other' ? 'primary' : 'secondary'} onClick={() => setDeliveryTarget('other')} style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem' }}>🎁 Offri a un Tavolo</Button>
                </div>

                {deliveryTarget === 'me' ? (
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ fontWeight: 600, margin: 0 }}>Tavolo Assegnato: {userTable}</p>
                          <span style={{ fontSize: '0.65rem', background: 'var(--error)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>UNICO</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: 0 }}>PR Riferimento: Sara Bianchi</p>
                  </div>
                ) : (
                  <div style={{ background: 'linear-gradient(135deg, rgba(255,105,180,0.15), rgba(124,58,237,0.15))', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,105,180,0.3)' }}>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>A chi vuoi offrire la bottiglia?</p>
                      <input type="text" placeholder="Es. Tavolo Pista 4" className="input-base" value={otherTable} onChange={e => setOtherTable(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', fontSize: '0.9rem', marginBottom: '0.75rem' }} />
                      
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Messaggio (max 60 car.)</p>
                      <textarea 
                        maxLength={60}
                        placeholder="Es. Buon compleanno! Da Tavolo 14" 
                        className="input-base" 
                        value={giftMessage} 
                        onChange={e => setGiftMessage(e.target.value)} 
                        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', fontSize: '0.85rem', minHeight: '60px' }} 
                      />
                      
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem', margin: 0 }}>Il cameriere consegnerà la bottiglia al tavolo indicato con il tuo messaggio. 🔥</p>
                  </div>
                )}
            </Card>

            {totalBottles > 0 && (
              <Card style={{ marginBottom: '1.5rem', border: (Object.values(selectedMixers).reduce((a,b)=>a+b,0) !== totalBottles * 6) ? '1px solid var(--error)' : '1px solid var(--success)' }}>
                  <h4 style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Analcolici Omaggio (6 per bottiglia)</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>Scegli esattamente {totalBottles * 6} analcolici ({Object.values(selectedMixers).reduce((a,b)=>a+b,0)} selezionati)</p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {MIXERS_CATALOG.map(m => (
                      <div key={m} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.75rem' }}>{m}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button onClick={() => setSelectedMixers(prev => ({ ...prev, [m]: Math.max(0, (prev[m] || 0) - 1) }))} style={{ background: 'none', border: 'none', color: 'white' }}><Minus size={14}/></button>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '15px', textAlign: 'center' }}>{selectedMixers[m] || 0}</span>
                          <button onClick={() => setSelectedMixers(prev => ({ ...prev, [m]: (prev[m] || 0) + 1 }))} style={{ background: 'none', border: 'none', color: 'white' }}><Plus size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
              </Card>
            )}

            <Card style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Riepilogo Bottiglie</h4>
                {Object.entries(cart).map(([name, qty]) => {
                    let b; noxMenu.forEach(c => c.items.forEach(i => { if(i.name === name) b = i; }));
                    return (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span>{qty}x {name}</span>
                            <strong>€ {b.price * qty}</strong>
                        </div>
                    );
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Totale</span>
                    <strong style={{ color: 'var(--accent-color)', fontSize: '1.4rem' }}>€ {total}</strong>
                </div>
            </Card>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Metodo di Pagamento</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                 <Button variant={paymentMethod === 'apple_pay' ? 'primary' : 'secondary'} onClick={() => setPaymentMethod('apple_pay')} style={{ padding: '0.8rem', fontSize: '0.9rem' }}>Apple Pay</Button>
                 <Button variant={paymentMethod === 'cash' ? 'primary' : 'secondary'} onClick={() => setPaymentMethod('cash')} style={{ padding: '0.8rem', fontSize: '0.9rem', background: paymentMethod === 'cash' ? 'var(--success)' : ''}}>💰 Contanti</Button>
              </div>
            </div>

            {!hasEntered && (
              <div style={{ padding: '1rem', background: 'var(--warning-bg)', border: '1px solid rgba(255,184,48,0.3)', borderRadius: '12px', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                <Zap color="var(--warning)" size={20} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--warning)' }}>Checkout bloccato in Pre-Serata. Scannerizza il tuo QR all'ingresso per sbloccare l'acquisto.</span>
              </div>
            )}

            <Button 
                disabled={!hasEntered || (totalBottles > 0 && Object.values(selectedMixers).reduce((a,b)=>a+b,0) !== totalBottles * 6)} 
                variant={hasEntered ? 'primary' : 'secondary'} 
                onClick={handlePayment} 
                style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (hasEntered && (totalBottles === 0 || Object.values(selectedMixers).reduce((a,b)=>a+b,0) === totalBottles * 6)) ? 1 : 0.5 }}
            >
                {paymentMethod === 'apple_pay' ? <><CreditCard size={24} /> Paga € {total}</> : <><CheckCircle2 size={24} /> Ordina & Paga al Tavolo</>}
            </Button>
            {paymentMethod === 'apple_pay' && <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'gray', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}><ShieldCheck size={14}/> Pagamento sicuro processato tramite Stripe.</p>}
         </div>
      );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '1rem', paddingBottom: '2rem', flex: 1 }}>
      
      <CatalogHeader user={user} />

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Cerca prodotto..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-base"
          style={{ paddingLeft: '2.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
      </div>

      {/* Category Selection Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, marginRight: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>Categoria</label>
          <select 
            className="input-base" 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', color: 'white', background: 'rgba(255,255,255,0.05)' }}
          >
            {noxMenu.map(c => (
              <option key={c.category} value={c.category} style={{ color: 'black' }}>
                {c.category}
              </option>
            ))}
          </select>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => setShowFullMenu(true)}
          style={{ padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
        >
          <Grid size={16} /> TUTTO
        </Button>
      </div>

      {/* Categories Horizontal Scroll (Keep for quick single-tap, but made smaller) */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', marginBottom: '1.5rem', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
         {noxMenu.map(c => (
             <button key={c.category} 
                     onClick={() => setCategory(c.category)} 
                     style={{ 
                        whiteSpace: 'nowrap', padding: '0.4rem 0.8rem', borderRadius: '15px', fontSize: '0.75rem',
                        border: 'none', background: c.category === category ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                        color: c.category === category ? 'white' : 'var(--text-secondary)',
                        fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                     }}>
                 {c.category}
             </button>
         ))}
      </div>

      {/* Product List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '100px' }}>
         {filteredItems.map(b => {
             const isSoldOut = b.inventory_count === 0;
             const isLowStock = b.inventory_count === 2;
             const isExclusive = b.inventory_count === undefined && b.price >= 600;
             return (
             <Card key={b.name} className="parallax-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: cart[b.name] ? 'rgba(94, 92, 230, 0.1)' : 'var(--bg-card)', opacity: isSoldOut ? 0.5 : 1, borderColor: isLowStock ? 'rgba(239,68,68,0.5)' : 'var(--border-card)' }}>
                 <div style={{ flex: 1, paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                        <strong style={{ fontSize: '1rem' }}>{b.name}</strong>
                        {isSoldOut && <span style={{fontSize:'0.62rem', background:'rgba(239,68,68,0.15)', color:'var(--error)', border:'1px solid var(--error)', padding:'2px 5px', borderRadius:'4px', fontWeight:800}}>SOLD OUT</span>}
                        {isLowStock && !isSoldOut && <span style={{fontSize:'0.62rem', background:'rgba(239,68,68,0.15)', color:'var(--error)', border:'1px solid rgba(239,68,68,0.5)', padding:'2px 5px', borderRadius:'4px', fontWeight:800, animation:'heartbeat 1.5s infinite'}}>🔴 ULTIME 2</span>}
                        {isExclusive && <span style={{fontSize:'0.62rem', background:'rgba(255,215,0,0.15)', color:'gold', border:'1px solid rgba(255,215,0,0.4)', padding:'2px 5px', borderRadius:'4px', fontWeight:800}}><Zap size={9}/> ESCLUSIVA</span>}
                    </div>
                    <span style={{ color: 'var(--accent-color)', fontWeight: 800, fontSize: '1.05rem' }}>{b.price} €</span>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '12px' }}>
                     {cart[b.name] > 0 ? (
                        <>
                           <button onClick={() => removeFromCart(b)} style={{ background:'none', border:'none', color:'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={20}/></button>
                           <strong style={{ width: '20px', textAlign: 'center' }}>{cart[b.name]}</strong>
                        </>
                     ) : null}
                     <button disabled={isSoldOut} onClick={() => addToCart(b)} style={{ background:'none', border:'none', color: isSoldOut ? 'gray' : 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSoldOut ? 'not-allowed' : 'pointer' }}><Plus size={20}/></button>
                 </div>
             </Card>
             );
         })}
      </div>

       {/* Full Catalog Grid Modal (Schermo Intero) */}
       {showFullMenu && (
         <div style={{
           position: 'fixed', inset: 0, background: 'rgba(5,5,10,0.98)',
           backdropFilter: 'blur(20px)', zIndex: 2000, padding: '1.5rem',
           display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-out'
         }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Grid color="var(--accent-color)" /> Catalogo Bamboo
              </h2>
              <button 
                onClick={() => setShowFullMenu(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.6rem', borderRadius: '50%', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '2rem' }}>
              {noxMenu.map(cat => (
                <div key={cat.category} style={{ marginBottom: '2rem' }}>
                   <h3 style={{ fontSize: '0.85rem', color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                     {cat.category}
                   </h3>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                     {cat.items.map(item => (
                       <button 
                         key={item.name}
                         onClick={() => { setCategory(cat.category); setShowFullMenu(false); setSearchTerm(item.name); }}
                         style={{
                           background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                           borderRadius: '16px', padding: '1rem', textAlign: 'left', cursor: 'pointer'
                         }}
                       >
                         <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.2rem' }}>{item.name}</strong>
                         <span style={{ color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 700 }}>€ {item.price}</span>
                       </button>
                     ))}
                   </div>
                </div>
              ))}
            </div>
         </div>
       )}

       {/* Floating Tab Checkout */}
       <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'rgba(28, 28, 30, 0.85)', backdropFilter: 'blur(30px) saturate(200%)', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
           <div style={{ maxWidth: '480px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Totale App ({totalItems} bottiglie)</span>
                  <strong style={{ fontSize: '1.6rem', color: 'var(--accent-color)' }}>{total} €</strong>
               </div>
               <Button variant="primary" onClick={() => setIsCheckout(true)} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', opacity: total === 0 ? 0.3 : 1, pointerEvents: total === 0 ? 'none' : 'auto' }}>
                 Checkout Sicuro
               </Button>
           </div>
       </div>
    </div>
  );
}
