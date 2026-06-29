import { useEffect, useRef, useState } from 'react';
import { Product, QuickSaleProps, Sale } from '../types';
import { uid, today, nowTime, fmt } from '../lib/utils';
import { generateReceipt, ReceiptItem } from '../lib/receipt';
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
.topbar{background:var(--green);color:white;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow);gap:10px;flex-wrap:wrap;}
.topbar-logo{font-family:var(--font-h);font-size:19px;font-weight:700;letter-spacing:-0.3px;}
.topbar-sub{font-size:11px;opacity:.65;margin-top:2px;}
.topbar-actions{display:flex;gap:8px;align-items:center;}
.topbar-btn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:white;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.topbar-btn:hover{background:rgba(255,255,255,.25);}
.content{padding:24px 16px 130px;max-width:680px;margin:0 auto;width:100%;}
.card{background:var(--white);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);margin-bottom:16px;border:1px solid var(--border);}
.card-title{font-family:var(--font-h);font-size:16px;font-weight:600;color:var(--green);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.finput{background:var(--white);border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:14px 16px;font-family:var(--font-b);font-size:16px;transition:all .2s;width:100%;}
.finput:focus{outline:2px solid var(--green2);outline-offset:1px;border-color:var(--green);}
.btn{padding:12px 22px;border-radius:var(--radius-sm);font-family:var(--font-b);font-size:15px;font-weight:600;border:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
.btn:active{transform:scale(.97);}
.btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.btn-green{background:var(--green);color:white;}
.btn-green:hover{background:var(--green2);}
.btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--text);}
.btn-ghost:hover{border-color:var(--green);color:var(--green);}
.btn-full{width:100%;}
.btn-lg{padding:16px;font-size:17px;border-radius:10px;}
.btn-sm{padding:8px 12px;font-size:12px;border-radius:6px;}
.btn:disabled{opacity:.5;cursor:not-allowed;}
.alert{padding:14px 16px;border-radius:var(--radius-sm);font-size:13.5px;display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;border:1px solid;}
.alert-red{background:var(--red-light);border-color:rgba(192,57,43,.2);color:var(--red);}
.alert-gold{background:var(--gold-light);border-color:rgba(181,134,13,.25);color:#7a5c00;}
.qs-banner{position:sticky;top:0;z-index:50;background:var(--green);color:white;border-radius:var(--radius);padding:18px 20px;margin-bottom:16px;box-shadow:var(--shadow-lg);font-family:var(--font-h);font-size:19px;font-weight:700;text-align:center;display:flex;align-items:center;justify-content:center;gap:10px;}
.qs-total{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.qs-total-value{font-family:var(--font-m);font-size:22px;font-weight:700;color:var(--green2);}
.section-title{font-family:var(--font-h);font-size:14px;color:var(--muted);text-transform:uppercase;font-weight:600;letter-spacing:.06em;margin:18px 0 10px;}
.qs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:8px;}
.qs-btn{background:var(--white);border:2.5px solid var(--border);border-radius:16px;padding:18px 14px;cursor:pointer;transition:all .15s;text-align:left;min-height:96px;display:flex;flex-direction:column;justify-content:space-between;font-family:var(--font-b);}
.qs-btn:hover{border-color:var(--green2);transform:translateY(-2px);box-shadow:var(--shadow);}
.qs-btn:active{transform:scale(.96);}
.qs-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.qs-btn.out{opacity:.45;cursor:not-allowed;background:#ece9e3;}
.qs-btn.out:hover{transform:none;box-shadow:none;border-color:var(--border);}
.qs-name{font-family:var(--font-h);font-size:17px;font-weight:700;color:var(--text);line-height:1.25;}
.qs-price{font-family:var(--font-m);font-size:15px;color:var(--green2);font-weight:600;margin-top:8px;}
.qs-stock{font-size:11.5px;color:var(--muted);margin-top:2px;}
.qs-qtybtn{margin-top:12px;padding:8px;border-radius:8px;border:1.5px solid var(--border);background:var(--gold-light);color:#7a5c00;font-family:var(--font-b);font-size:12px;font-weight:700;cursor:pointer;text-align:center;width:100%;}
.qs-qtybtn:hover{border-color:var(--gold);}
.qs-qtybtn:active{transform:scale(.96);}
.qs-qtybtn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.qs-modal-backdrop{position:fixed;inset:0;background:rgba(26,61,43,.55);display:flex;align-items:center;justify-content:center;padding:20px;z-index:2000;}
.qs-modal{background:var(--white);border-radius:var(--radius);padding:28px 24px;max-width:380px;width:100%;box-shadow:var(--shadow-lg);}
.qs-modal-title{font-family:var(--font-h);font-size:21px;font-weight:700;color:var(--green);margin-bottom:4px;}
.qs-modal-sub{font-size:13px;color:var(--muted);margin-bottom:22px;}
.qs-stepper{display:flex;align-items:center;justify-content:center;gap:18px;margin-bottom:22px;}
.qs-stepper-btn{width:56px;height:56px;border-radius:50%;border:2px solid var(--border);background:var(--white);font-size:28px;font-weight:700;color:var(--green);cursor:pointer;flex-shrink:0;}
.qs-stepper-btn:hover{border-color:var(--green2);}
.qs-stepper-btn:active{transform:scale(.94);}
.qs-stepper-btn:disabled{opacity:.35;cursor:not-allowed;}
.qs-stepper-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
.qs-stepper-input{font-family:var(--font-m);font-size:28px;font-weight:700;width:100px;text-align:center;border:1.5px solid var(--border);border-radius:10px;padding:8px 4px;background:var(--white);color:var(--text);}
.qs-stepper-input:focus{outline:none;border-color:var(--green2);box-shadow:0 0 0 3px rgba(26,61,43,.1);}
.qs-stepper-input::-webkit-outer-spin-button,.qs-stepper-input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.qs-stepper-input[type=number]{-moz-appearance:textfield;}
.qs-modal-total{text-align:center;background:var(--green-light);border-radius:var(--radius-sm);padding:14px;margin-bottom:22px;}
.qs-modal-total-label{font-size:11px;text-transform:uppercase;color:var(--muted);font-weight:600;letter-spacing:.06em;}
.qs-modal-total-value{font-family:var(--font-m);font-size:24px;font-weight:700;color:var(--green2);margin-top:4px;}
.qs-modal-actions{display:flex;gap:10px;}
.qs-session-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:10px;}
.qs-session-name{font-weight:600;font-size:15px;}
.qs-session-qty{font-family:var(--font-m);color:var(--green2);font-size:13px;margin-top:2px;}
.qs-minus{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--border);background:var(--white);font-size:20px;font-weight:700;cursor:pointer;flex-shrink:0;}
.qs-minus:hover{border-color:var(--red);color:var(--red);}
.qs-minus:disabled{opacity:.35;cursor:not-allowed;}
.qs-minus:disabled:hover{border-color:var(--border);color:inherit;}
.qs-void-hint{font-size:11px;color:var(--muted);margin:-8px 0 12px;}
@media(max-width:500px){
 .qs-grid{grid-template-columns:repeat(2,1fr);}
 .content{padding:20px 14px 130px;}
 .card{padding:16px;}
 .qs-btn{min-height:84px;}
 .qs-stepper-btn{width:48px;height:48px;font-size:24px;}
 .qs-stepper-input{width:84px;font-size:24px;}
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

// Reps can only self-void a Quick Sale within this window of recording it; after that the
// owner has to do it. Tracked purely in component memory — never persisted — alongside
// recentSaleIds, so it never touches the Sale/StateData shape.
const VOID_WINDOW_MS = 120_000;

export default function QuickSale({ data, save, rep, onLogout, onSwitchToDetailed, addAudit }: QuickSaleProps) {
  const [search, setSearch] = useState('');
  const [recentSaleIds, setRecentSaleIds] = useState<string[]>([]);
  const [saleTimestamps, setSaleTimestamps] = useState<Record<string, number>>({});
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [banner, setBanner] = useState<string>('');
  const [blockedAlert, setBlockedAlert] = useState('');
  const [qtyPanelProduct, setQtyPanelProduct] = useState<Product | null>(null);
  const [qtyValue, setQtyValue] = useState(1);
  const [qtyText, setQtyText] = useState('1');
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ticks once a second so the undo controls disable themselves the moment a sale's
  // 2-minute void window elapses, without needing another interaction to trigger it.
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const canVoid = (saleId: string) => {
    const ts = saleTimestamps[saleId];
    return ts !== undefined && nowTick - ts <= VOID_WINDOW_MS;
  };

  // Read the live rep record so an owner-applied lock takes effect immediately, same as the detailed flow.
  const liveRep = data.reps.find(r => r.id === rep.id) ?? rep;
  const lockedToday = liveRep.lockedDate === today();

  const repWarehouse: 'OWD' | 'JLY' = rep.warehouse === 'JLY' ? 'JLY' : 'OWD';
  const warehouseTag = `(${repWarehouse})`;
  const repProducts = data.products.filter(p => p.name.includes(warehouseTag));
  const displayName = (p: Product) => p.name.replace(` (${repWarehouse})`, '');

  const activeSales = data.sales.filter(s => !s.voided);
  const todaySales = activeSales.filter(s => s.date === today() && s.repId === rep.id);
  const todayCount = todaySales.length;
  const todayTotal = todaySales.reduce((sum, s) => sum + s.cashCollected, 0);

  const popularProducts = (() => {
    const totals = new Map<string, number>();
    activeSales.forEach(s => {
      if (repProducts.some(p => p.id === s.productId)) {
        totals.set(s.productId, (totals.get(s.productId) ?? 0) + s.qty);
      }
    });
    return [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([id]) => repProducts.find(p => p.id === id))
      .filter((p): p is Product => Boolean(p));
  })();

  const azProducts = [...repProducts]
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

  const buildSessionReceiptItems = (): ReceiptItem[] => {
    const items: ReceiptItem[] = [];
    sessionSales.forEach(s => {
      const name = s.productName.replace(` (${repWarehouse})`, '');
      const existing = items.find(i => i.productName === name);
      if (existing) {
        existing.qty += s.qty;
        existing.lineTotal += s.cashCollected;
        existing.unitPrice = existing.lineTotal / existing.qty;
      } else {
        items.push({ productName: name, qty: s.qty, unitPrice: s.cashCollected / s.qty, lineTotal: s.cashCollected });
      }
    });
    return items;
  };

  const handleSessionReceipt = async () => {
    const items = buildSessionReceiptItems();
    if (items.length === 0) return;
    const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
    await generateReceipt({ items, total });
  };

  const showBanner = (msg: string) => {
    setBanner(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(''), 1800);
  };

  const recordSale = (product: Product, qty: number = 1) => {
    if (lockedToday) return setBlockedAlert('Your sales day has been closed by the owner. Contact them if this is a mistake.');
    if (qty <= 0 || product.stock < qty) return;

    const price = product.sellPrice;
    const total = price * qty;
    const sale: Sale = {
      id: uid(),
      productId: product.id,
      productName: product.name,
      repId: rep.id,
      repName: rep.name,
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
    nd = addAudit(nd, 'SALE', `${rep.name} sold ${qty} × ${product.name} — collected ${fmt(total)} (expected ${fmt(total)})`, rep.name);
    save(nd);

    setRecentSaleIds(ids => [...ids, sale.id]);
    setSaleTimestamps(ts => ({ ...ts, [sale.id]: Date.now() }));
    setBlockedAlert('');
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
    if (!s || s.voided) {
      setRecentSaleIds(ids => ids.filter(id => id !== saleId));
      return;
    }
    if (!canVoid(saleId)) return; // past the 2-minute self-void window — rep can no longer undo this one

    setRecentSaleIds(ids => ids.filter(id => id !== saleId));
    const newProducts = data.products.map(p => p.id === s.productId ? { ...p, stock: p.stock + s.qty } : p);
    const newSales = data.sales.map(x => x.id === saleId ? { ...x, voided: true, voidedBy: rep.name, voidedAt: new Date().toISOString() } : x);
    let nd = { ...data, sales: newSales, products: newProducts };
    nd = addAudit(nd, 'VOID', `${rep.name} voided ${s.qty} × ${s.productName} at ${nowTime()}`, rep.name);
    save(nd);
  };

  const undoLastSale = () => {
    if (recentSaleIds.length === 0) return;
    voidSessionSale(recentSaleIds[recentSaleIds.length - 1]);
  };

  const findRemovableSaleId = (productId: string): string | undefined => {
    for (let i = recentSaleIds.length - 1; i >= 0; i--) {
      const s = data.sales.find(x => x.id === recentSaleIds[i]);
      if (s && s.productId === productId && !s.voided) return s.id;
    }
    return undefined;
  };

  const removeOneFromGroup = (productId: string) => {
    const targetId = findRemovableSaleId(productId);
    if (targetId) voidSessionSale(targetId);
  };

  const renderProductButton = (p: Product) => {
    const outOfStock = p.stock <= 0;
    const disabled = outOfStock || lockedToday;
    return (
      <div
        key={p.id}
        className={`qs-btn${outOfStock ? ' out' : ''}`}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onClick={() => { if (!disabled) recordSale(p); }}
        onKeyDown={e => {
          if (disabled) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); recordSale(p); }
        }}
      >
        <div>
          <div className="qs-name">{displayName(p)}</div>
          <div>
            <div className="qs-price">{fmt(p.sellPrice)}/box</div>
            <div className="qs-stock">{outOfStock ? 'Out of stock' : `${p.stock.toLocaleString()} left`}</div>
          </div>
        </div>
        {!disabled && (
          <button
            type="button"
            className="qs-qtybtn"
            onClick={e => { e.stopPropagation(); openQtyPanel(p); }}
          >
            📦 Choose qty
          </button>
        )}
      </div>
    );
  };

  return (
    <><style>{STYLE}</style>
    <div className="page">
      <div className="topbar">
        <div>
          <div className="topbar-logo">⚡ Quick Sale</div>
          <div className="topbar-sub">{rep.name} · {repWarehouse}</div>
        </div>
        <div className="topbar-actions">
          <button className="topbar-btn" onClick={onSwitchToDetailed}>Detailed</button>
          <button className="topbar-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="content">
        {banner && <div className="qs-banner">✓ {banner}</div>}

        {lockedToday && (
          <Alert message="🔒 Your sales day has been closed by the owner. You can view totals below but cannot record new sales." type="red" onDismiss={() => {}} />
        )}
        {blockedAlert && !lockedToday && <Alert message={blockedAlert} type="red" onDismiss={() => setBlockedAlert('')} />}
        {repProducts.length === 0 && (
          <Alert message="No products set up for your store yet. Ask the owner to add some." type="gold" onDismiss={() => {}} />
        )}

        <div className="card qs-total">
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Today</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{todayCount} sale{todayCount === 1 ? '' : 's'}</div>
          </div>
          <div className="qs-total-value">{fmt(todayTotal)}</div>
        </div>

        {sessionGroups.length > 0 && (() => {
          const lastSaleId = recentSaleIds[recentSaleIds.length - 1];
          const canUndoLast = lastSaleId !== undefined && canVoid(lastSaleId);
          return (
            <div className="card">
              <div className="card-title">🧾 Just Recorded</div>
              <div className="qs-void-hint">You can undo a sale within 2 minutes of recording it. After that, ask the owner to void it.</div>
              {sessionGroups.map(g => {
                const targetId = findRemovableSaleId(g.productId);
                const canRemove = targetId !== undefined && canVoid(targetId);
                return (
                  <div key={g.productId} className="qs-session-row">
                    <div>
                      <div className="qs-session-name">{g.productName.replace(` (${repWarehouse})`, '')}</div>
                      <div className="qs-session-qty">{g.qty} box{g.qty === 1 ? '' : 'es'}</div>
                    </div>
                    <button className="qs-minus" aria-label={`Remove one ${g.productName}`} onClick={() => removeOneFromGroup(g.productId)} disabled={!canRemove}>−</button>
                  </div>
                );
              })}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={undoLastSale} disabled={!canUndoLast}>
                  ↺ Undo Last Sale
                </button>
                <button className="btn btn-green" style={{ flex: 1 }} onClick={() => { void handleSessionReceipt(); }}>
                  🧾 Receipt
                </button>
              </div>
            </div>
          );
        })()}

        <input
          className="finput"
          placeholder="Search soap…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search products"
        />

        {!search && popularProducts.length > 0 && (
          <>
            <div className="section-title">⭐ Popular</div>
            <div className="qs-grid">{popularProducts.map(renderProductButton)}</div>
          </>
        )}

        <div className="section-title">{search ? `Results (${azProducts.length})` : 'All Products (A–Z)'}</div>
        <div className="qs-grid">
          {azProducts.length === 0 && (
            <div style={{ gridColumn: '1/-1', fontSize: 13, color: 'var(--muted)', padding: '8px 0' }}>No products match.</div>
          )}
          {azProducts.map(renderProductButton)}
        </div>
      </div>
    </div>

    {qtyPanelProduct && (
      <div className="qs-modal-backdrop" onClick={() => setQtyPanelProduct(null)}>
        <div className="qs-modal" onClick={e => e.stopPropagation()}>
          <div className="qs-modal-title">{displayName(qtyPanelProduct)}</div>
          <div className="qs-modal-sub">{fmt(qtyPanelProduct.sellPrice)}/box · {qtyPanelProduct.stock.toLocaleString()} in stock</div>

          <div className="qs-stepper">
            <button className="qs-stepper-btn" aria-label="Decrease quantity" disabled={qtyValue <= QTY_STEP} onClick={() => stepQty(-QTY_STEP)}>−</button>
            <input
              className="qs-stepper-input"
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
            <button className="qs-stepper-btn" aria-label="Increase quantity" disabled={qtyValue >= qtyPanelProduct.stock} onClick={() => stepQty(QTY_STEP)}>+</button>
          </div>

          <div className="qs-modal-total">
            <div className="qs-modal-total-label">Total</div>
            <div className="qs-modal-total-value">{fmt(qtyValue * qtyPanelProduct.sellPrice)}</div>
          </div>

          <div className="qs-modal-actions">
            <button className="btn btn-ghost btn-full btn-lg" onClick={() => setQtyPanelProduct(null)}>Cancel</button>
            <button className="btn btn-green btn-full btn-lg" onClick={confirmQtySale}>Confirm Sale</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
