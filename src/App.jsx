import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useNox } from './context/NoxContext';
import { NoxHeartbeat } from './components/NoxHeartbeat';

// Pages
import { LandingDemo } from './pages/LandingDemo';
import { Login } from './pages/Login';
import { LoginStaff } from './pages/LoginStaff';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';

// Customer Pages
import { CustomerHome } from './pages/CustomerHome';
import { CustomerProfile } from './pages/CustomerProfile';
import { BottleCatalog } from './pages/BottleCatalog';
import { TableReservation } from './pages/TableReservation';
import { ExitPass } from './pages/ExitPass';
import { CustomerReviews } from './pages/CustomerReviews';

// Staff Pages
import { AdminHome } from './pages/AdminHome';
import { AdminManagement } from './pages/AdminManagement';
import { AdminCustomers } from './pages/AdminCustomers';
import { PRHome } from './pages/PRHome';
import { HeadPRHome } from './pages/HeadPRHome';
import { WaiterHome } from './pages/WaiterHome';
import { CambusaHome } from './pages/CambusaHome';
import { BodyguardHome } from './pages/BodyguardHome';
import { ARHostess } from './pages/ARHostess';
import { PhotographerHome } from './pages/PhotographerHome';
import { ImageGirlHome } from './pages/ImageGirlHome';
import { DirectionAnalytics } from './pages/DirectionAnalytics';
import { AnalyticsDisabled } from './pages/AnalyticsDisabled';

console.log('BOOT-FULL: App.jsx (INTEGRATED) EXECUTING');

/**
 * App - Full Routing Orchestrator.
 * Modificato per includere Vetrina di Vendita e Realtime Sync globale.
 */
export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { config, loading: noxLoading } = useNox();

  if (noxLoading || authLoading) {
    return (
      <div style={{
        background: 'black', 
        color: '#7c3aed', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'monospace'
      }}>
        <div style={{ 
          width: '40px', height: '40px', border: '4px solid #7c3aed', 
          borderTopColor: 'transparent', borderRadius: '50%', 
          animation: 'spin 1s linear infinite', marginBottom: '1rem' 
        }}></div>
        <h2>BOOT-INTEGRITY: CARICAMENTO...</h2>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <NoxHeartbeat />
      <Routes>
        {/* Vetrina Principale (Demo & Vendita) */}
        <Route path="/" element={<LandingDemo />} />

        {/* Auth Routes Formali */}
        <Route path="/client-auth" element={<Login />} />
        <Route path="/staff-auth" element={<LoginStaff />} />
        
        {/* Helper Auth Routes (vecchi compatibilitá) */}
        <Route path="/login" element={<Navigate to="/client-auth" replace />} />
        <Route path="/staff" element={<Navigate to="/staff-auth" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer Routes */}
        <Route path="/customer" element={<CustomerHome />} />
        <Route path="/profile" element={<CustomerProfile />} />
        <Route path="/catalog" element={<BottleCatalog />} />
        <Route path="/reserve" element={<TableReservation />} />
        <Route path="/exit-pass" element={<ExitPass />} />
        <Route path="/reviews" element={<CustomerReviews />} />

        {/* Admin/Staff Routes */}
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/management" element={<AdminManagement />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/analytics" element={<DirectionAnalytics />} />
        <Route path="/analytics/disabled" element={<AnalyticsDisabled />} />

        {/* Role-Specific Staff Routes */}
        <Route path="/pr" element={<PRHome />} />
        <Route path="/capo-pr" element={<HeadPRHome />} />
        <Route path="/waiter" element={<WaiterHome />} />
        <Route path="/cambusa" element={<CambusaHome />} />
        <Route path="/bodyguard" element={<BodyguardHome />} />
        <Route path="/ar-hostess" element={<ARHostess />} />
        <Route path="/photographer" element={<PhotographerHome />} />
        <Route path="/immagine" element={<ImageGirlHome />} />

        {/* Navigation Fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
