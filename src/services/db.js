import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, updateDoc, setDoc, getDoc, increment, getDocs, writeBatch, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';

// ==========================================
// 🛒 GESTIONE ORDINI (REAL TIME FIRESTORE)
// ==========================================

export const streamOrders = (cb) => {
  const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Mapper for UI
    const uiOrders = orders.map(o => ({
      ...o,
      timestamp: o.timestamp?.toMillis ? o.timestamp.toMillis() : Date.now()
    }));
    cb(uiOrders);
  }, (err) => {
    console.error("Firestore Orders Stream Error:", err);
    cb([]); // Fallback vuoto se manca autorizzazione
  });
};

export const placeOrder = async (orderData) => {
  await addDoc(collection(db, 'orders'), {
    table: orderData.tableInfo?.name || orderData.table || 'Tavolo',
    status: 'pending',
    timestamp: serverTimestamp(),
    items: orderData.items || [],
    total: orderData.total || 0,
    prAssigned: orderData.prAssigned || orderData.pr || 'Nessuno',
    pax: parseInt(orderData.tableInfo?.pax || 1),
    paxCheckedIn: 0,
    paxCheckedOut: 0,
    isEntered: false
  });

  // Aggregated Counter Sync
  await updateGlobalStats({ tableBookings: 1 });
};

export const updateOrderStatus = async (id, status) => { 
  const orderRef = doc(db, 'orders', id);
  const snap = await getDoc(orderRef);
  
  if (snap.exists() && (status === 'delivered' || status === 'paid')) {
    const prevStatus = snap.data().status;
    if (prevStatus !== 'delivered' && prevStatus !== 'paid') {
        const amount = snap.data().total || 0;
        await updateGlobalStats({ tableRevenue: amount });
    }
  }

  await updateDoc(orderRef, { status });
};

export const completeWaiterDelivery = (id) => updateOrderStatus(id, 'delivered');

export const streamWaiterOrders = (cb) => {
  const q = query(collection(db, 'orders'), orderBy('timestamp', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cb(orders.filter(o => o.status === 'ready' || o.status === 'pending_bar'));
  });
};

export const streamCambusaOrders = streamOrders;
export const streamCashOrders = streamOrders;
export const confirmCashPayment = async (id) => updateOrderStatus(id, 'paid');

// ==========================================
// 📊 ANALYTICS & EVENTI (FIRESTORE)
// ==========================================

export const logAppAccess = async (user) => {
  if (!user) return;
  const staffRoles = ['pr', 'capo_pr', 'immagine', 'cambusa', 'cameriere', 'security', 'bodyguard', 'cassa', 'admin', 'fotografo', 'direzione'];
  if (staffRoles.includes(user.role?.toLowerCase())) return;
  await addDoc(collection(db, 'analytics_accesses'), {
    userId: user.id || user.email || 'Anonimo',
    role: user.role || 'cliente',
    timestamp: serverTimestamp()
  });
};

export const recordEntry = async (type, gender) => {
  await addDoc(collection(db, 'analytics_entries'), { type, gender, timestamp: serverTimestamp() });
  
  // Aggregated Counter Sync
  const updates = { totalEntries: 1 };
  if (gender === 'U') updates.maleEntries = 1;
  if (gender === 'D') updates.femaleEntries = 1;
  await updateGlobalStats(updates);
};

export const recordIncident = async (type) => {
  await addDoc(collection(db, 'analytics_incidents'), { type, timestamp: serverTimestamp() });
};

