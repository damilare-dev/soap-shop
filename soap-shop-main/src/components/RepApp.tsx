import { useState } from 'react';
import { Product, RepAppProps, Sale } from '../types';
import { uid, today, nowTime, fmt } from '../lib/utils';
import Alert from './Alert';

type CartItem = {
  id: string;
  product: Product;
  qty: number;
  cash: number;
  note: string;
  negotiate: boolean;
  bargainPrice: string;
  bargainReason: string;
  lowCashNote: string;
};

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
  const [qty, setQty] = useState<string>('');
  const [cash, setCash] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [negotiate, setNegotiate] = useState(false);
  const [bargainPrice, setBargainPrice] = useState('');
  const [bargainReason, setBargainReason] = useState('');
  const [lowCashNote, setLowCashNote] = useState('');
  const [formAlert, setFormAlert] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartAlert, setCartAlert] = useState('');
  const [receipts, setReceipts] = useState<Sale[] | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<string>('');
  const [editCash, setEditCash] = useState<string>('');
  const [editAlert, setEditAlert] = useState<string>('');
  const [page, setPage] = useState(0);
  const [prodSearch, setProdSearch] = useState('');
  const PAGE_SIZE = 10;

  const maxDiscount = data.maxDiscountPct ?? 15;
  const activeSales = data.sales.filter(s => !s.voided);
  const todaySales = activeSales.filter(s => s.date === today() && s.repId === rep.id);
  // Defensive: if warehouse missing on rep object, try to infer from rep name or default to OWD
  const repWarehouse: 'OWD' | 'JLY' = (rep.warehouse === 'JLY') ? 'JLY' : (rep.warehouse === 'OWD' ? 'OWD' : 'OWD');
  const warehouseTag = `(${repWarehouse})`;
  const repProducts = data.products.filter(p => p.name.includes(warehouseTag));
  const filteredRepProducts = prodSearch
    ? repProducts.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()))
    : repProducts;

  const getAvailableStock = (product: Product) => {
    const reservedInCart = cart
      .filter(c => c.product.id === product.id)
      .reduce((sum, c) => sum + c.qty, 0);
    return product.stock - reservedInCart;
  };

  const handleSelectProduct = (p: Product) => {
    setSelected(p);
    setNegotiate(false);
    setBargainPrice('');
    setBargainReason('');
    setLowCashNote('');
    setQty('');
    setCash('');
    setNote('');
    setFormAlert('');
    setProdSearch('');
  };

  const handleQty = (v: string) => {
    setQty(v);
    const activePrice = negotiate && bargainPrice ? +bargainPrice : selected?.sellPrice ?? 0;
    if (selected && v) setCash(String(+v * activePrice));
    else setCash('');
  };

  const addToCart = () => {
    if (!selected) return setFormAlert('Please select a product first.');
    if (!qty || +qty <= 0) return setFormAlert('Please enter a valid quantity.');
    if (+qty % 0.5 !== 0) return setFormAlert('Quantity must be in whole or half boxes (e.g. 1, 1.5, 2).');
    const availableStock = getAvailableStock(selected);
    if (+qty > availableStock) return setFormAlert(`Only ${availableStock} boxes available (some may be reserved in cart).`);
    if (!cash || isNaN(+cash)) return setFormAlert('Please enter the cash collected.');
    if (+cash < 0) return setFormAlert('Cash collected cannot be negative.');

    if (negotiate && bargainPrice) {
      const discountPct = ((selected.sellPrice - +bargainPrice) / selected.sellPrice) * 100;
      if (discountPct > maxDiscount) {
        return setFormAlert(`Discount of ${discountPct.toFixed(1)}% exceeds the allowed limit of ${maxDiscount}%. Contact the owner.`);
      }
    }

    const finalPrice = negotiate && bargainPrice ? +bargainPrice : selected.sellPrice;
    const expectedAmt = +qty * finalPrice;

    if (+cash < expectedAmt * 0.5) {
      if (!lowCashNote.trim()) {
        return setFormAlert(`Cash is less than 50% of expected (${fmt(expectedAmt)}). Please enter a reason below.`);
      }
    }

    const cartItem: CartItem = {
      id: uid(),
      product: selected,
      qty: +qty,
      cash: +cash,
      note,
      negotiate,
      bargainPrice,
      bargainReason,
      lowCashNote,
    };

    setCart(c => [...c, cartItem]);
    setSelected(null);
    setQty('');
    setCash('');
    setNote('');
    setNegotiate(false);
    setBargainPrice('');
    setBargainReason('');
    setLowCashNote('');
    setFormAlert('');
  };

  const removeFromCart = (id: string) => {
    setCart(c => c.filter(item => item.id !== id));
  };

  const confirmAllSales = () => {
    if (cart.length === 0) return setCartAlert('Cart is empty.');

    let nd = { ...data };
    const newSales: Sale[] = [];

    for (const item of cart) {
      const finalPrice = item.negotiate && item.bargainPrice ? +item.bargainPrice : item.product.sellPrice;
      const fullNote = item.lowCashNote.trim()
        ? `${item.note ? item.note + ' | ' : ''}LOW CASH REASON: ${item.lowCashNote.trim()}`
        : item.note;

      const sale: Sale = {
        id: uid(),
        productId: item.product.id,
        productName: item.product.name,
        repId: rep.id,
        repName: rep.name,
        qty: item.qty,
        pricePerBox: finalPrice,
        standardPrice: item.product.sellPrice,
        expectedCash: item.qty * finalPrice,
        cashCollected: item.cash,
        discrepancy: item.cash - item.qty * finalPrice,
        note: fullNote,
        date: today(),
        time: nowTime(),
        voided: false,
        edited: false,
        negotiated: item.negotiate && Boolean(item.bargainPrice),
        negotiatedPrice: item.negotiate && item.bargainPrice ? +item.bargainPrice : undefined,
        negotiationReason: item.negotiate ? item.bargainReason : '',
      };

      newSales.push(sale);

      nd = {
        ...nd,
        products: nd.products.map(p =>
          p.id === item.product.id ? { ...p, stock: p.stock - item.qty } : p
        ),
        sales: [...nd.sales, sale],
      };

      nd = addAudit(
        nd,
        'SALE',
        `${rep.name} sold ${item.qty} × ${item.product.name} — collected ${fmt(item.cash)} (expected ${fmt(item.qty * finalPrice)})`,
        rep.name
      );
    }

    save(nd);
    setReceipts(newSales);
    setCart([]);
    setCartAlert('');
  };

  const editSale = (saleId: string, newQty: string, newCash: string) => {
    if (!newQty || +newQty <= 0 || +newQty % 0.5 !== 0) return setEditAlert('Invalid quantity. Must be in whole or half boxes.');
    if (isNaN(+newCash)) return setEditAlert('Invalid cash amount.');
    if (+newCash < 0) return setEditAlert('Cash collected cannot be negative.');

    const sale = data.sales.find(s => s.id === saleId);
    if (!sale) return setEditAlert('Sale not found.');
    const product = data.products.find(p => p.id === sale.productId);
    if (!product) return setEditAlert('Product not found.');
    const qtyDiff = +newQty - sale.qty;

    if (qtyDiff > 0 && product.stock < qtyDiff) {
      return setEditAlert(`Only ${product.stock} boxes available to add.`);
    }

    const newProducts = data.products.map(p =>
      p.id === sale.productId ? { ...p, stock: p.stock - qtyDiff } : p
    );

    const newSales = data.sales.map(s =>
      s.id === saleId
        ? { ...s, qty: +newQty, expectedCash: +newQty * s.pricePerBox, cashCollected: +newCash, discrepancy: +newCash - +newQty * s.pricePerBox, edited: true }
        : s
    );

    const beforeDetail = `${sale.qty} boxes / ${fmt(sale.cashCollected)}`;
    const afterDetail = `${+newQty} boxes / ${fmt(+newCash)}`;

    let nd = { ...data, sales: newSales, products: newProducts };
    nd = addAudit(nd, 'SALE_EDIT', `${rep.name} edited ${sale.productName} — WAS: ${beforeDetail} → NOW: ${afterDetail}`, rep.name);
    save(nd);
    setEditingSaleId(null);
    setEditQty('');
    setEditCash('');
    setEditAlert('');
  };

  if (receipts) return (
    <><style>{STYLE}</style>
    <div className="page">
      <div className="topbar">
        <div><div className="topbar-logo">✓ Sales Recorded</div></div>
        <button className="topbar-btn" onClick={onLogout}>Logout</button>
      </div>
      <div className="content" style={{ paddingBottom: 24 }}>
        <div style={{ background: 'var(--white)', borderRadius: 20, padding: 28, textAlign: 'center', border: '2px solid var(--green-light)', marginBottom: 16 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>✓</div>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>
            {receipts.length} sale{receipts.length > 1 ? 's' : ''} recorded!
          </div>
          <div style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
            Total collected: <strong style={{ color: 'var(--green2)' }}>{fmt(receipts.reduce((s, r) => s + r.cashCollected, 0))}</strong>
          </div>
        </div>

        {receipts.map(r => (
          <div key={r.id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--green)', marginBottom: 10 }}>{r.productName}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['Boxes', String(r.qty)], ['Price/Box', fmt(r.pricePerBox)], ['Expected', fmt(r.expectedCash)], ['Collected', fmt(r.cashCollected)]].map(([l, v]) => (
                <div key={l} style={{ background: '#f9f7f3', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>{l}</div>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 14, marginTop: 4, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            {r.discrepancy !== 0 && (
              <div style={{ marginTop: 8, fontSize: 13, color: r.discrepancy < 0 ? 'var(--red)' : 'var(--green2)', fontWeight: 600 }}>
                {r.discrepancy < 0 ? `⚠ Short by ${fmt(Math.abs(r.discrepancy))}` : `+ Extra ${fmt(r.discrepancy)}`}
              </div>
            )}
          </div>
        ))}

        <button className="btn btn-green btn-full btn-lg" style={{ marginTop: 8 }} onClick={() => setReceipts(null)}>
          Record More Sales
        </button>
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
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                Expected: <strong style={{ color: 'var(--green2)' }}>{fmt(editExpected)}</strong>
                {editCash && +editCash !== editExpected && (
                  <span style={{ color: +editCash < editExpected ? 'var(--red)' : 'var(--green)', marginLeft: 8 }}>
                    {+editCash < editExpected ? '−' : '+'} {fmt(Math.abs(+editCash - editExpected))}
                  </span>
                )}
              </div>
            </div>
            {editAlert && <Alert message={editAlert} type="red" onDismiss={() => setEditAlert('')} />}
            <button className="btn btn-green btn-full btn-lg" onClick={() => editSale(editingSaleId, editQty, editCash)} style={{ marginTop: 8 }}>Save Correction</button>
            <button className="btn btn-ghost btn-full" onClick={() => { setEditingSaleId(null); setEditQty(''); setEditCash(''); setEditAlert(''); }}>Cancel</button>
          </div>
        </div>
      </div>
      </>
    );
  }

  const paginatedSales = todaySales.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(todaySales.length / PAGE_SIZE);
  const cartTotal = cart.reduce((s, c) => s + c.cash, 0);

  return (
    <><style>{STYLE}</style>
    <div className="page">
      <div className="topbar">
        <div>
          <div className="topbar-logo">📝 Record Sale</div>
          <div className="topbar-sub">{rep.name} · {rep.warehouse ?? 'OWD'}{cart.length > 0 ? ` · 🛒 ${cart.length} in cart` : ''}</div>
        </div>
        <button className="topbar-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="content" style={{ paddingBottom: 24 }}>
        {repProducts.filter(p => p.stock > 0).length === 0 && (
          <Alert message="No products in stock. Ask owner to record a delivery." type="gold" onDismiss={() => {}} />
        )}

        <div style={{ fontFamily: 'var(--font-h)', fontSize: 13, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Select Product</div>
        <input
          className="finput"
          style={{ marginBottom: 12 }}
          placeholder={`Search ${repWarehouse} products…`}
          value={prodSearch}
          onChange={e => setProdSearch(e.target.value)}
        />

        {filteredRepProducts.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>No products match.</div>
        )}

        {(() => {
          // Group by brand (first word of clean name), in-stock first within each group
          const groups: Record<string, Product[]> = {};
          filteredRepProducts.forEach(p => {
            const clean = p.name.replace(` (${repWarehouse})`, '');
            const brand = clean.split(' ')[0];
            if (!groups[brand]) groups[brand] = [];
            groups[brand].push(p);
          });
          return Object.keys(groups).sort().map(brand => {
            const sorted = [...groups[brand]].sort((a, b) => {
              const aAvail = getAvailableStock(a) > 0 ? 0 : 1;
              const bAvail = getAvailableStock(b) > 0 ? 0 : 1;
              return aAvail - bAvail;
            });
            return (
              <div key={brand} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', paddingBottom: 6, borderBottom: '1.5px solid var(--border)', marginBottom: 8 }}>
                  {brand}
                </div>
                <div className="prod-grid" style={{ marginBottom: 0 }}>
                  {sorted.map(p => {
                    const availStock = getAvailableStock(p);
                    const clean = p.name.replace(` (${repWarehouse})`, '');
                    const variant = clean.slice(brand.length).trim() || clean;
                    return (
                      <div
                        key={p.id}
                        className={`prod-card${selected?.id === p.id ? ' selected' : ''}${availStock === 0 ? ' disabled' : ''}`}
                        onClick={() => availStock > 0 && handleSelectProduct(p)}
                        style={{ cursor: availStock > 0 ? 'pointer' : 'not-allowed' }}
                      >
                        <div className="prod-name">{variant}</div>
                        <div className="prod-price">{fmt(p.sellPrice)}/box</div>
                        <div className="prod-stock">
                          {availStock > 0 ? `${availStock.toLocaleString()} avail` : 'Out of stock'}
                        </div>
                        <div className="bar-bg">
                          <div className="bar-fill" style={{ width: Math.min(100, (availStock / (p.expectedQty || 500)) * 100) + '%', background: availStock > 0 ? 'var(--green3)' : '#d0ccc4' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          });
        })()}

        {selected && (
          <>
            <div style={{ fontFamily: 'var(--font-h)', fontSize: 13, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', fontWeight: 600 }}>Transaction Details</div>
            <div className="card">
              <div className="fg">
                <label className="flabel">How many boxes sold? *</label>
                <input className="finput big" type="number" step="0.5" min="0.5" max={getAvailableStock(selected)} value={qty} onChange={e => handleQty(e.target.value)} />
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Max: {getAvailableStock(selected)} boxes</div>
              </div>

              <div className="fg">
                <label className="flabel">Cash Collected (₦) *</label>
                <input className="finput big" type="number" value={cash} onChange={e => setCash(e.target.value)} />
                {qty && (
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Expected: <strong style={{ color: 'var(--green2)' }}>{fmt(+qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice))}</strong>
                    {cash && +cash !== +qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice) && (
                      <span style={{ color: +cash < +qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice) ? 'var(--red)' : 'var(--green)' }}>
                        {' '}{+cash < +qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice) ? '−' : '+'} {fmt(Math.abs(+cash - +qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice)))}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="fg" style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>💬 Customer negotiating price?</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Toggle to record a bargained price</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setNegotiate(n => !n); setBargainPrice(''); setBargainReason(''); if (qty && selected) setCash(String(+qty * selected.sellPrice)); }}
                    style={{ width: 48, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer', background: negotiate ? 'var(--green2)' : 'var(--border)', transition: 'background 0.2s', position: 'relative' }}
                  >
                    <span style={{ position: 'absolute', top: 3, left: negotiate ? 22 : 4, width: 22, height: 22, borderRadius: '50%', background: 'white', transition: 'left 0.2s', display: 'block', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                  </button>
                </div>
              </div>

              {negotiate && (
                <div style={{ background: 'var(--gold-light)', border: '1.5px solid var(--gold)', borderRadius: 10, padding: 14, marginTop: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gold)', marginBottom: 10 }}>🤝 Bargain Details — Standard price: {fmt(selected.sellPrice)}/box</div>
                  <div className="fg">
                    <label className="flabel">Agreed Price per Box (₦)</label>
                    <input className="finput big" type="number" min="0" placeholder={String(selected.sellPrice)} value={bargainPrice} onChange={e => { setBargainPrice(e.target.value); if (qty) setCash(String(+qty * +e.target.value)); }} />
                    {bargainPrice && +bargainPrice < selected.sellPrice && (
                      <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>
                        Discount: {fmt(selected.sellPrice - +bargainPrice)}/box ({(((selected.sellPrice - +bargainPrice) / selected.sellPrice) * 100).toFixed(1)}% off)
                      </div>
                    )}
                  </div>
                  <div className="fg">
                    <label className="flabel">Reason for Negotiation</label>
                    <input className="finput" value={bargainReason} onChange={e => setBargainReason(e.target.value)} placeholder="e.g. Bulk order, Regular customer..." />
                  </div>
                </div>
              )}

              <div className="fg">
                <label className="flabel">Customer / Note (optional)</label>
                <input className="finput" value={note} onChange={e => setNote(e.target.value)} placeholder="E.g., Repeat customer" />
              </div>

              {cash && qty && selected && +cash < (+qty * (negotiate && bargainPrice ? +bargainPrice : selected.sellPrice)) * 0.5 && (
                <div className="fg">
                  <label className="flabel" style={{ color: 'var(--red)' }}>⚠ Cash is below 50% — Reason required</label>
                  <input className="finput" style={{ borderColor: 'var(--red)' }} value={lowCashNote} onChange={e => setLowCashNote(e.target.value)} placeholder="E.g., customer paying balance tomorrow" />
                </div>
              )}

              {formAlert && <Alert message={formAlert} type="red" onDismiss={() => setFormAlert('')} />}

              <button className="btn btn-green btn-full btn-lg" onClick={addToCart}>
                + Add to Cart
              </button>
            </div>
          </>
        )}

        {cart.length > 0 && (
          <div className="card" style={{ border: '2px solid var(--green)' }}>
            <div className="card-title">🛒 Cart ({cart.length} item{cart.length > 1 ? 's' : ''})</div>
            {cart.map(item => {
              const finalPrice = item.negotiate && item.bargainPrice ? +item.bargainPrice : item.product.sellPrice;
              return (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {item.qty} boxes × {fmt(finalPrice)} = <strong style={{ color: 'var(--green2)' }}>{fmt(item.qty * finalPrice)}</strong>
                      {item.negotiate && <span className="badge badge-gold" style={{ marginLeft: 6 }}>Negotiated</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Cash: {fmt(item.cash)}</div>
                  </div>
                  <button className="btn btn-red btn-sm" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              );
            })}
            <div style={{ marginTop: 14, padding: '12px 0', borderTop: '2px solid var(--green-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Total Cash to Collect:</span>
                <span style={{ fontFamily: 'var(--font-m)', fontWeight: 700, color: 'var(--green)', fontSize: 16 }}>{fmt(cartTotal)}</span>
              </div>
              {cartAlert && <Alert message={cartAlert} type="red" onDismiss={() => setCartAlert('')} />}
              <button className="btn btn-green btn-full btn-lg" onClick={confirmAllSales}>
                ✓ Confirm All Sales ({cart.length} item{cart.length > 1 ? 's' : ''})
              </button>
            </div>
          </div>
        )}

        {todaySales.length > 0 && (
          <div className="card">
            <div className="card-title">📊 Your Sales Today ({todaySales.length})</div>
            {paginatedSales.map(s => (
              <div key={s.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {s.productName} — {s.qty} boxes
                    {s.edited && <span className="badge badge-gold">Edited</span>}
                    {s.negotiated && !s.edited && <span className="badge badge-blue">Negotiated</span>}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>{fmt(s.cashCollected)}</div>
                </div>
                {s.edited ? (
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Owner only</span>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditingSaleId(s.id); setEditQty(String(s.qty)); setEditCash(String(s.cashCollected)); }}>✏</button>
                )}
              </div>
            ))}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>← Prev</button>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} className={`btn btn-sm ${i === page ? 'btn-green' : 'btn-ghost'}`} onClick={() => setPage(i)} style={{ minWidth: 32, padding: '6px 10px' }}>{i + 1}</button>
                  ))}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>Next →</button>
              </div>
            )}
            <div style={{ marginTop: 12, fontFamily: 'var(--font-m)', fontSize: 14, color: 'var(--green2)', fontWeight: 600 }}>
              Today's Total: {fmt(todaySales.reduce((s, t) => s + t.cashCollected, 0))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}