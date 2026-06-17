import { useState } from 'react';
import { today, fmt } from '../../lib/utils';
import { OwnerReportProps } from '../../types';

export default function OwnerReport({ data }: OwnerReportProps) {
  const { products, sales } = data;

  // Month picker — default to current month
  const currentMonth = today().slice(0, 7);
  const [mKey, setMKey] = useState(currentMonth);

  // Build list of months that have sales, plus current month
  const monthsWithSales = [...new Set(sales.map(s => s.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
  if (!monthsWithSales.includes(currentMonth)) monthsWithSales.unshift(currentMonth);

  const activeSales = sales.filter(s => !s.voided);
  const mSales = activeSales.filter(s => s.date.startsWith(mKey));

  const owdSales = mSales.filter(s => {
    const p = products.find(x => x.id === s.productId);
    return p?.name.includes('(OWD)');
  });
  const jlySales = mSales.filter(s => {
    const p = products.find(x => x.id === s.productId);
    return p?.name.includes('(JLY)');
  });

  const calcStats = (salesSet: typeof mSales) => {
    const revenue = salesSet.reduce((s, t) => s + t.cashCollected, 0);
    const expected = salesSet.reduce((s, t) => s + t.expectedCash, 0);
    const cogs = salesSet.reduce((s, t) => {
      const p = products.find(x => x.id === t.productId);
      return s + t.qty * (p?.costPrice || 0);
    }, 0);
    const units = salesSet.reduce((s, t) => s + t.qty, 0);
    return { revenue, expected, cogs, profit: revenue - cogs, disc: revenue - expected, units };
  };

  const total = calcStats(mSales);
  const owd = calcStats(owdSales);
  const jly = calcStats(jlySales);

  const soldProducts = products.filter(p => mSales.some(s => s.productId === p.id));

  return (
    <>
      <div className="section-title">Monthly Report</div>

      {/* Month Picker */}
      <div className="card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>Month</span>
          <select
            className="fselect"
            style={{ flex: 1, minWidth: 140 }}
            value={mKey}
            onChange={e => setMKey(e.target.value)}
          >
            {monthsWithSales.map(m => (
              <option key={m} value={m}>{m}{m === currentMonth ? ' (current)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {total.disc < -2000 && (
        <div className="alert alert-red">Significant cash shortage: {fmt(Math.abs(total.disc))}</div>
      )}

      {/* Overall stats */}
      <div className="stat-grid">
        {[
          ["Boxes Sold", total.units.toLocaleString(), "var(--green)"],
          ["Revenue", fmt(total.revenue), "var(--blue)"],
          ["COGS", fmt(total.cogs), "var(--muted)"],
          ["Profit", fmt(total.profit), total.profit >= 0 ? "var(--green)" : "var(--red)"],
        ].map(([l, v, c]) => (
          <div key={l} className="stat-card">
            <div className="stat-accent" style={{ background: c }} />
            <div className="stat-label">{l}</div>
            <div className="stat-value" style={{ color: c, fontSize: 16 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* OWD vs JLY split */}
      {(owdSales.length > 0 || jlySales.length > 0) && (
        <div className="card">
          <div className="card-title">🏭 Warehouse Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Owode (OWD)', stats: owd, color: 'var(--green2)' },
              { label: 'Jaleyemi (JLY)', stats: jly, color: 'var(--blue)' },
            ].map(({ label, stats, color }) => (
              <div key={label} style={{ background: 'var(--bg)', borderRadius: 10, padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 10 }}>{label}</div>
                {[
                  ['Boxes', stats.units.toLocaleString()],
                  ['Revenue', fmt(stats.revenue)],
                  ['COGS', fmt(stats.cogs)],
                  ['Profit', fmt(stats.profit)],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>{l}</span>
                    <strong style={{ fontFamily: 'var(--font-m)', color: l === 'Profit' ? (stats.profit >= 0 ? 'var(--green2)' : 'var(--red)') : 'var(--text)' }}>{v}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per product breakdown */}
      <div className="card">
        <div className="card-title">🛁 Per Product Breakdown</div>
        {mSales.length === 0 && <div className="empty">No sales recorded this month.</div>}
        {soldProducts.map(p => {
          const ps = mSales.filter(s => s.productId === p.id);
          const pRev = ps.reduce((s, t) => s + t.cashCollected, 0);
          const pCogs = ps.reduce((s, t) => s + t.qty * p.costPrice, 0);
          const pPft = pRev - pCogs;
          const pQty = ps.reduce((s, t) => s + t.qty, 0);
          return (
            <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="row" style={{ marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
                <span style={{ fontFamily: "var(--font-m)", fontSize: 13, color: pPft >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(pPft)}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {pQty} sold · Revenue {fmt(pRev)} · Profit {fmt(pPft)}
              </div>
            </div>
          );
        })}
      </div>

      {/* P&L Summary */}
      <div className="card">
        <div className="card-title">📋 P&L Summary</div>
        {[
          ["Expected Revenue", fmt(total.expected), "var(--muted)"],
          ["Cash Collected", fmt(total.revenue), "var(--text)"],
          ["COGS", fmt(total.cogs), "var(--red)"],
          ["Gross Profit", fmt(total.profit), total.profit >= 0 ? "var(--green)" : "var(--red)"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>{l}</span>
            <span style={{ fontFamily: "var(--font-m)", fontWeight: 700, color: c }}>{v}</span>
          </div>
        ))}
      </div>
    </>
  );
}
