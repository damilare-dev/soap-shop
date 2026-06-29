import { useState } from 'react';
import { StateData } from '../../types';
import { today } from '../../lib/utils';

const ACTION_LABELS: Record<string, { icon: string; color: string }> = {
  SALE:         { icon: '🛒', color: '#1a3d2b' },
  SALE_EDIT:    { icon: '✏️',  color: '#b5860d' },
  VOID:         { icon: '🚫', color: '#c0392b' },
  DELIVERY:     { icon: '📦', color: '#1a5c8a' },
  PIN_CHANGE:   { icon: '🔐', color: '#6b3fa0' },
  REP_ADDED:    { icon: '👤', color: '#1a3d2b' },
  REP_REMOVED:  { icon: '👤', color: '#c0392b' },
  REP_LOCKED:   { icon: '🔒', color: '#c0392b' },
  REP_UNLOCKED: { icon: '🔓', color: '#1a3d2b' },
  PRODUCT_ADDED:   { icon: '🛁', color: '#1a3d2b' },
  PRODUCT_REMOVED: { icon: '🛁', color: '#c0392b' },
  STOCK_ADJUST:    { icon: '🔢', color: '#1a5c8a' },
};

export default function OwnerAudit({ data }: { data: StateData }) {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterActor, setFilterActor] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const allLogs = [...data.auditLog].sort((a, b) => b.ts.localeCompare(a.ts));

  // Voided sales whose void happened today, grouped by the rep who made the original sale.
  // Owner-made Quick/Detailed sales already carry repName "Owner", so they fall into their own row.
  const voidsByRep = new Map<string, number>();
  data.sales
    .filter(s => s.voided && s.voidedAt?.slice(0, 10) === today())
    .forEach(s => voidsByRep.set(s.repName, (voidsByRep.get(s.repName) ?? 0) + 1));
  const voidRows = Array.from(voidsByRep.entries()).sort((a, b) => b[1] - a[1]);

  const actors = ['ALL', ...Array.from(new Set(allLogs.map(e => e.actor)))];
  const actionTypes = ['ALL', ...Array.from(new Set(allLogs.map(e => e.action)))];

  const filtered = allLogs.filter(e => {
    const matchAction = filterAction === 'ALL' || e.action === filterAction;
    const matchActor = filterActor === 'ALL' || e.actor === filterActor;
    const matchSearch = !search.trim() || e.detail.toLowerCase().includes(search.toLowerCase()) || e.actor.toLowerCase().includes(search.toLowerCase());
    return matchAction && matchActor && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const resetPage = () => setPage(0);

  if (allLogs.length === 0) return (
    <>
      <div className="section-title">Audit Log</div>
      <div className="card">
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: 14 }}>
          No actions recorded yet. All sales, edits, voids and deliveries will appear here.
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="section-title">Audit Log</div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Events', value: allLogs.length },
          { label: 'Edits', value: allLogs.filter(e => e.action === 'SALE_EDIT').length },
          { label: 'Voids', value: allLogs.filter(e => e.action === 'VOID').length },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--white)', borderRadius: 12, padding: '14px 12px', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">🚫 Voids Today by Rep</div>
        {voidRows.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '12px 0', fontSize: 13 }}>No voided sales today.</div>
        ) : (
          voidRows.map(([repName, count]) => (
            <div key={repName} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{repName}</span>
              <span style={{
                fontFamily: 'var(--font-m)', fontWeight: 700, fontSize: 15,
                color: count >= 3 ? 'var(--red)' : 'var(--green2)',
              }}>{count} void{count === 1 ? '' : 's'}</span>
            </div>
          ))
        )}
      </div>

      <div className="card">
        <div className="card-title">🔍 Filter & Search</div>

        <div className="fg">
          <input
            className="finput"
            placeholder="Search by rep name or action detail…"
            value={search}
            onChange={e => { setSearch(e.target.value); resetPage(); }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="fg" style={{ flex: 1, minWidth: 120 }}>
            <label className="flabel">Action Type</label>
            <select className="fselect" value={filterAction} onChange={e => { setFilterAction(e.target.value); resetPage(); }}>
              {actionTypes.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div className="fg" style={{ flex: 1, minWidth: 120 }}>
            <label className="flabel">Actor</label>
            <select className="fselect" value={filterActor} onChange={e => { setFilterActor(e.target.value); resetPage(); }}>
              {actors.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{filtered.length} event{filtered.length !== 1 ? 's' : ''} found</div>
      </div>

      <div className="card">
        <div className="card-title">📋 Events ({filtered.length})</div>

        {paginated.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '20px 0', fontSize: 14 }}>No matching events.</div>
        )}

        {paginated.map(e => {
          const meta = ACTION_LABELS[e.action] ?? { icon: '•', color: 'var(--muted)' };
          const ts = new Date(e.ts);
          const isEdit = e.action === 'SALE_EDIT';
          const isVoid = e.action === 'VOID';

          return (
            <div key={e.id} style={{
              padding: '12px 0',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              background: isEdit ? 'rgba(181,134,13,.04)' : isVoid ? 'rgba(192,57,43,.03)' : 'transparent',
              borderRadius: 4,
            }}>
              <div style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{meta.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: meta.color }}>
                    {e.action.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                    {ts.toLocaleDateString('en', { day: 'numeric', month: 'short' })} · {ts.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', margin: '3px 0', lineHeight: 1.5 }}>{e.detail}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>by {e.actor}</div>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ flex: '0 0 auto' }}>← Prev</button>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`btn btn-sm ${i === page ? 'btn-green' : 'btn-ghost'}`} onClick={() => setPage(i)} style={{ minWidth: 32, padding: '6px 10px' }}>{i + 1}</button>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{ flex: '0 0 auto' }}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
