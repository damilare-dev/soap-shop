import { useState, ChangeEvent } from 'react';
import { OwnerSettingsProps } from '../../types';
import { uid, today, fmt } from '../../lib/utils';
import { hashPin } from '../../lib/crypto';
import Alert from '../Alert';

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
  const [repWarehouse, setRepWarehouse] = useState<'OWD' | 'JLY'>('OWD');
  const [prod, setProd] = useState({ name: "", costPrice: "", sellPrice: "", expectedQty: "", schedule: "monthly" });
  const [settingsMsg, setSettingsMsg] = useState<string>("");
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null);
  // FIX 3: Track which rep is being confirmed for deletion
  const [removeRepConfirmId, setRemoveRepConfirmId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [manageFilter, setManageFilter] = useState<'ALL' | 'OWD' | 'JLY'>('ALL');
  const [prodPage, setProdPage] = useState(0);
  const PROD_PAGE_SIZE = 15;
  // Bug 2 fix: local state for discount input to avoid save-on-every-keystroke
  const [discountInput, setDiscountInput] = useState(String(data.maxDiscountPct ?? 15));

  const sp = (k: keyof typeof prod, v: string) => setProd(f => ({ ...f, [k]: v }));

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
    // FIX 4: Prevent duplicate rep names
    if (data.reps.some(r => r.name.toLowerCase() === repName.trim().toLowerCase())) {
      return setRepErr("A rep with that name already exists.");
    }
    const hashedPin = await hashPin(repPin);
    const newRep = { id: uid(), name: repName.trim(), pin: hashedPin, warehouse: repWarehouse };
    let nd = { ...data, reps: [...data.reps, newRep] };
    nd = addAudit(nd, "REP_ADDED", `New rep: ${repName.trim()} (${repWarehouse})`, "OWNER");
    save(nd);
    setRepName(""); setRepPin(""); setRepPin2(""); setRepErr(""); setRepWarehouse('OWD');
    setSettingsMsg("✓ Rep added");
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  const toggleRepLock = (id: string) => {
    const rep = data.reps.find(r => r.id === id);
    if (!rep) return;
    const isLocking = rep.lockedDate !== today();
    const newReps = data.reps.map(r => r.id === id ? { ...r, lockedDate: isLocking ? today() : null } : r);
    let nd = { ...data, reps: newReps };
    nd = addAudit(nd, isLocking ? "REP_LOCKED" : "REP_UNLOCKED", `${isLocking ? 'Locked' : 'Unlocked'} rep: ${rep.name}`, "OWNER");
    save(nd);
    setSettingsMsg(isLocking ? `🔒 ${rep.name} locked for today` : `🔓 ${rep.name} unlocked`);
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  // FIX 3: Two-step confirmation before removing rep
  const removeRep = (id: string) => {
    const rep = data.reps.find(r => r.id === id);
    const newReps = data.reps.filter(r => r.id !== id);
    let nd = { ...data, reps: newReps };
    nd = addAudit(nd, "REP_REMOVED", `Rep removed: ${rep?.name}`, "OWNER");
    save(nd);
    setRemoveRepConfirmId(null);
    setSettingsMsg("✓ Rep removed");
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  const addProduct = () => {
    if (!prod.name.trim()) return setSettingsMsg("⚠ Fill product name.");
    if (!prod.costPrice || !prod.sellPrice) return setSettingsMsg("⚠ Fill name, cost, sell price.");
    if (+prod.costPrice < 0 || +prod.sellPrice <= 0) return setSettingsMsg("⚠ Sell price must be greater than 0.");
    // FIX 5: Warn if sell price is lower than cost price
    if (+prod.sellPrice < +prod.costPrice) return setSettingsMsg("⚠ Sell price is lower than cost price — check values.");

    const newProd = { id: uid(), ...prod, costPrice: +prod.costPrice, sellPrice: +prod.sellPrice, expectedQty: +prod.expectedQty || 500, stock: 0 };
    let nd = { ...data, products: [...data.products, newProd] };
    nd = addAudit(nd, "PRODUCT_ADDED", `New product: ${prod.name}`, "OWNER");
    save(nd);
    setProd({ name: "", costPrice: "", sellPrice: "", expectedQty: "", schedule: "monthly" });
    setSettingsMsg("✓ Product added");
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  const delProduct = (id: string) => {
    // Mark as deleting BEFORE anything else — blocks the onBlur save from firing
    setDeletingProductId(id);
    const p = data.products.find(x => x.id === id);
    const hasSales = data.sales.some(s => s.productId === id && !s.voided);
    if (hasSales) {
      setSettingsMsg(`⚠ Cannot delete "${p?.name}" — it has active sales records. Void all its sales first.`);
      setTimeout(() => setSettingsMsg(""), 4000);
      setDeletingProductId(null);
      return;
    }
    const newProducts = data.products.filter(x => x.id !== id);
    let nd = { ...data, products: newProducts };
    nd = addAudit(nd, "PRODUCT_REMOVED", `Product removed: ${p?.name}`, "OWNER");
    save(nd);
    setDeletingProductId(null);
    setSettingsMsg("✓ Product removed");
    setTimeout(() => setSettingsMsg(""), 2000);
  };

  const updateSellPrice = (id: string, price: string) => {
    // Skip save if this product is mid-deletion — onBlur fires before onClick in the browser
    if (deletingProductId === id) return;
    if (!price || isNaN(+price) || +price <= 0) return;
    const p = data.products.find(x => x.id === id);
    if (!p || +price === p.sellPrice) return;
    let nd = { ...data, products: data.products.map(x => x.id === id ? { ...x, sellPrice: +price } : x) };
    nd = addAudit(nd, 'PRICE_CHANGE', `${p.name} sell price: ${fmt(p.sellPrice)} → ${fmt(+price)}`, 'OWNER');
    save(nd);
    setSettingsMsg(`✓ Sell price updated: ${p.name}`);
    setTimeout(() => setSettingsMsg(''), 2500);
  };

  const updateCostPrice = (id: string, price: string) => {
    if (deletingProductId === id) return;
    if (!price || isNaN(+price) || +price < 0) return;
    const p = data.products.find(x => x.id === id);
    if (!p || +price === p.costPrice) return;
    let nd = { ...data, products: data.products.map(x => x.id === id ? { ...x, costPrice: +price } : x) };
    nd = addAudit(nd, 'COST_CHANGE', `${p.name} cost price: ${fmt(p.costPrice)} → ${fmt(+price)}`, 'OWNER');
    save(nd);
    setSettingsMsg(`✓ Cost price updated: ${p.name}`);
    setTimeout(() => setSettingsMsg(''), 2500);
  };

  const updateStock = (id: string, newStock: string) => {
    if (deletingProductId === id) return;
    if (newStock === '' || isNaN(+newStock) || +newStock < 0) return;
    const p = data.products.find(x => x.id === id);
    if (!p) return;
    const oldStock = p.stock;
    const updated = +newStock;
    if (updated === oldStock) return;
    let nd = { ...data, products: data.products.map(x => x.id === id ? { ...x, stock: updated } : x) };
    nd = addAudit(nd, 'STOCK_ADJUST', `${p.name} stock adjusted: ${oldStock} → ${updated}`, 'OWNER');
    save(nd);
    setSettingsMsg(`✓ Stock updated: ${p.name} → ${updated}`);
    setTimeout(() => setSettingsMsg(''), 3000);
  };

  const exportData = () => {
    const json = JSON.stringify(data, null, 2);
    downloadJson(`soapstock-backup-${today()}.json`, json);
    setSettingsMsg("✓ Backup downloaded");
    setTimeout(() => setSettingsMsg(""), 3000);
  };

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
        !Array.isArray(imported.deliveries) ||
        !Array.isArray(imported.auditLog)
      ) {
        throw new Error("Invalid backup file");
      }
      // Keep current owner PIN — never allow a backup to override credentials
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
        {data.reps.length === 0 && <div className="empty" style={{ padding: "12px 0" }}>No reps added yet.</div>}
        {data.reps.map(r => {
          const isLocked = r.lockedDate === today();
          return (
            <div key={r.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="row">
                <span style={{ fontWeight: 600 }}>
                  👤 {r.name} <span className={`badge ${r.warehouse === 'JLY' ? 'badge-blue' : 'badge-green'}`}>{r.warehouse ?? 'OWD'}</span>
                  {isLocked && <span className="badge badge-red">🔒 Locked</span>}
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button className={`btn btn-sm ${isLocked ? 'btn-ghost' : 'btn-red'}`} onClick={() => toggleRepLock(r.id)}>
                    {isLocked ? '🔓 Unlock' : '🔒 Lock for Today'}
                  </button>
                  {removeRepConfirmId === r.id ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "var(--red)", fontWeight: 600 }}>Remove?</span>
                      <button className="btn btn-red btn-sm" onClick={() => removeRep(r.id)}>Yes</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setRemoveRepConfirmId(null)}>No</button>
                    </div>
                  ) : (
                    <button className="btn btn-red btn-sm" onClick={() => setRemoveRepConfirmId(r.id)}>Remove</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="divider" />

        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Add New Rep</div>
        <div className="fg">
          <label className="flabel">Rep Name</label>
          <input className="finput" value={repName} onChange={e => { setRepName(e.target.value); setRepErr(""); }} placeholder="E.g., John" />
        </div>
        <div className="fg">
          <label className="flabel">Warehouse</label>
          <select className="fselect" value={repWarehouse} onChange={e => setRepWarehouse(e.target.value as 'OWD' | 'JLY')}>
            <option value="OWD">Owode (OWD)</option>
            <option value="JLY">Jaleyemi (JLY)</option>
          </select>
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
        <div className="card-title">🛁 Manage Products <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)' }}>({data.products.length})</span></div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
          Tap any number to change it, then tap ✓ to save. Each product shows its profit per box automatically.
        </div>

        {/* Warehouse filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          {(['ALL', 'OWD', 'JLY'] as const).map(w => (
            <button
              key={w}
              className={`btn btn-sm ${manageFilter === w ? 'btn-green' : 'btn-ghost'}`}
              onClick={() => { setManageFilter(w); setProdPage(0); }}
            >{w === 'ALL' ? 'All' : w}</button>
          ))}
        </div>

        <input
          className="finput"
          style={{ marginBottom: 14 }}
          placeholder="🔍 Search products…"
          value={productSearch}
          onChange={e => { setProductSearch(e.target.value); setProdPage(0); }}
        />

        {(() => {
          const filtered = data.products
            .filter(p => manageFilter === 'ALL' || p.name.includes(`(${manageFilter})`))
            .filter(p => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()));
          const totalPages = Math.ceil(filtered.length / PROD_PAGE_SIZE);
          const paged = filtered.slice(prodPage * PROD_PAGE_SIZE, (prodPage + 1) * PROD_PAGE_SIZE);
          return (
            <>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                {totalPages > 1 && ` · Page ${prodPage + 1} of ${totalPages}`}
              </div>
              {paged.map(p => {
                const tag = p.name.includes('(JLY)') ? 'JLY' : 'OWD';
                const cleanName = p.name.replace(/ \((OWD|JLY)\)$/, '');
                const profit = p.sellPrice - p.costPrice;
                return (
                  <div key={p.id} style={{ background: '#faf8f4', borderRadius: 12, padding: 14, marginBottom: 10, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{cleanName}</span>
                        <span className={`badge ${tag === 'JLY' ? 'badge-blue' : 'badge-green'}`}>{tag}</span>
                      </div>
                      <button className="btn btn-red btn-sm" onClick={() => delProduct(p.id)} title="Delete product" style={{ flexShrink: 0 }}>🗑</button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 10px', borderRadius: 8, marginBottom: 10, background: profit > 0 ? 'var(--green-light)' : 'var(--red-light)' }}>
                      <span style={{ color: 'var(--muted)' }}>Profit per box</span>
                      <strong style={{ fontFamily: 'var(--font-m)', color: profit > 0 ? 'var(--green2)' : 'var(--red)' }}>{fmt(profit)}</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Cost ₦', id: `cost-${p.id}`, val: p.costPrice, fn: updateCostPrice, step: undefined },
                        { label: 'Sell ₦', id: `price-${p.id}`, val: p.sellPrice, fn: updateSellPrice, step: undefined },
                        { label: 'Stock', id: `stock-${p.id}`, val: p.stock, fn: updateStock, step: '0.5' },
                      ].map(f => (
                        <div key={f.id}>
                          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4, fontWeight: 600 }}>{f.label}</div>
                          <div style={{ display: 'flex', gap: 3 }}>
                            <input
                              className="finput"
                              type="number"
                              inputMode="decimal"
                              style={{ padding: '8px 8px', fontSize: 13, fontFamily: 'var(--font-m)', minWidth: 0 }}
                              defaultValue={f.val}
                              id={f.id}
                              step={f.step}
                              min="0"
                            />
                            <button
                              className="btn btn-green btn-sm"
                              style={{ padding: '8px 9px', flexShrink: 0 }}
                              onClick={() => {
                                const input = document.getElementById(f.id) as HTMLInputElement;
                                f.fn(p.id, input?.value ?? '');
                              }}
                              title="Save"
                            >✓</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 6, gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setProdPage(p => Math.max(0, p - 1))} disabled={prodPage === 0}>← Prev</button>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>Page {prodPage + 1} of {totalPages}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setProdPage(p => Math.min(totalPages - 1, p + 1))} disabled={prodPage === totalPages - 1}>Next →</button>
                </div>
              )}
            </>
          );
        })()}

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
            value={discountInput}
            onChange={e => setDiscountInput(e.target.value)}
            onBlur={() => {
              const v = Math.min(100, Math.max(0, +discountInput || 0));
              setDiscountInput(String(v));
              if (v !== (data.maxDiscountPct ?? 15)) save({ ...data, maxDiscountPct: v });
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
                save({ ownerPin: data.ownerPin, maxDiscountPct: data.maxDiscountPct ?? 15, reps: data.reps, products: data.products.map(p => ({ ...p, stock: 0 })), deliveries: [], sales: [], auditLog: [] });
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
