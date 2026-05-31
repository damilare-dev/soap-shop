import { useState, ChangeEvent } from 'react';
import { OwnerSettingsProps, Product } from '../../types';
import { uid, today, fmt } from '../../lib/utils';
import { hashPin } from '../../lib/crypto';
import Alert from '../Alert';

const DEFAULT_PRODUCTS: Product[] = [
  { id: "p1", name: "Sunlight Soap", schedule: "biweekly", expectedQty: 2200, costPrice: 850, sellPrice: 1200, stock: 500 },
  { id: "p2", name: "Premier Soap", schedule: "monthly", expectedQty: 700, costPrice: 600, sellPrice: 950, stock: 300 },
  { id: "p3", name: "Key Soap", schedule: "monthly", expectedQty: 650, costPrice: 700, sellPrice: 1100, stock: 250 },
  { id: "p4", name: "Morning Fresh", schedule: "monthly", expectedQty: 650, costPrice: 650, sellPrice: 1050, stock: 280 },
];

function downloadJson(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function OwnerSettings({ data, save, addAudit }: OwnerSettingsProps) {
  const [newPin, setNewPin] = useState<string>("");
  const [confirmPin, setConfirmPin] = useState<string>("");
  const [pinMsg, setPinMsg] = useState<string>("");
  const [repName, setRepName] = useState<string>("");
  const [repPin, setRepPin] = useState<string>("");
  const [repPin2, setRepPin2] = useState<string>("");
  const [repErr, setRepErr] = useState<string>("");
  const [prod, setProd] = useState({ name: "", costPrice: "", sellPrice: "", expectedQty: "", schedule: "monthly" });
  const [settingsMsg, setSettingsMsg] = useState<string>("");
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);

  const sp = (k: keyof typeof prod, v: string) => setProd(f => ({ ...f, [k]: v }));

  // Hash the PIN before storing — fixes plaintext PIN security issue
  const changePin = async () => {
    if (!/^\d{4}$/.test(newPin)) return setPinMsg("PIN must be exactly 4 digits.");
    if (newPin !== confirmPin) return setPinMsg("PINs don't match.");

    const hashed = await hashPin(newPin);
    let nd: any = { ...data, ownerPin: hashed };
    nd = addAudit(nd, "PIN_CHANGE", "Owner PIN changed", "OWNER");
    save(nd);
    setNewPin(""); setConfirmPin("");
    setPinMsg("✓ PIN changed successfully!");
    setTimeout(() => setPinMsg(""), 3000);
  };

  const addRep = async () => {
    if (!repName.trim()) return setRepErr("Enter rep name.");
    if (!/^\d{4}$/.test(repPin)) return setRepErr("PIN must be 4 digits.");
    if (repPin !== repPin2) return setRepErr("PINs don't match.");

    const hashedPin = await hashPin(repPin);
    const newRep = { id: uid(), name: repName.trim(), pin: hashedPin };
    let nd = { ...data, reps: [...data.reps, newRep] };
    nd = addAudit(nd, "REP_ADDED", `New rep: ${repName.trim()}`, "OWNER");
    save(nd);
    setRepName(""); setRepPin(""); setRepPin2(""); setRepErr("");
    setSettingsMsg("✓ Rep added");
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  const removeRep = (id: string) => {
    const rep = data.reps.find(r => r.id === id);
    const newReps = data.reps.filter(r => r.id !== id);
    let nd = { ...data, reps: newReps };
    nd = addAudit(nd, "REP_REMOVED", `Rep removed: ${rep?.name}`, "OWNER");
    save(nd);
    setSettingsMsg("✓ Rep removed");
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  const addProduct = () => {
    if (!prod.name || !prod.costPrice || !prod.sellPrice) return setSettingsMsg("⚠ Fill name, cost, sell price.");

    const newProd = { id: uid(), ...prod, costPrice: +prod.costPrice, sellPrice: +prod.sellPrice, expectedQty: +prod.expectedQty || 500, stock: 0 };
    let nd = { ...data, products: [...data.products, newProd] };
    nd = addAudit(nd, "PRODUCT_ADDED", `New product: ${prod.name}`, "OWNER");
    save(nd);
    setProd({ name: "", costPrice: "", sellPrice: "", expectedQty: "", schedule: "monthly" });
    setSettingsMsg("✓ Product added");
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  // Guard: block deletion if product has existing active sales
  const delProduct = (id: string) => {
    const p = data.products.find(x => x.id === id);
    const hasSales = data.sales.some(s => s.productId === id && !s.voided);
    if (hasSales) {
      setSettingsMsg(`⚠ Cannot delete "${p?.name}" — it has active sales records. Void all its sales first.`);
      setTimeout(() => setSettingsMsg(""), 4000);
      return;
    }
    const newProducts = data.products.filter(x => x.id !== id);
    let nd = { ...data, products: newProducts };
    nd = addAudit(nd, "PRODUCT_REMOVED", `Product removed: ${p?.name}`, "OWNER");
    save(nd);
    setSettingsMsg("✓ Product removed");
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  const updateSellPrice = (id: string, price: string) => {
    save({ ...data, products: data.products.map(p => p.id === id ? { ...p, sellPrice: +price } : p) });
  };

  const exportData = () => {
    const json = JSON.stringify(data, null, 2);
    downloadJson(`soapstock-backup-${today()}.json`, json);
    setSettingsMsg("✓ Backup downloaded");
    setTimeout(() => setSettingsMsg(""), 3000);
  };

  // Validate and sanitize imported backup — never replace ownerPin from file
  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text) as any;
      if (
        !imported ||
        typeof imported !== "object" ||
        !Array.isArray(imported.sales) ||
        !Array.isArray(imported.products) ||
        !Array.isArray(imported.reps) ||
        !Array.isArray(imported.deliveries)
      ) {
        throw new Error("Invalid backup file");
      }
      // Keep the current owner PIN — never allow a backup file to override access credentials
      const safeImport = { ...imported, ownerPin: data.ownerPin };
      save(safeImport);
      setSettingsMsg("✓ Data imported successfully");
    } catch {
      setSettingsMsg("⚠ Invalid backup file. Please use a SoapStock JSON backup.");
    }
    event.target.value = "";
  };

  return (
    <>
      <div className="section-title">Settings</div>

      <div className="card">
        <div className="card-title">🔐 Change Owner PIN</div>
        <div className="two-col">
          <div className="fg">
            <label className="flabel">New PIN</label>
            <input className="finput" type="password" inputMode="numeric" maxLength={4} value={newPin} onChange={e => { setNewPin(e.target.value.replace(/\D/g, "")); setPinMsg(""); }} />
          </div>
          <div className="fg">
            <label className="flabel">Confirm</label>
            <input className="finput" type="password" inputMode="numeric" maxLength={4} value={confirmPin} onChange={e => { setConfirmPin(e.target.value.replace(/\D/g, "")); setPinMsg(""); }} />
          </div>
        </div>
        {pinMsg && <Alert message={pinMsg} type={pinMsg.startsWith("✓") ? "green" : "red"} onDismiss={() => setPinMsg("")} />}
        <button className="btn btn-green" onClick={changePin}>Update PIN</button>
      </div>

      <div className="card">
        <div className="card-title">👥 Sales Reps</div>
        {data.reps.map(r => (
          <div key={r.id} className="row" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontWeight: 600 }}>👤 {r.name}</span>
            <button className="btn btn-red btn-sm" onClick={() => removeRep(r.id)}>Remove</button>
          </div>
        ))}

        <div className="divider" />

        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Add New Rep</div>
        <div className="fg">
          <label className="flabel">Rep Name</label>
          <input className="finput" value={repName} onChange={e => { setRepName(e.target.value); setRepErr(""); }} placeholder="E.g., John" />
        </div>
        <div className="two-col">
          <div className="fg">
            <label className="flabel">Rep PIN</label>
            <input className="finput" type="password" inputMode="numeric" maxLength={4} value={repPin} onChange={e => { setRepPin(e.target.value.replace(/\D/g, "")); setRepErr(""); }} />
          </div>
          <div className="fg">
            <label className="flabel">Confirm</label>
            <input className="finput" type="password" inputMode="numeric" maxLength={4} value={repPin2} onChange={e => { setRepPin2(e.target.value.replace(/\D/g, "")); setRepErr(""); }} />
          </div>
        </div>
        {repErr && <Alert message={repErr} type="red" onDismiss={() => setRepErr("")} />}
        <button className="btn btn-ghost btn-full" onClick={addRep}>+ Add Rep</button>
      </div>

      <div className="card">
        <div className="card-title">🛁 Manage Products</div>
        {data.products.map(p => (
          <div key={p.id} className="row" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Cost: {fmt(p.costPrice)} · Stock: {p.stock}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input className="finput" type="number" style={{ width: 100, padding: "6px 10px", fontSize: 13 }} value={p.sellPrice} onChange={e => updateSellPrice(p.id, e.target.value)} placeholder="Sell price" title="Sell Price" />
              <button className="btn btn-red btn-sm" onClick={() => delProduct(p.id)} title="Delete product">✕</button>
            </div>
          </div>
        ))}

        <div className="divider" />

        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Add New Product</div>
        <div className="fg">
          <label className="flabel">Product Name *</label>
          <input className="finput" value={prod.name} onChange={e => { sp("name", e.target.value); setSettingsMsg(""); }} placeholder="E.g., Sunlight Soap" />
        </div>
        <div className="two-col">
          <div className="fg">
            <label className="flabel">Cost Price (₦)</label>
            <input className="finput" type="number" value={prod.costPrice} onChange={e => sp("costPrice", e.target.value)} />
          </div>
          <div className="fg">
            <label className="flabel">Sell Price (₦)</label>
            <input className="finput" type="number" value={prod.sellPrice} onChange={e => sp("sellPrice", e.target.value)} />
          </div>
        </div>
        <div className="two-col">
          <div className="fg">
            <label className="flabel">Expected Qty</label>
            <input className="finput" type="number" value={prod.expectedQty} onChange={e => sp("expectedQty", e.target.value)} />
          </div>
          <div className="fg">
            <label className="flabel">Schedule</label>
            <select className="fselect" value={prod.schedule} onChange={e => sp("schedule", e.target.value)}>
              <option>monthly</option>
              <option>biweekly</option>
              <option>weekly</option>
            </select>
          </div>
        </div>
        {settingsMsg && <Alert message={settingsMsg} type={settingsMsg.startsWith("✓") ? "green" : "red"} onDismiss={() => setSettingsMsg("")} />}
        <button className="btn btn-green btn-full" onClick={addProduct}>+ Add Product</button>
      </div>

      <div className="card">
        <div className="card-title">🛡 Anti-Theft Controls</div>
        <div className="fg">
          <label className="flabel">Max Negotiation Discount % (default 15)</label>
          <input
            className="finput"
            type="number"
            min={0}
            max={100}
            value={data.maxDiscountPct ?? 15}
            onChange={e => {
              const v = Math.min(100, Math.max(0, +e.target.value));
              save({ ...data, maxDiscountPct: v });
            }}
          />
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            If a rep negotiates a price below this discount limit, the sale is blocked and they must contact you.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">💾 Backup & Restore</div>
        <div className="fg">
          <button className="btn btn-ghost btn-full" onClick={exportData}>Download Backup</button>
        </div>
        <div className="fg">
          <label className="flabel">Restore JSON Backup</label>
          <input className="finput" type="file" accept="application/json" onChange={importData} />
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>Use this to save a local backup file or restore if the browser data is lost.</div>
      </div>

      <div className="card" style={{ borderColor: "rgba(192,57,43,.3)" }}>
        <div className="card-title" style={{ color: "var(--red)" }}>⚠ Danger Zone</div>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>Permanently delete all sales & delivery data. Keeps settings.</p>
        {voidConfirmId === "reset" ? (
          <div style={{ background: "var(--red-light)", border: "1px solid rgba(192,57,43,.3)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--red)", marginBottom: 10 }}>⚠ Are you sure? This CANNOT be undone.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-red btn-sm" onClick={() => {
                save({ ownerPin: data.ownerPin, maxDiscountPct: data.maxDiscountPct ?? 15, reps: data.reps, products: DEFAULT_PRODUCTS.map(p => ({ ...p, stock: 0 })), deliveries: [], sales: [], auditLog: [] });
                setSettingsMsg("✓ Data reset");
                setVoidConfirmId(null);
                setTimeout(() => setSettingsMsg(""), 2000);
              }}>Yes, Reset Everything</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setVoidConfirmId(null)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-red btn-full" onClick={() => setVoidConfirmId("reset")}>Reset All Data</button>
        )}
      </div>
    </>
  );
}
