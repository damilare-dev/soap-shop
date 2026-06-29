import { useRef, useState } from 'react';
import { OwnerQuickSaleProps, Product, Sale, SalesRep } from '../types';
import { uid, today, nowTime, fmt } from '../lib/utils';
import Alert from './Alert';
import DetailedSale from './DetailedSale';

const OWNER_REP_ID = 'owner';
const OWNER_REP_NAME = 'Owner';

const STYLE = `
.oqs-stores{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:8px;}
.oqs-store-btn{background:var(--white);border:2.5px solid var(--border);border-radius:18px;padding:28px 20px;cursor:pointer;text-align:center;transition:all .15s;font-family:var(--font-h);font-size:22px;font-weight:700;color:var(--green);}
.oqs-store-btn:hover{border-color:var(--green2);transform:translateY(-2px);box-shadow:var(--shadow);}
.oqs-store-btn:active{transform:scale(.96);}
.oqs-store-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.oqs-header{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;}
.oqs-banner{position:sticky;top:0;z-index:50;background:var(--green);color:white;border-radius:var(--radius);padding:18px 20px;margin-bottom:16px;box-shadow:var(--shadow-lg);font-family:var(--font-h);font-size:19px;font-weight:700;text-align:center;}
.oqs-total{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.oqs-total-value{font-family:var(--font-m);font-size:22px;font-weight:700;color:var(--green2);}
.oqs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:8px;}
.oqs-btn{background:var(--white);border:2.5px solid var(--border);border-radius:16px;padding:18px 14px;cursor:pointer;transition:all .15s;text-align:left;min-height:96px;display:flex;flex-direction:column;justify-content:space-between;font-family:var(--font-b);}
.oqs-btn:hover{border-color:var(--green2);transform:translateY(-2px);box-shadow:var(--shadow);}
.oqs-btn:active{transform:scale(.96);}
.oqs-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.oqs-btn.out{opacity:.45;cursor:not-allowed;background:#ece9e3;}
.oqs-name{font-family:var(--font-h);font-size:17px;font-weight:700;color:var(--text);line-height:1.25;}
.oqs-price{font-family:var(--font-m);font-size:15px;color:var(--green2);font-weight:600;margin-top:8px;}
.oqs-stock{font-size:11.5px;color:var(--muted);margin-top:2px;}
.oqs-qtybtn{margin-top:12px;padding:8px;border-radius:8px;border:1.5px solid var(--border);background:var(--gold-light);color:#7a5c00;font-family:var(--font-b);font-size:12px;font-weight:700;cursor:pointer;text-align:center;width:100%;}
.oqs-qtybtn:hover{border-color:var(--gold);}
.oqs-qtybtn:active{transform:scale(.96);}
.oqs-qtybtn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.oqs-modal-backdrop{position:fixed;inset:0;background:rgba(26,61,43,.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:2000;}
.oqs-modal{background:var(--white);border-radius:var(--radius);padding:28px 24px;max-width:380px;width:100%;box-shadow:var(--shadow-lg);}
.oqs-modal-title{font-family:var(--font-h);font-size:21px;font-weight:700;color:var(--green);margin-bottom:4px;}
.oqs-modal-sub{font-size:13px;color:var(--muted);margin-bottom:22px;}
.oqs-stepper{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:22px;}
.oqs-stepper-btn{width:56px;height:56px;border-radius:50%;border:2px solid var(--border);background:var(--white);font-size:28px;font-weight:700;color:var(--green);cursor:pointer;flex-shrink:0;}
.oqs-stepper-btn:hover{border-color:var(--green2);}
.oqs-stepper-btn:active{transform:scale(.94);}
.oqs-stepper-btn:disabled{opacity:.35;cursor:not-allowed;}
.oqs-stepper-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.oqs-stepper-input{font-family:var(--font-m);font-size:28px;font-weight:700;width:100px;text-align:center;border:1.5px solid var(--border);border-radius:10px;padding:8px 4px;background:var(--white);color:var(--text);}
.oqs-stepper-input:focus{outline:none;border-color:var(--green2);box-shadow:0 0 0 3px rgba(26,61,43,.1);}
.oqs-stepper-input::-webkit-outer-spin-button,.oqs-stepper-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.oqs-stepper-input[type=number]{-moz-appearance:textfield;}
.oqs-modal-total{text-align:center;background:var(--green-light);border-radius:var(--radius-sm);padding:14px;margin-bottom:22px;}
.oqs-modal-total-label{font-size:11px;text-transform:uppercase;color:var(--muted);font-weight:600;letter-spacing:.06em;}
.oqs-modal-total-value{font-family:var(--font-m);font-size:24px;font-weight:700;color:var(--green2);margin-top:4px;}
.oqs-modal-actions{display:flex;gap:10px;}
.oqs-session-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:10px;}
.oqs-session-name{font-weight:600;font-size:15px;}
.oqs-session-qty{font-family:var(--font-m);color:var(--green2);font-size:13px;margin-top:2px;}
.oqs-minus{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--border);background:var(--white);font-size:20px;font-weight:700;cursor:pointer;flex-shrink:0;}
.oqs-minus:hover{border-color:var(--red);color:var(--red);}
@media(max-width:500px){
 .oqs-grid{grid-template-columns:repeat(2,1fr);}
 .oqs-stores{grid-template-columns:repeat(2,1fr);}
 .oqs-stepper-btn{width:48px;height:48px;font-size:24px;}
 .oqs-stepper-input{width:84px;font-size:24px;}
}
`;

