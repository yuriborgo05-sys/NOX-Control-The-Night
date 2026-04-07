import React from 'react';
import { noxTables, dancefloorTables, consoleTables, priveTables, VENUE_ZONES, getZoneById } from '../data/noxData';

/**
 * VenueTableMap — Complete real venue layout for NOX - Control The Night
 * 
 * Includes:
 *  - Dance Floor tables (original layout)
 *  - Console VIP tables (original layout)
 *  - Privé tables (real venue disposition: DJ/Lateral/Bar/Entrances)
 *
 * Props:
 *   selectedTableId  — currently selected table ID (string)
 *   onSelectTable    — callback(tableId) when a table is tapped
 *   tableStatuses    — Map<tableId, { status, occupant, pr, spend, activity }> (optional)
 *   mode             — 'booking' | 'staff' | 'heatmap'
 *   compact          — if true, renders smaller
 *   showDancefloor   — if false, hides dancefloor section (default: true)
 */
export function TableMap({ 
  selectedTableId, 
  onSelectTable, 
  tableStatuses = {}, 
  mode = 'booking', 
  compact = false,
  showDancefloor = true 
}) {

  const getStatus = (id) => tableStatuses[String(id)] || { status: 'free' };

  const statusColors = {
    free:     'rgba(255,255,255,0.06)',
    reserved: 'rgba(245,158,11,0.2)',
    occupied: 'rgba(16,185,129,0.2)',
    vip:      'rgba(168,85,247,0.25)',
  };

  const statusBorders = {
    free:     'rgba(255,255,255,0.12)',
    reserved: '#f59e0b',
    occupied: '#10b981',
    vip:      '#a855f7',
  };

  const activityGlow = (level) => {
    if (!level || level <= 0) return 'none';
    const i = Math.min(level, 5);
    return `0 0 ${i * 6}px rgba(255,${200 - i * 30},0,${0.2 + i * 0.1})`;
  };

  // ─── Shared table renderer ────────────────────────────
  const renderBtn = (table, shape = 'rounded') => {
    const s = getStatus(table.id);
    const isSel = String(selectedTableId) === String(table.id);
    const zone = getZoneById(table.zone);
    const zColor = zone?.color || '#666';
    const sz = compact ? 44 : 52;

    return (
      <button
        key={table.id}
        onClick={() => onSelectTable && onSelectTable(table.id)}
        aria-label={`${table.name}`}
        style={{
          width: sz, height: sz,
          borderRadius: shape === 'circle' ? '50%' : '12px',
          background: isSel
            ? `linear-gradient(135deg, ${zColor}, ${zColor}88)`
            : statusColors[s.status] || statusColors.free,
          border: isSel ? '3px solid white' : `2px solid ${statusBorders[s.status] || statusBorders.free}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          transform: isSel ? 'scale(1.12)' : 'scale(1)',
          boxShadow: isSel
            ? `0 0 18px ${zColor}88, 0 4px 12px rgba(0,0,0,0.4)`
            : mode === 'heatmap' ? activityGlow(s.activity) : '0 2px 6px rgba(0,0,0,0.3)',
          padding: 0, flexShrink: 0, position: 'relative',
        }}
      >
        <span style={{
          fontSize: compact ? '0.65rem' : '0.75rem',
          fontWeight: 800, color: isSel ? '#fff' : '#cbd5e1',
          lineHeight: 1,
        }}>
          {table.label}
        </span>

        {s.status !== 'free' && (
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: statusBorders[s.status],
            marginTop: 2,
            boxShadow: `0 0 5px ${statusBorders[s.status]}`,
          }} />
        )}

        {(mode === 'staff' || mode === 'heatmap') && s.spend > 0 && (
          <span style={{
            position: 'absolute', bottom: -6,
            fontSize: '0.5rem', fontWeight: 800, color: '#10b981',
            background: 'rgba(0,0,0,0.9)', padding: '1px 4px',
            borderRadius: 5, border: '1px solid rgba(16,185,129,0.3)',
            whiteSpace: 'nowrap',
          }}>€{s.spend}</span>
        )}

        {mode === 'staff' && s.occupant && (
          <span style={{
            position: 'absolute', top: -7,
            fontSize: '0.45rem', fontWeight: 700, color: 'white',
            background: 'rgba(0,0,0,0.9)', padding: '1px 4px',
            borderRadius: 3, maxWidth: 60,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.occupant}</span>
        )}
      </button>
    );
  };

  const sectionTag = (text, emoji) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
      padding: '0.25rem 0.7rem',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {emoji} {text}
      </span>
    </div>
  );

  const find = (id) => noxTables.find(t => t.id === String(id));

  return (
    <div style={{
      width: '100%', maxWidth: '420px', margin: '0 auto',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(30,20,50,0.9) 0%, rgba(8,8,12,0.98) 70%)',
      borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)',
      padding: compact ? '0.6rem' : '0.8rem',
      display: 'flex', flexDirection: 'column', gap: compact ? '0.7rem' : '1rem',
      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4)',
      overflow: 'hidden',
    }}>

      {/* ═══════════════════════════════════════════════════════
       *  SECTION 1: DANCE FLOOR (Originale)
       * ═══════════════════════════════════════════════════════ */}
      {showDancefloor && (
        <>
          {sectionTag('Dance Floor Area', '💃')}

          {/* Dancefloor columns (original layout) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '20%', padding: '0 8%' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
              {[110, 109, 108, 107, 106].map(id => renderBtn(find(id), 'circle'))}
            </div>
            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
              {[105, 104, 103, 102, 101].map(id => renderBtn(find(id), 'circle'))}
            </div>
          </div>

          {/* Console VIP */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[14, 13].map(id => renderBtn(find(id), 'circle'))}
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.04)', padding: '0.6rem 0.8rem',
              borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>CONSOLE</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {[12, 11].map(id => renderBtn(find(id), 'circle'))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px dashed rgba(168,85,247,0.2)', margin: '0.2rem 0' }} />
        </>
      )}

      {/* ═══════════════════════════════════════════════════════
       *  SECTION 2: PRIVÉ (Disposizione Reale)
       * ═══════════════════════════════════════════════════════ */}

      {/* ZONA A: Dietro DJ — 4 tavoli orizzontali */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        {sectionTag('DJ Booth', '🎧')}
        <div style={{
          width: '75%', padding: '0.35rem 0',
          background: 'linear-gradient(90deg, rgba(168,85,247,0.12), rgba(168,85,247,0.04), rgba(168,85,247,0.12))',
          borderRadius: '10px', border: '1px solid rgba(168,85,247,0.18)', textAlign: 'center',
        }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#a855f7', letterSpacing: '0.15em' }}>CONSOLLE DJ</span>
        </div>
        <div style={{ display: 'flex', gap: compact ? '0.4rem' : '0.6rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['P1','P2','P3','P4'].map(id => renderBtn(find(id)))}
        </div>
      </div>

      {/* ZONA B: Laterali — 2sx + PISTA + 2dx */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          {['P5','P6'].map(id => renderBtn(find(id)))}
        </div>

        <div style={{
          flex: 1, minHeight: compact ? '70px' : '85px', margin: '0 0.2rem',
          background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
          borderRadius: '14px', border: '1px dashed rgba(59,130,246,0.12)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
        }}>
          <span style={{ fontSize: '1rem' }}>💃</span>
          <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'rgba(59,130,246,0.4)', letterSpacing: '0.15em' }}>PISTA</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          {['P7','P8'].map(id => renderBtn(find(id)))}
        </div>
      </div>

      {/* ZONA C: Fronte Bar — 2 tavoli */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: compact ? '1.2rem' : '2rem', justifyContent: 'center' }}>
          {['P9','P10'].map(id => renderBtn(find(id)))}
        </div>
        <div style={{
          width: '65%', padding: '0.4rem 0',
          background: 'linear-gradient(90deg, rgba(245,158,11,0.08), rgba(245,158,11,0.03), rgba(245,158,11,0.08))',
          borderRadius: '10px', border: '1px solid rgba(245,158,11,0.12)', textAlign: 'center',
        }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.15em' }}>🍸 BAR 🍸</span>
        </div>
      </div>

      {/* ZONA D: Angoli Entrate — 2 tavoli */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {renderBtn(find('P11'))}
          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>🚪 ENTRATA 1</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          {renderBtn(find('P12'))}
          <span style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>🚪 ENTRATA 2</span>
        </div>
      </div>

      {/* ═══ LEGENDA ═══ */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem',
        paddingTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        {[
          { label: 'Libero',    bg: 'rgba(255,255,255,0.1)', bd: 'rgba(255,255,255,0.2)' },
          { label: 'Prenotato', bg: 'rgba(245,158,11,0.25)', bd: '#f59e0b' },
          { label: 'Occupato',  bg: 'rgba(16,185,129,0.25)', bd: '#10b981' },
          { label: 'VIP',       bg: 'rgba(168,85,247,0.25)', bd: '#a855f7' },
        ].map(i => (
          <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: i.bg, border: `1.5px solid ${i.bd}`, display: 'inline-block' }} />
            <span style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{i.label}</span>
          </div>
        ))}
      </div>

      {mode === 'heatmap' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.4rem', paddingTop: 3 }}>
          {VENUE_ZONES.filter(z => !['dancefloor','console'].includes(z.id)).map(z => (
            <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: z.color, display: 'inline-block', boxShadow: `0 0 5px ${z.color}` }} />
              <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{z.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