// FIX: streamAnalytics ora chiama sempre il cb, sia che il doc esiste o no
// e anche in caso di errore di permessi — così setInitialSyncDone viene sempre chiamato.
export const streamAnalytics = (cb) => {
  const statsRef = doc(db, 'stats', 'current');
  
  return onSnapshot(statsRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      cb({
        tableRevenue: data.tableRevenue || 0,
        totalEntries: data.totalEntries || 0,
        maleEntries: data.maleEntries || 0,
        femaleEntries: data.femaleEntries || 0,
        tableBookings: Array.isArray(data.tableBookings) ? data.tableBookings : [],
        appAccesses: Array.isArray(data.appAccesses) ? data.appAccesses : [],
        incidents: Array.isArray(data.incidents) ? data.incidents : [],
        sosAlerts: data.sosAlerts || 0,
        uberCalls: data.uberCalls || 0,
        cansSoldBottles: data.cansSoldBottles || 0,
        cansSoldExtra: data.cansSoldExtra || 0,
        lastUpdate: Date.now()
      });
    } else {
      // Il documento stats/current non esiste ancora — fallback con dati vuoti.
      // Il cb viene comunque chiamato così initGlobalSync può segnare la sync come completata.
      cb({ 
        tableRevenue: 0, totalEntries: 0, maleEntries: 0, femaleEntries: 0,
        tableBookings: [], appAccesses: [], incidents: [], sosAlerts: 0, uberCalls: 0,
        cansSoldBottles: 0, cansSoldExtra: 0, lastUpdate: Date.now()
      });
    }
  }, (err) => {
    // Anche in caso di errore di permessi Firestore, non blocchiamo l'app.
    console.warn("streamAnalytics (non-fatal):", err.code);
    cb({ 
      tableRevenue: 0, totalEntries: 0, maleEntries: 0, femaleEntries: 0,
      tableBookings: [], appAccesses: [], incidents: [], sosAlerts: 0, uberCalls: 0,
      cansSoldBottles: 0, cansSoldExtra: 0, lastUpdate: Date.now()
    });
  });
};

export const updateGlobalStats = async (updates) => {
  const statsRef = doc(db, 'stats', 'current');
  const firestoreUpdates = {};
  Object.keys(updates).forEach(key => {
    firestoreUpdates[key] = increment(updates[key]);
  });
  
  try {
     await setDoc(statsRef, firestoreUpdates, { merge: true });
  } catch (err) {
     console.error("Error updating global stats:", err);
  }
};

export const syncGlobalStatsManual = async () => {
    const qOrders = query(collection(db, 'orders'));
    const qEntries = query(collection(db, 'analytics_entries'));
    
    const [orderSnap, entrySnap] = await Promise.all([getDocs(qOrders), getDocs(qEntries)]);
    
    const orders = orderSnap.docs.map(d => d.data());
    const tableRevenue = orders.reduce((sum, o) => (o.status === 'delivered' || o.status === 'paid' || o.status === 'ready') ? sum + (o.total || 0) : sum, 0);
    
    const entries = entrySnap.docs.map(d => d.data());
    const maleEntries = entries.filter(e => e.gender === 'U').length;
    const femaleEntries = entries.filter(e => e.gender === 'D').length;
    
    await setDoc(doc(db, 'stats', 'current'), {
        tableRevenue,
        tableBookings: orders.length,
        totalEntries: entries.length,
        maleEntries,
        femaleEntries,
        lastSync: serverTimestamp()
    });
};

// ==========================================
// 👥 UTENTI & PR (FIRESTORE)
// ==========================================

export const streamUsers = (cb) => {
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    cb(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  });
};

export const updateUser = async (id, data) => {
  const userRef = doc(db, 'users', id);
  await updateDoc(userRef, data);
};

export const getUserProfile = async (id) => {
  const docSnap = await getDoc(doc(db, 'users', id));
  if(docSnap.exists()) return docSnap.data();
  return null;
};

// ==========================================
// 🛠 COMPATIBILITY STUBS
// ==========================================
export const recordIceRequest = async () => {};
export const recordCansSold = async () => {};
export const recordUberCall = async () => {};

export const streamStaffMessages = (cb) => {
  const q = query(collection(db, 'staff_messages'), orderBy('timestamp', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cb(messages);
  });
};

