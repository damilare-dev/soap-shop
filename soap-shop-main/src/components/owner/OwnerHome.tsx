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

  const owdProducts = products.filter(p => p.name.includes('(OWD)'));
  const jlyProducts = products.filter(p => p.name.includes('(JLY)'));
  const owdSales = mSales.filter(s => owdProducts.some(p => p.id === s.productId));
  const jlySales = mSales.filter(s => jlyProducts.some(p => p.id === s.productId));

  const calcStats = (salesSet: typeof mSales, prods: typeof products) => {
    const rev = salesSet.reduce((s, t) => s + t.cashCollected, 0);
    const cogs = salesSet.reduce((s, t) => {
      const p = prods.find(x => x.id === t.productId);
      return s + t.qty * (p?.costPrice || 0);
    }, 0);
    const units = salesSet.reduce((s, t) => s + t.qty, 0);
    return { rev, cogs, profit: rev - cogs, units };
  };

  const total = calcStats(mSales, products);
  const owd = calcStats(owdSales, owdProducts);
  const jly = calcStats(jlySales, jlyProducts);

  const [lowThreshold, setLowThreshold] = useState(5);
  const lowStock = products.filter(p => p.stock <= lowThreshold);
  const [dismissedLow, setDismissedLow] = useState(false);
  const [dismissedShort, setDismissedShort] = useState(false);
  const [stockSearch, setStockSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<'ALL' | 'OWD' | 'JLY'>('ALL');
  const [stockPage, setStockPage] = useState(0);
  const STOCK_PAGE_SIZE = 20;

  const visibleProducts = products
    .filter(p => warehouseFilter === 'ALL' || p.name.includes(`(${warehouseFilter})`))
    .filter(p => !stockSearch || p.name.toLowerCase().includes(stockSearch.toLowerCase()))
    .sort((a, b) => a.stock - b.stock);
  const stockTotalPages = Math.ceil(visibleProducts.length / STOCK_PAGE_SIZE);
  const pagedProducts = visibleProducts.slice(stockPage * STOCK_PAGE_SIZE, (stockPage + 1) * STOCK_PAGE_SIZE);

  return (
    <>
      <div className="section-title">Dashboard</div>

      {lowStock.length > 0 && !dismissedLow && (
        <Alert
          message={`Low stock (≤${lowThreshold}): ${lowStock.map(p => p.name).join(', ')}`}
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
        {[
          ["Total Stock", products.reduce((s,p)=>s+p.stock,0).toLocaleString(), "var(--green)", `${products.length} products`],
          ["Today Sold", tSales.reduce((s,t)=>s+t.qty,0).toLocaleString(), "var(--gold)", fmt(tCollected)],
          ["Month Revenue", fmt(total.rev), "var(--blue)", `${total.units.toLocaleString()} boxes`],
          ["Month Profit", fmt(total.profit), total.profit >= 0 ? "var(--green2)" : "var(--red)", total.profit >= 0 ? "▲ Profit" : "▼ Loss"],
        ].map(([l,v,c,sub]) => (
          <div key={l} className="stat-card">
            <div className="stat-accent" style={{ background: c }} />
            <div className="stat-label">{l}</div>
            <div className="stat-value" style={{ color: c, fontSize: 15 }}>{v}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-title">💰 Today's Cash Accountability</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
          {[["Expected", fmt(tExpected), "var(--green2)"], ["Collected", fmt(tCollected), "var(--text)"], ["Diff", fmt(tDisc), tDisc < 0 ? "var(--red)" : "var(--green)"]].map(([l,v,c]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{l}</div>
              <div style={{ fontFamily: "var(--font-m)", fontSize: 14, color: c, fontWeight: 600, marginTop: 6 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {(owdSales.length > 0 || jlySales.length > 0) && (
        <div className="card">
          <div className="card-title">🏭 This Month by Warehouse</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Owode (OWD)', stats: owd, color: 'var(--green2)' },
              { label: 'Jaleyemi (JLY)', stats: jly, color: 'var(--blue)' },
            ].map(({ label, stats, color }) => (
              <div key={label} style={{ background: 'var(--bg)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color, marginBottom: 8 }}>{label}</div>
                {[['Units', stats.units.toLocaleString()], ['Revenue', fmt(stats.rev)], ['Profit', fmt(stats.profit)]].map(([l, v]) => (
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

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
          <div className="card-title" style={{ margin: 0 }}>📦 Stock Levels <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>({visibleProducts.length}/{products.length})</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Low ≤</span>
            <input
              type="number"
              min={0}
              value={lowThreshold}
              onChange={e => setLowThreshold(Math.max(0, +e.target.value))}
              style={{ width: 52, padding: '4px 8px', borderRadius: 6, border: '1.5px solid var(--border)', fontFamily: 'var(--font-m)', fontSize: 13, background: '#f9f7f3' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['ALL', 'OWD', 'JLY'] as const).map(w => (
            <button key={w} className={`btn btn-sm ${warehouseFilter === w ? 'btn-green' : 'btn-ghost'}`} onClick={() => { setWarehouseFilter(w); setStockPage(0); }}>
              {w === 'ALL' ? 'All' : w}
            </button>
          ))}
        </div>
        <input
          className="finput"
          style={{ marginBottom: 12 }}
          placeholder="Search products…"
          value={stockSearch}
          onChange={e => { setStockSearch(e.target.value); setStockPage(0); }}
        />
        {visibleProducts.length === 0 && <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>No products match.</div>}
        {pagedProducts.map(p => {
          const pct = Math.min(100, (p.stock / (p.expectedQty || 500)) * 100);
          const isLow = p.stock <= lowThreshold;
          return (
            <div key={p.id} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
                <span style={{ fontWeight: 600, color: isLow ? 'var(--red)' : 'var(--text)' }}>{p.name}{isLow ? ' ⚠' : ''}</span>
                <span style={{ fontFamily: 'var(--font-m)', color: isLow ? 'var(--red)' : 'var(--text)', fontWeight: 600 }}>{p.stock.toLocaleString()}</span>
              </div>
              <div className="bar-bg"><div className="bar-fill" style={{ width: pct + '%', background: isLow ? 'var(--red)' : 'var(--green3)' }}></div></div>
            </div>
          );
        })}
        {stockTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setStockPage(p => Math.max(0, p - 1))} disabled={stockPage === 0}>← Prev</button>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Page {stockPage + 1} of {stockTotalPages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setStockPage(p => Math.min(stockTotalPages - 1, p + 1))} disabled={stockPage === stockTotalPages - 1}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
