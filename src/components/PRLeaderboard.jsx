import React, { useState } from 'react';

const LEADERBOARD_CATEGORIES = [
  { key: 'fatturato', label: 'Fatturato', unit: '€', decimals: 0 },
  { key: 'bottiglie', label: 'Bottiglie', unit: '', decimals: 0 },
  { key: 'tavoli', label: 'Tavoli', unit: '', decimals: 0 },
  { key: 'persone', label: 'Persone', unit: '', decimals: 0 },
  { key: 'mediaSpesa', label: 'Media €/Tav', unit: '€', decimals: 0 },
];

export function PRLeaderboard({ data }) {
  const [catIdx, setCatIdx] = useState(0);
  const cat = LEADERBOARD_CATEGORIES[catIdx];
  const sorted = [...data].sort((a, b) => b[cat.key] - a[cat.key]);
  const topValue = sorted[0]?.[cat.key] || 1;
  const medals = ['🥇', '🥈', '🥉'];
  const medalColors = ['var(--gold)', 'rgba(200,200,220,0.8)', '#cd7f32'];

  const fmt = (v) => {
    const int = Math.round(v);
    return cat.unit === '€' ? `€ ${int.toLocaleString('it-IT')}` : `${int} ${cat.unit}`.trim();
  };

  if(!data || data.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          Nessun dato PR disponibile.
        </div>
      );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.75rem', scrollbarWidth: 'none', marginBottom: '0.5rem' }}>
        {LEADERBOARD_CATEGORIES.map((c, i) => (
          <button key={c.key} onClick={() => setCatIdx(i)} style={{
            padding: '0.35rem 0.75rem', borderRadius: '16px', whiteSpace: 'nowrap', fontSize: '0.78rem',
            fontWeight: 600, cursor: 'pointer', border: 'none', flexShrink: 0, transition: 'all 0.2s',
            background: catIdx === i ? 'var(--accent-color)' : 'rgba(255,255,255,0.06)',
            color: catIdx === i ? 'white' : 'var(--text-secondary)',
            boxShadow: catIdx === i ? '0 2px 10px var(--accent-glow)' : 'none',
          }}>{c.label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {sorted.map((pr, idx) => {
          const value = pr[cat.key];
          const barWidth = Math.round((value / topValue) * 100);
          const gap = idx === 0 ? null : sorted[0][cat.key] - value;
          const isFirst = idx === 0;

          return (
            <div key={pr.name} style={{
              background: isFirst ? 'linear-gradient(135deg, var(--gold-bg), rgba(18,18,30,0.9))' : 'var(--bg-card)',
              border: `1px solid ${isFirst ? 'rgba(255,208,96,0.3)' : 'var(--border-card)'}`,
              borderRadius: '14px',
              padding: '0.85rem 1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', textAlign: 'center', flexShrink: 0 }}>
                  {idx < 3 ? <span style={{ fontSize: '1.4rem' }}>{medals[idx]}</span> : <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>#{idx+1}</span>}
                </div>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isFirst ? 'var(--gold)' : 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{pr.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.92rem' }}>{pr.name}</strong>
                    <strong style={{ color: isFirst ? 'var(--gold)' : medalColors[idx] || 'var(--accent-light)' }}>{fmt(value)}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '6px', height: '6px', marginTop: '0.5rem' }}>
                    <div style={{ width: `${barWidth}%`, height: '100%', background: isFirst ? 'var(--gold)' : 'var(--accent-color)', borderRadius: '6px' }}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
