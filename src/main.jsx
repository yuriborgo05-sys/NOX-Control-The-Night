import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NoxProvider } from './context/NoxContext'
import App from './App.jsx'
import './index.css'

console.log('BOOT-01: ENTRY POINT EXECUTING');
console.log('BOOT-10: APP IMPORT ATTEMPT');
console.log('BOOT-20: ROUTER WRAP ATTEMPT');
console.log('BOOT-50: REAL AUTH PROVIDER WRAP ATTEMPT');
console.log('BOOT-60: REAL NOX PROVIDER WRAP ATTEMPT');

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error("BOOT-ERROR: Root element not found!");
} else {
  console.log('BOOT-03: ROOT MOUNT ATTEMPT');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <NoxProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </NoxProvider>
    </React.StrictMode>
  );
  
  console.log('BOOT-05: RENDER COMPLETE');
}
