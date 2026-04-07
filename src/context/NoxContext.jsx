import React, { createContext, useContext, useState, useEffect } from 'react';

console.log('BOOT-60: REAL NoxContext.jsx EXECUTING');

const NoxContext = createContext(null);

export const NoxProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        console.log('BOOT-61: Nox Config Fetch Attempt...');
        const response = await fetch('/nox-config.json');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('BOOT-62: Nox Config LOADED:', data.clubName);
        setConfig(data);
        
        // Apply Branding Logic
        const root = document.documentElement;
        if (data.themeColor) root.style.setProperty('--accent-color', data.themeColor);
        
      } catch (error) {
        console.error('BOOT-ERROR: Nox Config Load Failed:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  return (
    <NoxContext.Provider value={{ config, loading }}>
      {children}
    </NoxContext.Provider>
  );
};

export const useNox = () => useContext(NoxContext);
