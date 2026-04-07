import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { LoginStaff } from './pages/LoginStaff';
import { CustomerHome } from './pages/CustomerHome';
// import { CustomerProfile } from './pages/CustomerProfile';
// import { CustomerReviews } from './pages/CustomerReviews';
// import { TableReservation } from './pages/TableReservation';
import { PRHome } from './pages/PRHome';
import { HeadPRHome } from './pages/HeadPRHome';
import { PhotographerHome } from './pages/PhotographerHome';
import { WaiterHome } from './pages/WaiterHome';
// import { CambusaHome } from './pages/CambusaHome';
// import { ARHostess } from './pages/ARHostess';
// import { BodyguardHome } from './pages/BodyguardHome';
// import { ImageGirlHome } from './pages/ImageGirlHome';
// import { DirectionAnalytics } from './pages/DirectionAnalytics';
// import { AdminHome } from './pages/AdminHome';
// import { AdminManagement } from './pages/AdminManagement';
// import { AdminCustomers } from './pages/AdminCustomers';
import { AuthProvider } from './context/AuthContext';
import { NoxProvider } from './context/NoxContext';
import { NotificationProvider } from './context/NotificationContext';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <NoxProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/staff" element={<LoginStaff />} />
                <Route path="/customer" element={<CustomerHome />} />
                {/* <Route path="/profile" element={<CustomerProfile />} /> */}
                {/* <Route path="/reviews" element={<CustomerReviews />} /> */}
                {/* <Route path="/booking" element={<TableReservation />} /> */}
                <Route path="/pr" element={<PRHome />} />
                <Route path="/capo-pr" element={<HeadPRHome />} />
                <Route path="/ph" element={<PhotographerHome />} />
                <Route path="/waiter" element={<WaiterHome />} />
                {/* <Route path="/cambusa" element={<CambusaHome />} /> */}
                {/* <Route path="/hostess" element={<ARHostess />} /> */}
                {/* <Route path="/bodyguard" element={<BodyguardHome />} /> */}
                {/* <Route path="/ar-girls" element={<ImageGirlHome />} /> */}
                {/* <Route path="/direzione" element={<DirectionAnalytics />} /> */}
                {/* <Route path="/admin" element={<AdminHome />} /> */}
                {/* <Route path="/admin/management" element={<AdminManagement />} /> */}
                {/* <Route path="/admin/customers" element={<AdminCustomers />} /> */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </NoxProvider>
    </React.StrictMode>
  );
}
