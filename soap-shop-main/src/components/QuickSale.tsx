import { useRef, useState } from 'react';
import { Product, QuickSaleProps, Sale } from '../types';
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
.qs-session-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:10px;}
.qs-session-name{font-weight:600;font-size:15px;}
.qs-session-qty{font-family:var(--font-m);color:var(--green2);font-size:13px;margin-top:2px;}
.qs-minus{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--border);background:var(--white);font-size:20px;font-weight:700;cursor:pointer;flex-shrink:0;}
.qs-minus:hover{border-color:var(--red);color:var(--red);}
@media(max-width:500px){
 .qs-grid{grid-template-columns:repeat(2,1fr);}
 .content{padding:20px 14px 130px;}
 .card{padding:16px;}
 .qs-btn{min-height:84px;}
}
`;

export default function QuickSale({ data, save, rep, onLogout, onSwitchToDetailed, addAudit }: QuickSaleProps) {
  const [search, setSearch] = useState('');
  const [recentSaleIds, setRecentSaleIds] = useState<string[]>([]);
  const [banner, setBanner] = useState<string>('');
  const [blockedAlert, setBlockedAlert] = useState('');
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const showBanner = (msg: string) => {
    setBanner(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(''), 1800);
  };

  const recordSale = (product: Product) => {
    if (lockedToday) return setBlockedAlert('Your sales day has been closed by the owner. Contact them if this is a mistake.');
    if (product.stock <= 0) return;

    const price = product.sellPrice;
    const sale: Sale = {
      id: uid(),
      productId: product.id,
      productName: product.name,
      repId: rep.id,
      repName: rep.name,
      qty: 1,
      pricePerBox: price,
      standardPrice: price,
      expectedCash: price,
      cashCollected: price,
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
      products: data.products.map(p => p.id === product.id ? { ...p, stock: p.stock - 1 } : p),
      sales: [...data.sales, sale],
    };
    nd = addAudit(nd, 'SALE', `${rep.name} sold 1 × ${product.name} — collected ${fmt(price)} (expected ${fmt(price)})`, rep.name);
    save(nd);

    setRecentSaleIds(ids => [...ids, sale.id]);
    setBlockedAlert('');
    showBanner(`Recorded: ${displayName(product)}`);
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const voidSessionSale = (saleId: string) => {
    const s = data.sales.find(x => x.id === saleId);
    setRecentSaleIds(ids => ids.filter(id => id !== saleId));
    if (!s || s.voided) return;

    const newProducts = data.products.map(p => p.id === s.productId ? { ...p, stock: p.stock + s.qty } : p);
    const newSales = data.sales.map(x => x.id === saleId ? { ...x, voided: true, voidedBy: rep.name, voidedAt: new Date().toISOString() } : x);
    let nd = { ...data, sales: newSales, products: newProducts };
    nd = addAudit(nd, 'VOID', `Sale voided: ${s.qty} × ${s.productName}`, rep.name);
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
      <button
        key={p.id}
        className={`qs-btn${outOfStock ? ' out' : ''}`}
        disabled={outOfStock || lockedToday}
        onClick={() => recordSale(p)}
      >
        <div className="qs-name">{displayName(p)}</div>
        <div>
          <div className="qs-price">{fmt(p.sellPrice)}/box</div>
          <div className="qs-stock">{outOfStock ? 'Out of stock' : `${p.stock.toLocaleString()} left`}</div>
        </div>
      </button>
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

        {sessionGroups.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-title">🧾 Just Recorded</div>
            {sessionGroups.map(g => (
              <div key={g.productId} className="qs-session-row">
                <div>
                  <div className="qs-session-name">{g.productName.replace(` (${repWarehouse})`, '')}</div>
                  <div className="qs-session-qty">{g.qty} box{g.qty === 1 ? '' : 'es'}</div>
                </div>
                <button className="qs-minus" aria-label={`Remove one ${g.productName}`} onClick={() => removeOneFromGroup(g.productId)}>−</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-full" style={{ marginTop: 14 }} onClick={undoLastSale}>
              ↺ Undo Last Sale
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
