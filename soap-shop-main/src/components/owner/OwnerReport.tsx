import { useState } from 'react';
import { today, fmt } from '../../lib/utils';
import { OwnerReportProps, Product } from '../../types';

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

  // ---------- Current inventory value (read-only snapshot of stock on hand — not tied to the month picker) ----------
  const warehouseOf = (p: Product): 'OWD' | 'JLY' | 'OTHER' =>
    p.name.includes('(OWD)') ? 'OWD' : p.name.includes('(JLY)') ? 'JLY' : 'OTHER';

  const invByWarehouse = (tag: 'OWD' | 'JLY' | 'OTHER') => {
    const items = products.filter(p => warehouseOf(p) === tag);
    const cost = items.reduce((s, p) => s + p.stock * p.costPrice, 0);
    const potentialRevenue = items.reduce((s, p) => s + p.stock * p.sellPrice, 0);
    const units = items.reduce((s, p) => s + p.stock, 0);
    return { items, cost, potentialRevenue, potentialProfit: potentialRevenue - cost, units };
  };

  const owdInv = invByWarehouse('OWD');
  const jlyInv = invByWarehouse('JLY');
  const otherInv = invByWarehouse('OTHER');
  const totalInv = {
    cost: owdInv.cost + jlyInv.cost + otherInv.cost,
    potentialRevenue: owdInv.potentialRevenue + jlyInv.potentialRevenue + otherInv.potentialRevenue,
    potentialProfit: owdInv.potentialProfit + jlyInv.potentialProfit + otherInv.potentialProfit,
    units: owdInv.units + jlyInv.units + otherInv.units,
  };

  const invEntries: Array<{ label: string; tag: 'OWD' | 'JLY' | 'OTHER'; stats: ReturnType<typeof invByWarehouse>; color: string }> = [
    { label: 'Owode (OWD)', tag: 'OWD', stats: owdInv, color: 'var(--green2)' },
    { label: 'Jaleyemi (JLY)', tag: 'JLY', stats: jlyInv, color: 'var(--blue)' },
  ];
  if (otherInv.items.length > 0) {
    invEntries.push({ label: 'Unassigned', tag: 'OTHER', stats: otherInv, color: 'var(--gold)' });
  }

  const [showInvDetail, setShowInvDetail] = useState<'OWD' | 'JLY' | 'OTHER' | null>(null);
  const [invSearch, setInvSearch] = useState('');
  const [invDetailPage, setInvDetailPage] = useState(0);
  const INV_DETAIL_PAGE_SIZE = 15;
  const detailItems = showInvDetail === 'OWD' ? owdInv.items : showInvDetail === 'JLY' ? jlyInv.items : showInvDetail === 'OTHER' ? otherInv.items : [];

  const filteredDetailItems = detailItems
    .filter(p => !invSearch || p.name.toLowerCase().includes(invSearch.toLowerCase()))
    .sort((a, b) => (b.stock * b.costPrice) - (a.stock * a.costPrice));

  const pagedDetailItems = filteredDetailItems.slice(invDetailPage * INV_DETAIL_PAGE_SIZE, (invDetailPage + 1) * INV_DETAIL_PAGE_SIZE);
  const invDetailTotalPages = Math.ceil(filteredDetailItems.length / INV_DETAIL_PAGE_SIZE);

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

      {/* Current Inventory Value — snapshot of stock on hand right now, independent of the month picker */}
      <div className="card">
        <div className="card-title">📦 Current Inventory Value</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
          What's on the shelves right now — cost to replace it, and profit if every unit sold at current listed prices. Tap a warehouse for the per-product breakdown.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`, gap: 12 }}>
          {invEntries.map(({ label, stats, color, tag }) => (
            <div
              key={label}
              style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, cursor: 'pointer', border: showInvDetail === tag ? '1.5px solid var(--green2)' : '1.5px solid transparent' }}
              onClick={() => { setShowInvDetail(showInvDetail === tag ? null : tag); setInvSearch(''); setInvDetailPage(0); }}
            >
              <div style={{ fontWeight: 700, fontSize: 13, color, marginBottom: 10 }}>{label} {showInvDetail === tag ? '▲' : '▼'}</div>
              {[
                ['In stock', stats.units.toLocaleString() + ' boxes'],
                ['Total cost', fmt(stats.cost)],
                ['Profit if all sold', fmt(stats.potentialProfit)],
              ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>{l}</span>
                  <strong style={{ fontFamily: 'var(--font-m)', color: l === 'Profit if all sold' ? (stats.potentialProfit >= 0 ? 'var(--green2)' : 'var(--red)') : 'var(--text)' }}>{v}</strong>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0', marginTop: 12, borderTop: '2px solid var(--border)' }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Total — all warehouses</span>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: 13, textAlign: 'right' }}>
            Cost <strong>{fmt(totalInv.cost)}</strong> · Profit if all sold{' '}
            <strong style={{ color: totalInv.potentialProfit >= 0 ? 'var(--green2)' : 'var(--red)' }}>{fmt(totalInv.potentialProfit)}</strong>
          </span>
        </div>

        {showInvDetail && (
          <div style={{ marginTop: 16 }}>
            <input
              className="finput"
              style={{ marginBottom: 10 }}
              placeholder="Search products…"
              value={invSearch}
              onChange={e => { setInvSearch(e.target.value); setInvDetailPage(0); }}
            />
            {filteredDetailItems.length === 0 && <div className="empty">No products match.</div>}

            {filteredDetailItems.length > 0 && (
              <>
                {/* Header row — same column widths as the data rows below, so everything lines up */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 1fr 1fr', gap: 6, padding: '0 0 8px', borderBottom: '1.5px solid var(--border)' }}>
                  {['Product', 'Stock', 'Cost', 'Profit'].map((h, i) => (
                    <div key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: i === 0 ? 'left' : 'right' }}>{h}</div>
                  ))}
                </div>

                {pagedDetailItems.map(p => {
                  const cost = p.stock * p.costPrice;
                  const profit = p.stock * (p.sellPrice - p.costPrice);
                  return (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 1fr 1fr', gap: 6, padding: '9px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, textAlign: 'right' }}>{p.stock.toLocaleString()}</div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, textAlign: 'right' }}>{fmt(cost)}</div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, fontWeight: 700, textAlign: 'right', color: profit >= 0 ? 'var(--green2)' : 'var(--red)' }}>{fmt(profit)}</div>
                    </div>
                  );
                })}

                {invDetailTotalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setInvDetailPage(p => Math.max(0, p - 1))} disabled={invDetailPage === 0}>← Prev</button>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Page {invDetailPage + 1} of {invDetailTotalPages}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setInvDetailPage(p => Math.min(invDetailTotalPages - 1, p + 1))} disabled={invDetailPage === invDetailTotalPages - 1}>Next →</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* OWD vs JLY split (sales performance this month) */}
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
