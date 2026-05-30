import { OwnerSalesProps } from '../../types';
import { today, fmt, nowTime } from '../../lib/utils';
import Alert from '../Alert';
import { useState } from 'react';

export default function OwnerSales({ data, save, addAudit }: OwnerSalesProps) {
  const [filter, setFilter] = useState<"today" | "week" | "month">("today");
  const [showVoided, setShowVoided] = useState<boolean>(false);
  const [voidAlert, setVoidAlert] = useState<string>("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const cutoff = filter === "today" ? today()
    : filter === "week" ? new Date(Date.now() - 7*86400000).toISOString().split("T")[0]
    : today().slice(0, 7);

  const allFiltered = [...data.sales]
    .filter(s => filter === "month" ? s.date.startsWith(cutoff) : s.date >= cutoff)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const activeFiltered = allFiltered.filter(s => !s.voided);
  const voidedFiltered = allFiltered.filter(s => s.voided);

  const repMap: Record<string, { expected: number; collected: number; qty: number; count: number }> = {};
  activeFiltered.forEach(s => {
    if (!repMap[s.repName]) repMap[s.repName] = { expected: 0, collected: 0, qty: 0, count: 0 };
    repMap[s.repName].expected += s.expectedCash;
    repMap[s.repName].collected += s.cashCollected;
    repMap[s.repName].qty += s.qty;
    repMap[s.repName].count++;
  });

  const voidSale = (id: string) => {
    const s = data.sales.find(x => x.id === id);
    if (!s || s.voided) return;

    const newProducts = data.products.map(p => p.id === s.productId ? { ...p, stock: p.stock + s.qty } : p);
    const newSales = data.sales.map(x => x.id === id ? { ...x, voided: true, voidedBy: "OWNER", voidedAt: nowTime() } : x);

    let nd = { ...data, sales: newSales, products: newProducts };
    nd = addAudit(nd, "VOID", `Sale voided: ${s.qty} × ${s.productName}`, "OWNER");
    save(nd);
    setVoidAlert("✓ Sale voided and inventory restored.");
    setTimeout(() => setVoidAlert(""), 3000);
  };

  const paginatedSales = activeFiltered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(activeFiltered.length / PAGE_SIZE);

  return (
    <>
      <div className="section-title">Sales Log</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["today","Today"],["week","Last 7 Days"],["month","This Month"]].map(([v,l]) => (
          <button key={v} className={`btn ${filter === v ? "btn-green" : "btn-ghost"} btn-sm`} onClick={() => { setFilter(v as "today" | "week" | "month"); setPage(0); }}>{l}</button>
        ))}
      </div>

      {voidAlert && <Alert message={voidAlert} type="green" onDismiss={() => setVoidAlert("")} />}

      {Object.keys(repMap).length > 0 && (
        <div className="card">
          <div className="card-title">👥 Rep Accountability</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Expected vs collected cash</div>
          {(Object.entries(repMap) as Array<[string, { expected: number; collected: number; qty: number; count: number }]>).map(([name, r]) => {
            const disc = r.collected - r.expected;
            const isShort = disc < -200;
            return (
              <div key={name} className="row" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.count} sale{r.count !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--font-m)", fontSize: 13, fontWeight: 600 }}>{fmt(r.collected)}</div>
                  <span className={`badge ${isShort ? "badge-red" : "badge-green"}`}>
                    {isShort ? `⚠ Short ${fmt(Math.abs(disc))}` : "✓ OK"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <div className="card-title">📊 Transactions ({activeFiltered.length})</div>
        {activeFiltered.length === 0 && <div className="empty">No sales in this period.</div>}
        {paginatedSales.map(s => {
          const disc = s.cashCollected - s.expectedCash;
          return (
            <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {s.productName} · {s.qty} boxes
                    {s.edited && <span className="badge badge-gold">Edited</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0" }}>{s.repName} · {s.date}</div>
                  <div style={{ fontSize: 13 }}>
                    <span style={{ color: "var(--muted)" }}>Expected: </span>
                    <strong style={{ fontFamily: "var(--font-m)", color: "var(--green2)" }}>{fmt(s.expectedCash)}</strong>
                    <span style={{ marginLeft: 10, color: "var(--muted)" }}>Got: </span>
                    <strong style={{ fontFamily: "var(--font-m)" }}>{fmt(s.cashCollected)}</strong>
                    {disc < -100 && <span style={{ marginLeft: 8, color: "var(--red)", fontSize: 12 }}>⚠ Short</span>}
                    {disc > 100 && <span style={{ marginLeft: 8, color: "var(--green)", fontSize: 12 }}>+ Extra</span>}
                  </div>
                  {s.negotiated && (
                    <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 2 }}>
                      🤝 Negotiated — Standard: {fmt(s.standardPrice)}/box → Agreed: {fmt(s.negotiatedPrice ?? s.pricePerBox)}/box
                      {s.negotiationReason ? ` · "${s.negotiationReason}"` : ''}
                    </div>
                  )}
                </div>
                <button className="btn btn-red btn-sm" onClick={() => voidSale(s.id)} title="Void this sale">✕</button>
              </div>
            </div>
          );
        })}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 13 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
            <span style={{ color: 'var(--muted)' }}>Page {page + 1} of {totalPages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next →</button>
          </div>
        )}
      </div>

      {voidedFiltered.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ cursor: "pointer" }} onClick={() => setShowVoided(!showVoided)}>
            🚫 Voided Records ({voidedFiltered.length}) {showVoided ? "▲" : "▼"}
          </div>
          {showVoided && voidedFiltered.map(s => (
            <div key={s.id} className="tag-deleted" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div>{s.productName} · {s.qty} boxes · {s.repName}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Voided at {s.voidedAt}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
