import { today, fmt } from '../../lib/utils';
import { OwnerReportProps } from '../../types';

export default function OwnerReport({ data }: OwnerReportProps) {
  const { products, sales } = data;
  const mKey = today().slice(0, 7);
  const activeSales = sales.filter(s => !s.voided);
  const mSales = activeSales.filter(s => s.date.startsWith(mKey));

  const revenue = mSales.reduce((s, t) => s + t.cashCollected, 0);
  const expected = mSales.reduce((s, t) => s + t.expectedCash, 0);
  const cogs = mSales.reduce((s, t) => {
    const p = products.find(x => x.id === t.productId);
    return s + t.qty * (p?.costPrice || 0);
  }, 0);

  const profit = revenue - cogs;
  const disc = revenue - expected;
  const unitsSold = mSales.reduce((s, t) => s + t.qty, 0);

  return (
    <>
      <div className="section-title">Monthly Report · {mKey}</div>

      {disc < -2000 && <div className="alert alert-red">Significant cash shortage: {fmt(Math.abs(disc))}</div>}

      <div className="stat-grid">
        {[["Boxes Sold", unitsSold.toLocaleString(), "var(--green)"], ["Revenue", fmt(revenue), "var(--blue)"], ["COGS", fmt(cogs), "var(--muted)"], ["Profit", fmt(profit), profit >= 0 ? "var(--green)" : "var(--red)"]]
          .map(([l, v, c]) => (
            <div key={l} className="stat-card">
              <div className="stat-accent" style={{ background: c }} />
              <div className="stat-label">{l}</div>
              <div className="stat-value" style={{ color: c, fontSize: 16 }}>{v}</div>
            </div>
          ))}
      </div>

      <div className="card">
        <div className="card-title">🛁 Per Product Breakdown</div>
        {products.map(p => {
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

      <div className="card">
        <div className="card-title">📋 P&L Summary</div>
        {[["Expected Revenue", fmt(expected), "var(--muted)"], ["Cash Collected", fmt(revenue), "var(--text)"], ["COGS", fmt(cogs), "var(--red)"], ["Gross Profit", fmt(profit), profit >= 0 ? "var(--green)" : "var(--red)"]]
          .map(([l, v, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>{l}</span>
              <span style={{ fontFamily: "var(--font-m)", fontWeight: 700, color: c }}>{v}</span>
            </div>
          ))}
      </div>
    </>
  );
}
