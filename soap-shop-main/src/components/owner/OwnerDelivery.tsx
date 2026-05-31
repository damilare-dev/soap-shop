import { useState } from 'react';
import { OwnerDeliveryProps } from '../../types';
import { uid, today, fmtD, fmt } from '../../lib/utils';
import Alert from '../Alert';

export default function OwnerDelivery({ data, save, addAudit }: OwnerDeliveryProps) {
  const blank = { productId: data.products[0]?.id || "", qty: "", costPerBox: "", date: today(), supplier: "" };
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState("");

  const set = (k: keyof typeof blank, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.productId || !form.qty || !form.costPerBox) return setMsg("⚠ Please fill all fields.");

    const delivery = { id: uid(), ...form, qty: +form.qty, costPerBox: +form.costPerBox };
    const newProducts = data.products.map(p =>
      p.id === form.productId ? { ...p, stock: p.stock + +form.qty } : p
    );

    let nd = { ...data, deliveries: [...data.deliveries, delivery], products: newProducts };
    const prod = data.products.find(p => p.id === form.productId);
    nd = addAudit(nd, "DELIVERY", `${+form.qty} × ${prod?.name} from ${form.supplier || "supplier"}`, "OWNER");
    save(nd);
    setForm(blank);
    setMsg("");
  };

  const history = [...data.deliveries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  return (
    <>
      <div className="section-title">Record Delivery</div>

      <div className="card">
        <div className="card-title">📍 New Stock Arrived</div>

        <div className="fg">
          <label className="flabel">Product *</label>
          <select className="fselect" value={form.productId} onChange={e => set("productId", e.target.value)}>
            {data.products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
          </select>
        </div>

        <div className="two-col">
          <div className="fg">
            <label className="flabel">Quantity (boxes) *</label>
            <input className="finput" type="number" value={form.qty} onChange={e => set("qty", e.target.value)} />
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
        <div className="card-title">📋 Delivery History</div>
        {history.length === 0 && <div className="empty">No deliveries recorded yet.</div>}
        {history.map(d => {
          const prod = data.products.find(p => p.id === d.productId);
          return (
            <div key={d.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{prod?.name || "—"}</span>
                <span style={{ fontFamily: "var(--font-m)", color: "var(--blue)", fontSize: 13 }}>{d.qty} boxes</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {fmtD(d.date)} · {fmt(d.costPerBox)}/box · Total: <strong>{fmt(d.qty * d.costPerBox)}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
