import { useState } from 'react';
import { OwnerDeliveryProps } from '../../types';
import { uid, today, fmtD, fmt } from '../../lib/utils';
import Alert from '../Alert';

export default function OwnerDelivery({ data, save, addAudit }: OwnerDeliveryProps) {
  const blank = { productId: data.products[0]?.id || "", qty: "", costPerBox: "", date: today(), supplier: "" };
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState("");
  const [prodSearch, setProdSearch] = useState("");
  const [dPage, setDPage] = useState(0);
  const D_PAGE_SIZE = 15;

  const filteredProducts = prodSearch
    ? data.products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()))
    : data.products;

  const set = (k: keyof typeof blank, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.productId || !form.qty || !form.costPerBox) return setMsg("⚠ Please fill all fields.");
    if (+form.qty <= 0) return setMsg("⚠ Quantity must be greater than 0.");
    if (+form.costPerBox < 0) return setMsg("⚠ Cost per box cannot be negative.");

    const prod = data.products.find(p => p.id === form.productId);
    const delivery = { id: uid(), ...form, qty: +form.qty, costPerBox: +form.costPerBox, productName: prod?.name ?? '' };
    const newProducts = data.products.map(p =>
      p.id === form.productId ? { ...p, stock: p.stock + +form.qty } : p
    );

    let nd = { ...data, deliveries: [...data.deliveries, delivery], products: newProducts };
    nd = addAudit(nd, "DELIVERY", `${+form.qty} × ${prod?.name} from ${form.supplier || "supplier"}`, "OWNER");
    save(nd);
    setForm(blank);
    setMsg("");
  };

  const allHistory = [...data.deliveries].sort((a, b) => b.date.localeCompare(a.date));
  const dTotalPages = Math.ceil(allHistory.length / D_PAGE_SIZE);
  const history = allHistory.slice(dPage * D_PAGE_SIZE, (dPage + 1) * D_PAGE_SIZE);

  return (
    <>
      <div className="section-title">Record Delivery</div>

      <div className="card">
        <div className="card-title">📍 New Stock Arrived</div>

        <div className="fg">
          <label className="flabel">Product *</label>
          <input
            className="finput"
            style={{ marginBottom: 6 }}
            placeholder="Type to filter products…"
            value={prodSearch}
            onChange={e => setProdSearch(e.target.value)}
          />
          <select className="fselect" value={form.productId} onChange={e => set("productId", e.target.value)}>
            {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
          </select>
        </div>

        <div className="two-col">
          <div className="fg">
            <label className="flabel">Quantity (boxes) *</label>
            <input className="finput" type="number" step="0.5" min="0" value={form.qty} onChange={e => set("qty", e.target.value)} placeholder="e.g. 12.5" />
          </div>
          <div className="fg">
            <label className="flabel">Cost per Box (₦) *</label>
            <input className="finput" type="number" value={form.costPerBox} onChange={e => set("costPerBox", e.target.value)} />
          </div>
        </div>

        <div className="two-col">
          <div className="fg">
            <label className="flabel">Date</label>
            <input className="finput" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </div>
          <div className="fg">
            <label className="flabel">Supplier</label>
            <input className="finput" value={form.supplier} onChange={e => set("supplier", e.target.value)} placeholder="Supplier name" />
          </div>
        </div>

        {form.qty && form.costPerBox && (
          <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
            Cost: <strong style={{ color: "var(--green)" }}>{fmt(+form.qty * +form.costPerBox)}</strong>
          </div>
        )}

        {msg && <Alert message={msg} type={msg.startsWith("✓") ? "green" : "red"} onDismiss={() => setMsg("")} />}

        <button className="btn btn-green btn-full" onClick={submit}>✓ Record Delivery</button>
      </div>

      <div className="card">
        <div className="card-title">📋 Delivery History {allHistory.length > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>({allHistory.length} total)</span>}</div>
        {history.length === 0 && <div className="empty">No deliveries recorded yet.</div>}
        {history.map(d => {
          const prod = data.products.find(p => p.id === d.productId);
          const displayName = prod?.name || d.productName || '—';
          return (
            <div key={d.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</span>
                <span style={{ fontFamily: "var(--font-m)", color: "var(--blue)", fontSize: 13 }}>{d.qty} boxes</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {fmtD(d.date)} · {fmt(d.costPerBox)}/box · Total: <strong>{fmt(d.qty * d.costPerBox)}</strong>
              </div>
            </div>
          );
        })}
        {dTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setDPage(p => Math.max(0, p - 1))} disabled={dPage === 0}>← Prev</button>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Page {dPage + 1} of {dTotalPages}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setDPage(p => Math.min(dTotalPages - 1, p + 1))} disabled={dPage === dTotalPages - 1}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}