const QTY_STEP = 0.5;

// Mirrors the detailed sale flow's qty input: step 0.5, min 0.5, max = stock. Snaps to the
// nearest half-box and falls back to the minimum on invalid/empty input so it never submits NaN/0.
const clampQty = (n: number, stock: number): number => {
  if (!isFinite(n) || n <= 0) return QTY_STEP;
  const snapped = Math.round(n / QTY_STEP) * QTY_STEP;
  if (snapped < QTY_STEP) return QTY_STEP;
  if (snapped > stock) return stock;
  return snapped;
};

const formatQty = (n: number): string => (n % 1 === 0 ? String(n) : n.toFixed(1));

export default function OwnerQuickSale({ data, save, addAudit }: OwnerQuickSaleProps) {
  const [storeTag, setStoreTag] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [search, setSearch] = useState('');
  const [recentSaleIds, setRecentSaleIds] = useState<string[]>([]);
  const [banner, setBanner] = useState('');
  const [qtyPanelProduct, setQtyPanelProduct] = useState<Product | null>(null);
  const [qtyValue, setQtyValue] = useState(1);
  const [qtyText, setQtyText] = useState('1');
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stores are derived from the "(TAG)" suffix already used on every product name —
  // never hardcoded, so a newly named warehouse shows up automatically.
  const storeTags = Array.from(new Set(
    data.products
      .map(p => p.name.match(/\(([^)]+)\)$/))
      .filter((m): m is RegExpMatchArray => Boolean(m))
      .map(m => m[1])
  )).sort();

  const changeStore = (tag: string | null) => {
    setStoreTag(tag);
    setMode('quick');
    setSearch('');
    setRecentSaleIds([]);
    setBanner('');
    setQtyPanelProduct(null);
  };

  if (!storeTag) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="card-title">💰 Quick Sale</div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Which store are you in?</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Pick a store to start selling.</div>
        {storeTags.length === 0 ? (
          <Alert message="No products set up yet. Add products in Settings first." type="gold" onDismiss={() => {}} />
        ) : (
          <div className="oqs-stores">
            {storeTags.map(tag => (
              <button key={tag} className="oqs-store-btn" onClick={() => changeStore(tag)}>{tag}</button>
            ))}
          </div>
        )}
      </>
    );
  }

  if (mode === 'detailed') {
    const ownerRepForStore: SalesRep = {
      id: OWNER_REP_ID,
      name: OWNER_REP_NAME,
      pin: '',
      warehouse: storeTag === 'JLY' ? 'JLY' : 'OWD',
    };
    return (
      <DetailedSale
        data={data}
        save={save}
        rep={ownerRepForStore}
        onLogout={() => setMode('quick')}
        onSwitchToQuick={() => setMode('quick')}
        addAudit={addAudit}
      />
    );
  }

  const warehouseTag = `(${storeTag})`;
  const storeProducts = data.products.filter(p => p.name.includes(warehouseTag));
  const displayName = (p: Product) => p.name.replace(` ${warehouseTag}`, '');

  const activeSales = data.sales.filter(s => !s.voided);
  const todaySales = activeSales.filter(s => s.date === today() && s.repId === OWNER_REP_ID && storeProducts.some(p => p.id === s.productId));
  const todayCount = todaySales.length;
  const todayTotal = todaySales.reduce((sum, s) => sum + s.cashCollected, 0);

  const popularProducts = (() => {
    const totals = new Map<string, number>();
    activeSales.forEach(s => {
      if (storeProducts.some(p => p.id === s.productId)) {
        totals.set(s.productId, (totals.get(s.productId) ?? 0) + s.qty);
      }
    });
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => storeProducts.find(p => p.id === id))
      .filter((p): p is Product => Boolean(p));
  })();

  const azProducts = [...storeProducts]
    .filter(p => !search || displayName(p).toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => displayName(a).localeCompare(displayName(b)));

  const sessionSales = recentSaleIds
    .map(id => data.sales.find(s => s.id === id))
    .filter((s): s is Sale => Boolean(s) && !s!.voided);

  const sessionGroups: { productId: string; productName: string; qty: number }[] = [];
  sessionSales.forEach(s => {
    const g = sessionGroups.find(x => x.productId === s.productId);
    if (g) g.qty += s.qty;
    else sessionGroups.push({ productId: s.productId, productName: s.productName, qty: s.qty });
  });

  const showBanner = (msg: string) => {
    setBanner(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(''), 1800);
  };

  const recordSale = (product: Product, qty: number = 1) => {
    if (qty <= 0 || product.stock < qty) return;

    const price = product.sellPrice;
    const total = price * qty;
    const sale: Sale = {
      id: uid(),
      productId: product.id,
      productName: product.name,
      repId: OWNER_REP_ID,
      repName: OWNER_REP_NAME,
      qty,
      pricePerBox: price,
      standardPrice: price,
      expectedCash: total,
      cashCollected: total,
      discrepancy: 0,
      note: '',
      date: today(),
      time: nowTime(),
      voided: false,
      edited: false,
      negotiated: false,
      negotiationReason: '',
    };

    let nd = {
      ...data,
      products: data.products.map(p => p.id === product.id ? { ...p, stock: p.stock - qty } : p),
      sales: [...data.sales, sale],
    };
    nd = addAudit(nd, 'SALE', `${OWNER_REP_NAME} sold ${qty} × ${product.name} — collected ${fmt(total)} (expected ${fmt(total)})`, OWNER_REP_NAME);
    save(nd);

    setRecentSaleIds(ids => [...ids, sale.id]);
    showBanner(`Recorded: ${displayName(product)}${qty !== 1 ? ` ×${qty}` : ''}`);
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const openQtyPanel = (p: Product) => {
    setQtyPanelProduct(p);
    const initial = p.stock >= 1 ? 1 : p.stock;
    setQtyValue(initial);
    setQtyText(formatQty(initial));
  };

  const stepQty = (delta: number) => {
    if (!qtyPanelProduct) return;
    const next = clampQty(qtyValue + delta, qtyPanelProduct.stock);
    setQtyValue(next);
    setQtyText(formatQty(next));
  };

  const handleQtyTextChange = (text: string) => {
    setQtyText(text);
    if (!qtyPanelProduct) return;
    const n = Number(text);
    if (text.trim() === '' || !isFinite(n) || n <= 0) return;
    const clamped = Math.min(n, qtyPanelProduct.stock);
    setQtyValue(clamped < QTY_STEP ? QTY_STEP : clamped);
  };

  const handleQtyTextBlur = () => {
    if (!qtyPanelProduct) return;
    const finalQty = clampQty(Number(qtyText), qtyPanelProduct.stock);
    setQtyValue(finalQty);
    setQtyText(formatQty(finalQty));
  };

  const confirmQtySale = () => {
    if (!qtyPanelProduct) return;
    const finalQty = clampQty(qtyValue, qtyPanelProduct.stock);
    recordSale(qtyPanelProduct, finalQty);
    setQtyPanelProduct(null);
  };

  const voidSessionSale = (saleId: string) => {
    const s = data.sales.find(x => x.id === saleId);
    setRecentSaleIds(ids => ids.filter(id => id !== saleId));
    if (!s || s.voided) return;

    const newProducts = data.products.map(p => p.id === s.productId ? { ...p, stock: p.stock + s.qty } : p);
    const newSales = data.sales.map(x => x.id === saleId ? { ...x, voided: true, voidedBy: OWNER_REP_NAME, voidedAt: new Date().toISOString() } : x);
    let nd = { ...data, sales: newSales, products: newProducts };
    // Owner can void any of their Quick Sales any time — no 2-minute window like reps have.
    nd = addAudit(nd, 'VOID', `${OWNER_REP_NAME} voided ${s.qty} × ${s.productName} at ${nowTime()}`, OWNER_REP_NAME);
    save(nd);
  };

  const undoLastSale = () => {
    if (recentSaleIds.length === 0) return;
    voidSessionSale(recentSaleIds[recentSaleIds.length - 1]);
  };

  const removeOneFromGroup = (productId: string) => {
    for (let i = recentSaleIds.length - 1; i >= 0; i--) {
      const s = data.sales.find(x => x.id === recentSaleIds[i]);
      if (s && s.productId === productId && !s.voided) {
        voidSessionSale(s.id);
        return;
      }
    }
  };

  const renderProductButton = (p: Product) => {
    const outOfStock = p.stock <= 0;
    return (
      <div
        key={p.id}
        className={`oqs-btn${outOfStock ? ' out' : ''}`}
        role="button"
        tabIndex={outOfStock ? -1 : 0}
        aria-disabled={outOfStock}
        style={{ cursor: outOfStock ? 'not-allowed' : 'pointer' }}
        onClick={() => { if (!outOfStock) recordSale(p); }}
        onKeyDown={e => {
          if (outOfStock) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); recordSale(p); }
        }}
      >
        <div>
          <div className="oqs-name">{displayName(p)}</div>
          <div>
            <div className="oqs-price">{fmt(p.sellPrice)}/box</div>
            <div className="oqs-stock">{outOfStock ? 'Out of stock' : `${p.stock.toLocaleString()} left`}</div>
          </div>
        </div>
        {!outOfStock && (
          <button
            type="button"
            className="oqs-qtybtn"
            onClick={e => { e.stopPropagation(); openQtyPanel(p); }}
          >
            📦 Choose qty
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="oqs-header">
        <div>
          <div className="card-title" style={{ marginBottom: 2 }}>💰 Quick Sale — {storeTag}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setMode('detailed')}>Detailed</button>
          <button className="btn btn-ghost btn-sm" onClick={() => changeStore(null)}>Change Store</button>
        </div>
      </div>

      {banner && <div className="oqs-banner">✓ {banner}</div>}

      {storeProducts.length === 0 && (
        <Alert message="No products set up for this store yet. Ask add some in Settings." type="gold" onDismiss={() => {}} />
      )}

      <div className="card oqs-total">
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Today at {storeTag}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{todayCount} sale{todayCount === 1 ? '' : 's'}</div>
        </div>
        <div className="oqs-total-value">{fmt(todayTotal)}</div>
      </div>

      {sessionGroups.length > 0 && (
        <div className="card">
          <div className="card-title">🧾 Just Recorded</div>
          {sessionGroups.map(g => (
            <div key={g.productId} className="oqs-session-row">
              <div>
                <div className="oqs-session-name">{g.productName.replace(` ${warehouseTag}`, '')}</div>
                <div className="oqs-session-qty">{g.qty} box{g.qty === 1 ? '' : 'es'}</div>
              </div>
              <button className="oqs-minus" aria-label={`Remove one ${g.productName}`} onClick={() => removeOneFromGroup(g.productId)}>−</button>
            </div>
          ))}
          <button className="btn btn-ghost btn-full" style={{ marginTop: 14 }} onClick={undoLastSale}>
            ↺ Undo Last Sale
          </button>
        </div>
      )}

      <input
        className="finput"
        placeholder="Search soap…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        aria-label="Search products"
        style={{ marginBottom: 16 }}
      />

      {!search && popularProducts.length > 0 && (
        <>
          <div className="section-title">⭐ Popular</div>
          <div className="oqs-grid">{popularProducts.map(renderProductButton)}</div>
        </>
      )}

      <div className="section-title">{search ? `Results (${azProducts.length})` : 'All Products (A–Z)'}</div>
      <div className="oqs-grid">
        {azProducts.length === 0 && (
          <div style={{ gridColumn: '1/-1', fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>No products match.</div>
        )}
        {azProducts.map(renderProductButton)}
      </div>

      {qtyPanelProduct && (
        <div className="oqs-modal-backdrop" onClick={() => setQtyPanelProduct(null)}>
          <div className="oqs-modal" onClick={e => e.stopPropagation()}>
            <div className="oqs-modal-title">{displayName(qtyPanelProduct)}</div>
            <div className="oqs-modal-sub">{storeTag} · {fmt(qtyPanelProduct.sellPrice)}/box · {qtyPanelProduct.stock.toLocaleString()} in stock</div>

            <div className="oqs-stepper">
              <button className="oqs-stepper-btn" aria-label="Decrease quantity" disabled={qtyValue <= QTY_STEP} onClick={() => stepQty(-QTY_STEP)}>−</button>
              <input
                className="oqs-stepper-input"
                type="number"
                inputMode="decimal"
                step={QTY_STEP}
                min={QTY_STEP}
                max={qtyPanelProduct.stock}
                aria-label="Quantity"
                value={qtyText}
                onChange={e => handleQtyTextChange(e.target.value)}
                onBlur={handleQtyTextBlur}
              />
              <button className="oqs-stepper-btn" aria-label="Increase quantity" disabled={qtyValue >= qtyPanelProduct.stock} onClick={() => stepQty(QTY_STEP)}>+</button>
            </div>

            <div className="oqs-modal-total">
              <div className="oqs-modal-total-label">Total</div>
              <div className="oqs-modal-total-value">{fmt(qtyValue * qtyPanelProduct.sellPrice)}</div>
            </div>

            <div className="oqs-modal-actions">
              <button className="btn btn-ghost btn-full btn-lg" onClick={() => setQtyPanelProduct(null)}>Cancel</button>
              <button className="btn btn-green btn-full btn-lg" onClick={confirmQtySale}>Confirm Sale</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
