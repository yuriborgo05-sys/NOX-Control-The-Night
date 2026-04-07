import React, { createContext, useContext, useState } from 'react';

const OracleContext = createContext();

const MASTER_KNOWLEDGE = {
  opening_hours: {
    mercoledi: "23:30 - 04:00",
    domenica: "23:30 - 04:00",
    venerdi: "21:00 - 04:00",
    sabato: "21:00 - 04:00"
  },
  prices: {
    bottles: [
      { name: "Dom Pérignon 6L", price: 12000 },
      { name: "Cristal Rosé", price: 1500 },
      { name: "Dom Pérignon Vintage", price: 500 },
      { name: "Grey Goose 3L", price: 800 },
      { name: "Belvedere 1.75L", price: 450 },
      { name: "Moët & Chandon", price: 150 }
    ],
    cocktails: "15€ - 20€",
    entry: "Gratuito (Selezione all'ingresso)"
  },
  zones: {
    verde: { name: "Zona Pista", min_spend: 500, access: "Standard" },
    gialla: { name: "Zona VIP / Prive B", min_spend: 1500, access: "Privilegiato" },
    rossa: { name: "Zona Console / Prive A", min_spend: 5000, access: "Elite Only" }
  },
  roles: {
    pr: "Responsabile vendite e pubbliche relazioni. Gestisce le prenotazioni e segue il cliente durante la serata.",
    head_pr: "Coordinatore del team PR. Gestisce le strategie di allocazione dei tavoli VIP.",
    image_girl: "Ragazza Immagine. Si occupa dell'animazione al tavolo e dell'energia della serata.",
    photographer: "Fotografo Ufficiale. Immortala i momenti più esclusivi e i 'Delivery Show'.",
    bodyguard: "Security. Garantisce la sicurezza totale e interviene per SOS silenti o Angel Mode.",
    cashier: "Cassa. Gestisce la validazione QR all'ingresso e i pagamenti manuali.",
    waiter: "Cameriere di Sala. Serve le bottiglie e risponde alle chiamate di servizio (Ghiaccio, Lattine).",
    cliente: "Ospite VIP del club. Utilizza l'app per ordini 1:1, AR Hostess e Socializing.",
    admin: "Regia. Ha il controllo totale sul sistema, inclusa la gestione folla (Hacker Mode)."
  }
};

export function OracleProvider({ children }) {
  const [history, setHistory] = useState([]);

  const askOracle = (query, userRole = 'user') => {
    const q = query.toLowerCase();
    
    // Privacy Gate for Internal Stats
    if (q.includes('statistiche') || q.includes('guadagni') || q.includes('fatturato')) {
      if (userRole !== 'admin' && userRole !== 'head_pr') {
        return "⚠️ Errore di Accesso: Le statistiche finanziarie del club sono riservate esclusivamente alla Direzione e ai Capi PR.";
      }
    }

    // Logic for Knowledge Base
    if (q.includes('orari') || q.includes('apertura')) {
      return `Il Bamboo è aperto: Mer/Dom (${MASTER_KNOWLEDGE.opening_hours.mercoledi}), Ven/Sab (${MASTER_KNOWLEDGE.opening_hours.venerdi}).`;
    }

    if (q.includes('prezzo') || q.includes('costo')) {
      if (q.includes('verde')) return `La Zona Verde (Pista) ha una spesa minima di ${MASTER_KNOWLEDGE.zones.verde.min_spend}€.`;
      if (q.includes('gialla')) return `La Zona Gialla (VIP) ha una spesa minima di ${MASTER_KNOWLEDGE.zones.gialla.min_spend}€.`;
      if (q.includes('rossa')) return `La Zona Rossa (Console) ha una spesa minima di ${MASTER_KNOWLEDGE.zones.rossa.min_spend}€.`;
      
      const bottle = MASTER_KNOWLEDGE.prices.bottles.find(b => q.includes(b.name.toLowerCase()));
      if (bottle) return `Il prezzo del ${bottle.name} è di ${bottle.price}€.`;
      
      return "I prezzi variano da 150€ per lo Champagne base fino a 12.000€ per la Mathusalem di Dom Pérignon. Chiedimi un modello specifico!";
    }

    if (q.includes('cosa fa') || q.includes('ruolo') || q.includes('compiti')) {
      for (const role in MASTER_KNOWLEDGE.roles) {
        if (q.includes(role)) return MASTER_KNOWLEDGE.roles[role];
      }
    }

    if (q.includes('hacker') || q.includes('balli coatti') || q.includes('disturbo')) {
      return "L'Hacker Mode (Balli Coatti) è una funzione della Regia per massimizzare l'energia. Simula un disturbo del segnale Wi-Fi/4G e attiva i flash degli smartphone per obbligare tutti a ballare durante il drop del DJ.";
    }

    if (q.includes('ruoli') || q.includes('personale') || q.includes('chi lavora')) {
      return "Il Bamboo supporta 18 ruoli professionali tra cui: Cliente VIP, PR, Capo PR, Immagine, Fotografo, Security, Cassa, Cameriere e Regia Admin.";
    }

    if (q.includes('app') || q.includes('utilizzare') || q.includes('funziona')) {
        return "L'app ti permette di: \n1. Ordinare bottiglie in tempo reale al tavolo.\n2. Attivare l'AR Hostess (se hai speso >1500€).\n3. Usare la Silent Chat per offrire drink ad altri tavoli.\n4. Attivare l'Angel Mode in caso di pericolo.";
    }

    return "Sono l'Oracle del Bamboo. La mia conoscenza è vasta quanto la nostra cantina. Chiedimi pure su orari, prezzi bottiglie, ruoli dello staff o come usare l'app.";
  };

  return (
    <OracleContext.Provider value={{ askOracle, history }}>
      {children}
    </OracleContext.Provider>
  );
}

export const useOracle = () => useContext(OracleContext);
