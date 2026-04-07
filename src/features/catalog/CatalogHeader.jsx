import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CatalogHeader({ user }) {
  const navigate = useNavigate();

  const handleBack = () => {
    const role = user?.role?.toLowerCase();
    if(role === 'pr') navigate('/pr');
    else if(role === 'capo_pr' || role === 'admin') navigate('/capo-pr');
    else navigate('/customer');
  };

  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
      <button onClick={handleBack} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
        <ArrowLeft size={24} />
      </button>
      <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Ordina al Tavolo</h2>
    </header>
  );
}
