import { useState } from 'react';
import { Product, RepAppProps, Sale } from '../types';
import { uid, today, nowTime, fmt } from '../lib/utils';
import Alert from './Alert';

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
 --bg:#f5f2ec;
 --white:#ffffff;
 --green:#1a3d2b;
 --green2:#2d6a4f;
 --green3:#74c69d;
 --green-light:#eaf4ee;
 --gold:#b5860d;
 --gold-light:#fdf6e3;
 --red:#c0392b;
 --red-light:#fdf0ee;
 --blue:#1a5c8a;
 --blue-light:#eaf3fb;
 --text:#1a1a1a;
 --muted:#6b6b6b;
 --border:#ddd8cf;
 --shadow:0 2px 16px rgba(0,0,0,.07);
 --shadow-lg:0 8px 32px rgba(0,0,0,.12);
 --font-h:'Fraunces',Georgia,serif;
 --font-b:'DM Sans',sans-serif;
 --font-m:'DM Mono',monospace;
 --radius:14px;
 --radius-sm:8px;
}
html,body,#root{height:100%;}
body{background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:15px;line-height:1.5;}
.page{background:var(--bg);min-height:100vh;display:flex;flex-direction:column;}
.topbar{background:var(--green);color:white;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow);}
.topbar-logo{font-family:var(--font-h);font-size:19px;font-weight:700;letter-spacing:-0.3px;}
.topbar-sub{font-size:11px;opacity:.65;margin-top:2px;}
.topbar-btn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:white;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.topbar-btn:hover{background:rgba(255,255,255,.25);}
.content{padding:24px 16px 130px;max-width:620px;margin:0 auto;width:100%;}
.card{background:var(--white);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);margin-bottom:16px;border:1px solid var(--border);}
.card-title{font-family:var(--font-h);font-size:16px;font-weight:600;color:var(--green);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.fg{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.flabel{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;}
.finput,.fselect{background:#f9f7f3;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;font-family:var(--font-b);font-size:15px;transition:all .2s;width:100%;}
.finput:focus,.fselect:focus{outline:none;border-color:var(--green);background:white;box-shadow:0 0 0 3px rgba(26,61,43,.1);}
.finput.big{font-size:28px;font-family:var(--font-m);padding:18px;text-align:center;letter-spacing:8px;font-weight:600;background:#f9f7f3;}
.btn{padding:12px 22px;border-radius:var(--radius-sm);font-family:var(--font-b);font-size:15px;font-weight:600;border:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
.btn:active{transform:scale(.97);}
.btn-green{background:var(--green);color:white;}
.btn-green:hover{background:var(--green2);transform:translateY(-2px);box-shadow:var(--shadow-lg);}
.btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--text);}
.btn-ghost:hover{border-color:var(--green);color:var(--green);background:rgba(26,61,43,.02);}
.btn-full{width:100%;}
.btn-lg{padding:15px;font-size:16px;border-radius:10px;}
.btn-sm{padding:8px 12px;font-size:12px;border-radius:6px;}
.btn:disabled{opacity:.5;cursor:not-allowed;}
.alert{padding:14px 16px;border-radius:var(--radius-sm);font-size:13.5px;display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;border:1px solid;}
.alert-red{background:var(--red-light);border-color:rgba(192,57,43,.2);color:var(--red);}
.alert-gold{background:var(--gold-light);border-color:rgba(181,134,13,.25);color:#7a5c00;}
.alert-green{background:var(--green-light);border-color:rgba(45,106,79,.2);color:var(--green2);}
.prod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;}
.prod-card{background:var(--white);border:2px solid var(--border);border-radius:var(--radius);padding:14px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.prod-card:hover{border-color:var(--green2);transform:translateY(-2px);box-shadow:var(--shadow);}
.prod-card.selected{border-color:var(--green);background:var(--green-light);}
.prod-card.disabled{opacity:.45;cursor:not-allowed;}
.prod-name{font-family:var(--font-h);font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;}
.prod-price{font-family:var(--font-m);font-size:13px;color:var(--green2);font-weight:600;}
.prod-stock{font-size:11px;color:var(--muted);margin-top:4px;}
.bar-bg{height:6px;border-radius:3px;background:#e8e3da;overflow:hidden;margin-top:6px;}
.bar-fill{height:100%;border-radius:3px;transition:width .5s ease;}
.badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px 4px 2px 0;}
.badge-green{background:var(--green-light);color:var(--green2);}
.badge-gold{background:var(--gold-light);color:var(--gold);}
.badge-blue{background:var(--blue-light);color:var(--blue);}
@media(max-width:500px){
 .prod-grid{grid-template-columns:1fr;}
 .content{padding:20px 14px 130px;}
 .card{padding:16px;}
}
`;

export default function RepApp({ data, save, rep, onLogout, addAudit }: RepAppProps) {
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState<string>("");
  const [cash, setCash] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<string>("");
  const [editCash, setEditCash] = useState<string>("");
  const [editAlert, setEditAlert] = useState<string>("");
  const [negotiate, setNegotiate] = useState(false);
  const [bargainPrice, setBargainPrice] = useState('');
  const [bargainReason, setBargainReason] = useState('');
  const [lowCashNote, setLowCashNote] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const maxDiscount = data.maxDiscountPct ?? 15;
  const activeSales = data.sales.filter(s => !s.voided);
  const todaySales = activeSales.filter(s => s.date === today() && s.repId === rep.id);
  const availableProducts = data.products.filter(p => p.stock > 0);

  const handleSelectProduct = (p: Product) => {
    setSelected(p);
    setNegotiate(false);
    setBargainPrice('');
    setBargainReason('');
    setLowCashNote('');
  };

  const handleQty = (v: string) => {
    setQty(v);
    const activePrice = negotiate && bargainPrice ? +bargainPrice : selected?.sellPrice ?? 0;
    if (selected && v) setCash(String(+v * activePrice));
    else setCash("");
  };

  const submit = () => {
    if (!selected) return setEditAlert("Please select a product first.");
    if (!qty || +qty <= 0 || !Number.isInteger(+qty)) return setEditAlert("Please enter a whole number.");
    if (+qty > selected.stock) return setEditAlert(`Only ${selected.stock} boxes available.`);
    if (!cash || isNaN(+cash)) return setEditAlert("Please enter the cash collected.");

    // FIX: cash cannot be negative
    if (+cash < 0) return setEditAlert("Cash collected cannot be negative.");

    const finalPrice = negotiate && bargainPrice ? +bargainPrice : selected.sellPrice;

    // FIX: negotiation discount cap — block if below owner's allowed max discount
    if (negotiate && bargainPrice) {
      const discountPct = ((selected.sellPrice - +bargainPrice) / selected.sellPrice) * 100;
      if (discountPct > maxDiscount) {
        return setEditAlert(`Discount of ${discountPct.toFixed(1)}% exceeds the allowed limit of ${maxDiscount}%. Contact the owner.`);
      }
    }

    const expectedAmt = +qty * finalPrice;

    // FIX: if cash is less than 50% of expected, require a note
    if (+cash < expectedAmt * 0.5) {
      if (!lowCashNote.trim()) {
        return setEditAlert(`Cash is less than 50% of expected (${fmt(expectedAmt)}). Please enter a reason below.`);
      }
    }

    const q = +qty;
    const fullNote = lowCashNote.trim() ? `${note ? note + ' | ' : ''}LOW CASH REASON: ${lowCashNote.trim()}` : note;

    const sale: Sale = {
      id: uid(),
      productId: selected.id, productName: selected.name,
      repId: rep.id, repName: rep.name,
      qty: q,
      pricePerBox: finalPrice,
      standardPrice: selected.sellPrice,
      expectedCash: q * finalPrice,
      cashCollected: +cash,
      discrepancy: +cash - q * finalPrice,
      note: fullNote, date: today(), time: nowTime(),
      voided: false, edited: false,
      negotiated: negotiate && Boolean(bargainPrice),
      negotiatedPrice: negotiate && bargainPrice ? +bargainPrice : undefined,
      negotiationReason: negotiate ? bargainReason : '',
    };

    const newProducts = data.products.map(p =>
      p.id === selected.id ? { ...p, stock: p.stock - q } : p
    );

    let nd = { ...data, sales: [...data.sales, sale], products: newProducts };
    nd = addAudit(nd, "SALE", `${rep.name} sold ${q} × ${selected.name} — collected ${fmt(+cash)} (expected ${fmt(q * finalPrice)})`, rep.name);
    save(nd);
    setReceipt(sale);
    setSelected(null); setQty(""); setCash(""); setNote(""); setEditAlert(""); setLowCashNote("");
    setNegotiate(false); setBargainPrice(''); setBargainReason('');
  };

  const editSale = (saleId: string, newQty: string, newCash: string) => {
    if (!Number.isInteger(+newQty) || +newQty <= 0) return setEditAlert("Invalid quantity.");
    if (isNaN(+newCash)) return setEditAlert("Invalid cash amount.");

    // FIX: cash cannot be negative in edits either
    if (+newCash < 0) return setEditAlert("Cash collected cannot be negative.");

    const sale = data.sales.find(s => s.id === saleId);
    if (!sale) return setEditAlert("Sale not found.");
    const product = data.products.find(p => p.id === sale.productId);
    if (!product) return setEditAlert("Product not found.");
    const qtyDiff = +newQty - sale.qty;

    if (qtyDiff > 0 && product.stock < qtyDiff) {
      return setEditAlert(`Only ${product.stock} boxes available to add.`);
    }

    const newProducts = data.products.map(p =>
      p.id === sale.productId ? { ...p, stock: p.stock - qtyDiff } : p
    );

    const newSales = data.sales.map(s =>
      s.id === saleId ? { ...s, qty: +newQty, expectedCash: +newQty * s.pricePerBox, cashCollected: +newCash, discrepancy: +newCash - +newQty * s.pricePerBox, edited: true } : s
    );

    // FIX: record BEFORE and AFTER in the audit trail
    const beforeDetail = `${sale.qty} boxes / ${fmt(sale.cashCollected)}`;
    const afterDetail = `${+newQty} boxes / ${fmt(+newCash)}`;

    let nd = { ...data, sales: newSales, products: newProducts };
    nd = addAudit(nd, "SALE_EDIT", `${rep.name} edited ${sale.productName} — WAS: ${beforeDetail} → NOW: ${afterDetail}`, rep.name);
    save(nd);
    setEditingSaleId(null);
    setEditQty("");
    setEditCash("");
    setEditAlert("");
  };

  if (receipt) return (
    <><style>{STYLE}</style>
    <div className="page">
      <div className="topbar">
        <div><div className="topbar-logo">✓ Sale Recorded</div></div>
        <button className="topbar-btn" onClick={onLogout}>Logout</button>
      </div>
      <div className="content" style={{ paddingBottom: 24, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ background: "var(--white)", borderRadius: 20, padding: 28, textAlign: "center", border: "2px solid var(--green-light)" }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: "var(--font-h)", fontSize: 22, fontWeight: 700, color: "var(--green)" }}>Perfect!</div>
          <div style={{ fontSize: 15, marginBottom: 20, color: "var(--muted)" }}>{receipt.productName}</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[["Boxes", `${receipt.qty}`], ["Price/Box", fmt(receipt.pricePerBox)], ["Expected", fmt(receipt.expectedCash)], ["Collected", fmt(receipt.cashCollected)]]
              .map(([l, v]) => (
                <div key={l} style={{ background: "#f9f7f3", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{l}</div>
                  <div style={{ fontFamily: "var(--font-m)", fontSize: 15, marginTop: 4, color: "var(--text)", fontWeight: 600 }}>{v}</div>
                </div>
              ))}
          </div>

          {receipt.discrepancy !== 0 && (
            <div className={`alert alert-${receipt.discrepancy < 0 ? "red" : "green"}`}>
              {receipt.discrepancy < 0 ? `⚠ Short by ${fmt(Math.abs(receipt.discrepancy))}` : `+ Extra ${fmt(receipt.discrepancy)}`}
            </div>
          )}

          <div style={{ fontSize: 12, color: "var(--muted)" }}>{receipt.date} · {receipt.time}</div>
          <button className="btn btn-green btn-full btn-lg" style={{ marginTop: 20 }} onClick={() => setReceipt(null)}>Record Another Sale</button>
        </div>
      </div>
    </div>
    </>
  );

  if (editingSaleId) {
    const sale = data.sales.find(s => s.id === editingSaleId);
    if (!sale) return null;
    const editExpected = (+editQty || sale.qty) * sale.pricePerBox;
    return (
      <><style>{STYLE}</style>
      <div className="page">
        <div className="topbar">
          <div><div className="topbar-logo">✏ Edit Sale</div></div>
          <button className="topbar-btn" onClick={onLogout}>Logout</button>
        </div>
        <div className="content">
          <div className="card">
            <div className="card-title">Correct: {sale.productName}</div>
            <div className="fg">
              <label className="flabel">Quantity (boxes)</label>
              <input className="finput big" type="number" value={editQty} onChange={e => setEditQty(e.target.value)} />
            </div>
            <div className="fg">
              <label className="flabel">Cash Collected (₦)</label>
              <input className="finput big" type="number" value={editCash} onChange={e => setEditCash(e.target.value)} />
              {sale && (
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  Expected: <strong style={{ color: "var(--green2)" }}>{fmt(editExpected)}</strong>
                  {editCash && +editCash !== editExpected && (
                    <span style={{ color: +editCash < editExpected ? "var(--red)" : "var(--green)", marginLeft: 8 }}>
                      {+editCash < editExpected ? "−" : "+"} {fmt(Math.abs(+editCash - editExpected))}
                    </span>
                  )}
                </div>
              )}
            </div>
            {editAlert && <Alert message={editAlert} type="red" onDismiss={() => setEditAlert("")} />}
            <button className="btn btn-green btn-full btn-lg" onClick={() => editSale(editingSaleId, editQty, editCash)} style={{ marginTop: 8 }}>Save Correction</button>
            <button className="btn btn-ghost btn-full" onClick={() => { setEditingSaleId(null); setEditQty(""); setEditCash(""); setEditAlert(""); }}>Cancel</button>
          </div>
        </div>
      </div>
      </>
    );
  }

  const paginatedSales = todaySales.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(todaySales.length / PAGE_SIZE);

  return (
    <><style>{STYLE}</style>
    <div className="page">
      <div className="topbar">
        <div><div className="topbar-logo">📝 Record Sale</div><div className="topbar-sub">{rep.name}</div></div>
        <button className="topbar-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="content" style={{ paddingBottom: 24 }}>
        {availableProducts.length === 0 && (
          <Alert message="No products in stock. Ask owner to record a delivery." type="gold" onDismiss={() => {}} />
        )}

        <div style={{ fontFamily: "var(--font-h)", fontSize: 13, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", fontWeight: 600 }}>Select Product</div>
        <div className="prod-grid">
          {data.products.map(p => (
            <div key={p.id} className={`prod-card${selected?.id === p.id ? " selected" : ""} ${p.stock === 0 ? " disabled" : ""}`} onClick={() => p.stock > 0 && handleSelectProduct(p)} style={{ cursor: p.stock > 0 ? "pointer" : "not-allowed" }}>
              <div className="prod-name">{p.name}</div>
              <div className="prod-price">{fmt(p.sellPrice)}/box</div>
              <div className="prod-stock">{p.stock > 0 ? `${p.stock.toLocaleString()} in stock` : "Out of stock"}</div>
              <div className="bar-bg"><div className="bar-fill" style={{ width: Math.min(100, (p.stock / (p.expectedQty || 500)) * 100) + "%", background: "var(--green3)" }}></div></div>
            </div>
          ))}
        </div>

        {selected && (
          <>
            <div style={{ fontFamily: "var(--font-h)", fontSize: 13, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", fontWeight: 600 }}>Transaction Details</div>
            <div className="card">
              <div className="fg">
                <label className="flabel">How many boxes sold? *</label>
                <input className="finput big" type="number" min="1" max={selected.stock} value={qty} onChange={e => handleQty(e.target.value)} />
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Max: {selected.stock} boxes</div>
              </div>

              <div className="fg">
                <label className="flabel">Cash Collected (₦) *</label>
                <input className="finput big" type="number" value={cash} onChange={e => { setCash(e.target.value); }} />
                {qty && <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Expected: <strong style={{ color: "var(--green2)" }}>{fmt(+qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice))}</strong>
                  {cash && +cash !== +qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice) && <span style={{ color: +cash < +qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice) ? "var(--red)" : "var(--green)" }}> {+cash < +qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice) ? "−" : "+"} {fmt(Math.abs(+cash - +qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice)))}</span>}
                </div>}
              </div>

              {/* Bargaining Toggle */}
              <div className="fg" style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>💬 Customer negotiating price?</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Toggle to record a bargained price</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNegotiate(n => !n);
                      setBargainPrice('');
                      setBargainReason('');
                      if (qty && selected) setCash(String(+qty * selected.sellPrice));
                    }}
                    style={{
                      width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: negotiate ? 'var(--green2)' : 'var(--border)',
                      transition: 'background 0.2s', position: 'relative',
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: negotiate ? 22 : 4,
                      width: 22, height: 22, borderRadius: '50%', background: 'white',
                      transition: 'left 0.2s', display: 'block',
                      boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                    }} />
                  </button>
                </div>
              </div>

              {negotiate && (
                <div style={{ background: 'var(--gold-light)', border: '1.5px solid var(--gold)', borderRadius: 10, padding: 14, marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gold)', marginBottom: 10 }}>
                    🤝 Bargain Details — Standard price: {fmt(selected!.sellPrice)}/box
                  </div>
                  <div className="fg">
                    <label className="flabel">Agreed Price per Box (₦)</label>
                    <input
                      className="finput big"
                      type="number"
                      min="0"
                      placeholder={String(selected!.sellPrice)}
                      value={bargainPrice}
                      onChange={e => {
                        setBargainPrice(e.target.value);
                        if (qty) setCash(String(+qty * +e.target.value));
                      }}
                    />
                    {bargainPrice && +bargainPrice < selected!.sellPrice && (
                      <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>
                        Discount: {fmt(selected!.sellPrice - +bargainPrice)}/box
                        ({(((selected!.sellPrice - +bargainPrice) / selected!.sellPrice) * 100).toFixed(1)}% off)
                      </div>
                    )}
                    {bargainPrice && +bargainPrice > selected!.sellPrice && (
                      <div style={{ fontSize: 12, color: 'var(--green2)', marginTop: 4 }}>
                        Premium: +{fmt(+bargainPrice - selected!.sellPrice)}/box
                      </div>
                    )}
                  </div>
                  <div className="fg">
                    <label className="flabel">Reason for Negotiation</label>
                    <input
                      className="finput"
                      value={bargainReason}
                      onChange={e => setBargainReason(e.target.value)}
                      placeholder="e.g. Bulk order, Regular customer, Market rate..."
                    />
                  </div>
                </div>
              )}

              <div className="fg">
                <label className="flabel">Customer / Note (optional)</label>
                <input className="finput" value={note} onChange={e => setNote(e.target.value)} placeholder="E.g., Repeat customer" />
              </div>

              {/* Low-cash reason field — shown automatically when cash < 50% of expected */}
              {cash && qty && selected && +cash < (+qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice)) * 0.5 && (
                <div className="fg">
                  <label className="flabel" style={{ color: "var(--red)" }}>⚠ Cash is below 50% — Reason required</label>
                  <input className="finput" style={{ borderColor: "var(--red)" }} value={lowCashNote} onChange={e => setLowCashNote(e.target.value)} placeholder="E.g., customer paying balance tomorrow" />
                </div>
              )}

              {editAlert && <Alert message={editAlert} type="red" onDismiss={() => setEditAlert("")} />}

              <button className="btn btn-green btn-full btn-lg" onClick={submit}>✓ Confirm Sale</button>
            </div>
          </>
        )}

        {todaySales.length > 0 && (
          <div className="card">
            <div className="card-title">📊 Your Sales Today ({todaySales.length})</div>
            {paginatedSales.map(s => (
              <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {s.productName} — {s.qty} boxes 
                    {s.edited && <span className="badge badge-gold">Edited</span>}
                    {s.negotiated && !s.edited && <span className="badge badge-blue">Negotiated</span>}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{fmt(s.cashCollected)}</div>
                </div>
                {/* FIX: one-edit lock — rep can only edit a sale once */}
                {s.edited ? (
                  <span style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>Owner only</span>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditingSaleId(s.id); setEditQty(String(s.qty)); setEditCash(String(s.cashCollected)); }} title="Edit this sale">✏</button>
                )}
              </div>
            ))}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ flex: '0 0 auto' }}>← Prev</button>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} className={`btn btn-sm ${i === page ? 'btn-green' : 'btn-ghost'}`} onClick={() => setPage(i)} style={{ minWidth: 32, padding: '6px 10px' }}>{i + 1}</button>
                  ))}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{ flex: '0 0 auto' }}>Next →</button>
              </div>
            )}
            <div style={{ marginTop: 12, fontFamily: "var(--font-m)", fontSize: 14, color: "var(--green2)", fontWeight: 600 }}>
              Today's Total: {fmt(todaySales.reduce((s,t) => s + t.cashCollected, 0))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