export const sendStaffMessage = async (msgData) => {
  try {
    await addDoc(collection(db, 'staff_messages'), {
      ...msgData,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Error sending staff message:", err);
  }
};

export const streamSystemState = (cb) => {
  return onSnapshot(doc(db, 'system_config', 'current'), (snap) => {
    if (snap.exists()) cb(snap.data());
    else cb({ emergencyMode: false });
  });
};

export const updateSystemState = async (data) => {
  await setDoc(doc(db, 'system_config', 'current'), data, { merge: true });
};

export const streamReviews = (cb) => {
  const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
};

export const saveReview = async (data) => {
  await addDoc(collection(db, 'reviews'), { ...data, timestamp: serverTimestamp() });
};

export const streamPrStats = (id, cb) => {
  const q = query(collection(db, 'orders'));
  return onSnapshot(q, (snap) => {
    const orders = snap.docs.map(d => d.data());
    const prOrders = orders.filter(o => o.prId === id || (o.pr && o.pr.includes(id)));
    const revenue = prOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    cb({ revenue, bottles: prOrders.length, items: prOrders });
  });
};

export const recordSOS = async (type, metadata = {}) => {
  await addDoc(collection(db, 'emergency_alerts'), {
    type,
    ...metadata,
    status: 'active',
    timestamp: serverTimestamp()
  });
};

export const resolveEmergencyAlert = async (id) => {
  const alertRef = doc(db, 'emergency_alerts', id);
  await updateDoc(alertRef, { status: 'handled', resolvedAt: serverTimestamp() });
};

export const streamEmergencyAlerts = (cb) => {
  const q = query(collection(db, 'emergency_alerts'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cb(alerts.filter(a => a.status === 'active'));
  });
};

export const streamChat = (cb) => { cb([]); return () => {}; };

export const recordServiceCall = async (type, data = {}) => {
  try {
    await addDoc(collection(db, 'service_calls'), {
      table: data.table || 'Tavolo Ospite',
      request: type,
      status: 'pending',
      timestamp: serverTimestamp(),
      ...data
    });
  } catch (err) {
    console.error("Error recording service call:", err);
  }
};

export const streamServiceCalls = (cb) => {
  const q = query(collection(db, 'service_calls'), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const calls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    cb(calls.filter(c => c.status !== 'completed'));
  });
};

export const completeServiceCall = async (id) => {
  const callRef = doc(db, 'service_calls', id);
  await updateDoc(callRef, { status: 'completed' });
};

// 💎 GROUP CHECK-IN & EXIT PASS LOGIC
export const validateGroupEntry = async (token) => {
  try {
    const decoded = atob(token);
    const [orderId, tsStr] = decoded.split(':');
    const qrTime = parseInt(tsStr);
    const now = Date.now();

    if (now - qrTime > 60000) {
      return { success: false, msg: "QR SCADUTO / EXPIRED" };
    }

    const orderRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return { success: false, msg: "Ordine non trovato" };
    const data = snap.data();
    if (data.isEntered) return { success: false, msg: "Già entrati" };
    
    await updateDoc(orderRef, { 
      isEntered: true, 
      paxCheckedIn: data.pax || 1 
    });
    return { success: true, table: data.table, pax: data.pax };
  } catch (err) {
    return { success: false, msg: "ERRORE DECODIFICA" };
  }
};

export const validateIndividualExit = async (token) => {
  try {
    const decoded = atob(token);
    const [orderId, tsStr] = decoded.split(':');
    const qrTime = parseInt(tsStr);
    const now = Date.now();

    if (now - qrTime > 60000) {
      return { success: false, msg: "QR SCADUTO / EXPIRED" };
    }

    const orderRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return { success: false, msg: "QR NON VALIDO" };
    const data = snap.data();
    
    const currentOut = data.paxCheckedOut || 0;
    const currentIn = data.paxCheckedIn || 0;
    
    if (currentOut >= currentIn) {
      return { success: false, msg: "LIMITE USCITE RAGGIUNTO" };
    }
    
    await updateDoc(orderRef, { 
      paxCheckedOut: increment(1) 
    });
    return { success: true, table: data.table, rem: currentIn - (currentOut + 1) };
  } catch (err) {
    return { success: false, msg: "ERRORE DECODIFICA" };
  }
};

// ==========================================
// ⚙️ CONFIGURAZIONE CLUB & EVENTI (FIRESTORE)
// ==========================================

export const streamClubConfig = (cb) => {
  const configRef = doc(db, 'config', 'current_event');
  return onSnapshot(configRef, 
    (snapshot) => {
      if (snapshot.exists()) {
        cb(snapshot.data());
      } else {
        cb({ 
          eventTitle: 'NOX — Sabato Premium', 
          eventCover: 'https://images.unsplash.com/photo-1514525253361-bee0438d59ef?q=80&w=1000&auto=format&fit=crop',
          eventDate: 'Stasera, dalle 23:30'
        });
      }
    },
    (error) => {
      console.error("Firestore Config Error (Check Rules):", error);
      cb({ 
        eventTitle: 'NOX SPECIAL NIGHT', 
        eventCover: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?q=80&w=1000&auto=format&fit=crop',
        eventDate: 'SABATO'
      });
    }
  );
};

export const updateClubConfig = async (data) => {
  const configRef = doc(db, 'config', 'current_event');
  await setDoc(configRef, data, { merge: true });
};

export const archiveCurrentSession = async () => {
  const sessionId = new Date().toISOString().split('T')[0];
  const collections = ['orders', 'service_calls', 'staff_messages', 'analytics_entries', 'reviews'];
  
  const report = {
    sessionId,
    timestamp: serverTimestamp(),
    stats: {}
  };

  for (const colName of collections) {
    const snap = await getDocs(collection(db, colName));
    const batch = writeBatch(db);
    
    snap.forEach(d => {
      const archiveRef = doc(db, `archives/${sessionId}/${colName}`, d.id);
      batch.set(archiveRef, { ...d.data(), archivedAt: serverTimestamp() });
      batch.delete(d.ref);
    });
    
    await batch.commit();
  }

  await addDoc(collection(db, 'session_reports'), report);
};

export const saveReservation = async () => {};
export const triggerHelpCambusa = async () => {};
export const createUserProfile = async () => {};
export const recordTableBooking = () => {};

// 🔌 GLOBAL HEARTBEAT SYNC ENGINE
export const initGlobalSync = (store) => {
  const { setOrders, setServiceCalls, setStaffMessages, setAnalytics, setInitialSyncDone } = store;

  // 1. Orders Heartbeat
  const unsubOrders = streamOrders(setOrders);

  // 2. Service Calls Heartbeat
  const unsubCalls = streamServiceCalls(setServiceCalls);

  // 3. Staff Messages Heartbeat
  const unsubMessages = streamStaffMessages(setStaffMessages);

  // 4. Analytics Aggregator Heartbeat
  // FIX: setInitialSyncDone(true) viene chiamato sempre dal cb — anche se stats/current non esiste
  const unsubAnalytics = streamAnalytics((data) => {
     setAnalytics({
        tableRevenue: data.tableRevenue || 0,
        totalEntries: data.totalEntries || 0,
        maleEntries: data.maleEntries || 0,
        femaleEntries: data.femaleEntries || 0,
        tableBookings: Array.isArray(data.tableBookings) ? data.tableBookings : [],
        appAccesses: Array.isArray(data.appAccesses) ? data.appAccesses : [],
        incidents: Array.isArray(data.incidents) ? data.incidents : [],
        sosAlerts: data.sosAlerts || 0,
        uberCalls: data.uberCalls || 0,
        cansSoldBottles: data.cansSoldBottles || 0,
        cansSoldExtra: data.cansSoldExtra || 0,
        lastUpdate: Date.now()
     });
     // Sempre marcare la sync come completata — il badge SINCRONIZZAZIONE scomparirà
     setInitialSyncDone(true);
  });

  // 5. Emergency Heartbeat Sync
  const unsubEmergency = streamEmergencyAlerts(store.setEmergencyAlerts || (() => {}));

  return () => {
    unsubOrders();
    unsubCalls();
    unsubMessages();
    unsubAnalytics();
    unsubEmergency();
  };
};

export const validateEntryQR = async (targetId) => {
  return { name: "Ospite Demo", valid: true };
};

export const validateBottleQR = async (targetId) => {
  return { valid: true };
};

export const redeemDrinkQR = async (targetId) => {
  return { name: "Utente Demo", valid: true };
};
