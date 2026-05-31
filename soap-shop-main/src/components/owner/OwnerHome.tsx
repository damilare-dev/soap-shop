import { useState } from 'react';
import { today, fmt } from '../../lib/utils';
import { StateData } from '../../types';
import Alert from '../Alert';

export default function OwnerHome({ data }: { data: StateData }) {
  const { products, sales } = data;
  const mKey = today().slice(0, 7);
  const activeSales = sales.filter(s => !s.voided);
  const tSales = activeSales.filter(s => s.date === today());
  const mSales = activeSales.filter(s => s.date.startsWith(mKey));

  const tExpected = tSales.reduce((s, t) => s + t.expectedCash, 0);
  const tCollected = tSales.reduce((s, t) => s + t.cashCollected, 0);
  const tDisc = tCollected - tExpected;

  const mRevenue = mSales.reduce((s, t) => s + t.cashCollected, 0);
  const mCOGS = mSales.reduce((s, t) => {
    const p = products.find(x => x.id === t.productId);
    return s + t.qty * (p?.costPrice || 0);
  }, 0);
  const mProfit = mRevenue - mCOGS;
  const mUnits = mSales.reduce((s, t) => s + t.qty, 0);

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const lowStock = products.filter(p => p.stock < 5);

  const [dismissedLow, setDismissedLow] = useState(false);
  const [dismissedShort, setDismissedShort] = useState(false);

  return (
    <>
      <div className="section-title">Dashboard</div>

      {lowStock.length > 0 && !dismissedLow && (
        <Alert
          message={`Low stock: ${lowStock.map(p => p.name).join(', ')}`}
          type="gold"
          onDismiss={() => setDismissedLow(true)}
        />
      )}
      {tDisc < -500 && !dismissedShort && (
        <Alert
          message={`Cash shortage today: ${fmt(Math.abs(tDisc))}`}
          type="red"
          onDismiss={() => setDismissedShort(true)}
        />
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-accent" style={{ background: "var(--green)" }} />
          <div className="stat-label">Total Stock</div>
          <div className="stat-value" style={{ color: "var(--green)" }}>{totalStock.toLocaleString()}</div>
          <div className="stat-sub">{products.length} products</div>
        </div>

        <div className="stat-card">
          <div className="stat-accent" style={{ background: "var(--gold)" }} />
          <div className="stat-label">Today Sold</div>
          <div className="stat-value" style={{ color: "var(--gold)" }}>{tSales.reduce((s,t)=>s+t.qty,0).toLocaleString()}</div>
          <div className="stat-sub">{fmt(tCollected)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-accent" style={{ background: "var(--blue)" }} />
          <div className="stat-label">Month Revenue</div>
          <div className="stat-value" style={{ color: "var(--blue)", fontSize: 15 }}>{fmt(mRevenue)}</div>
          <div className="stat-sub">{mUnits.toLocaleString()} boxes</div>
        </div>

        <div className="stat-card">
          <div className="stat-accent" style={{ background: mProfit >= 0 ? "var(--green3)" : "var(--red)" }} />
          <div className="stat-label">Month Profit</div>
          <div className="stat-value" style={{ color: mProfit >= 0 ? "var(--green2)" : "var(--red)", fontSize: 15 }}>{fmt(mProfit)}</div>
          <div className="stat-sub">{mProfit >= 0 ? "▲ Profit" : "▼ Loss"}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">💰 Today's Cash Accountability</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
          {[["Expected", fmt(tExpected), "var(--green2)"], ["Collected", fmt(tCollected), "var(--text)"], ["Diff", fmt(tDisc), tDisc < 0 ? "var(--red)" : "var(--green)"]]
            .map(([l, v, c]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{l}</div>
                <div style={{ fontFamily: "var(--font-m)", fontSize: 14, color: c, fontWeight: 600, marginTop: 6 }}>{v}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="card">
        <div className="card-title">📦 Stock Levels</div>
        {products.map(p => {
          const pct = Math.min(100, (p.stock / (p.expectedQty || 500)) * 100);
          return (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontFamily: "var(--font-m)", color: "var(--text)", fontWeight: 600 }}>{p.stock.toLocaleString()}</span>
              </div>
              <div className="bar-bg"><div className="bar-fill" style={{ width: pct + "%", background: "var(--green3)" }}></div></div>
            </div>
          );
        })}
      </div>
    </>
  );
}