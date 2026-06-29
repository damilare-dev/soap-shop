import { useRef, useState } from 'react';
import { OwnerQuickSaleProps, Product, Sale } from '../types';
import { uid, today, nowTime, fmt } from '../lib/utils';
import Alert from './Alert';

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
.oqs-session-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:10px;}
.oqs-session-name{font-weight:600;font-size:15px;}
.oqs-session-qty{font-family:var(--font-m);color:var(--green2);font-size:13px;margin-top:2px;}
.oqs-minus{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--border);background:var(--white);font-size:20px;font-weight:700;cursor:pointer;flex-shrink:0;}
.oqs-minus:hover{border-color:var(--red);color:var(--red);}
@media(max-width:500px){
 .oqs-grid{grid-template-columns:repeat(2,1fr);}
 .oqs-stores{grid-template-columns:repeat(2,1fr);}
}
`;

export default function OwnerQuickSale({ data, save, addAudit }: OwnerQuickSaleProps) {
  const [storeTag, setStoreTag] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [recentSaleIds, setRecentSaleIds] = useState<string[]>([]);
  const [banner, setBanner] = useState('');
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
    setSearch('');
    setRecentSaleIds([]);
    setBanner('');
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

  const recordSale = (product: Product) => {
    if (product.stock <= 0) return;

    const price = product.sellPrice;
    const sale: Sale = {
      id: uid(),
      productId: product.id,
      productName: product.name,
      repId: OWNER_REP_ID,
      repName: OWNER_REP_NAME,
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
    nd = addAudit(nd, 'SALE', `${OWNER_REP_NAME} sold 1 × ${product.name} — collected ${fmt(price)} (expected ${fmt(price)})`, OWNER_REP_NAME);
    save(nd);

    setRecentSaleIds(ids => [...ids, sale.id]);
    showBanner(`Recorded: ${displayName(product)}`);
    if (navigator.vibrate) navigator.vibrate(40);
  };

  const voidSessionSale = (saleId: string) => {
    const s = data.sales.find(x => x.id === saleId);
    setRecentSaleIds(ids => ids.filter(id => id !== saleId));
    if (!s || s.voided) return;

    const newProducts = data.products.map(p => p.id === s.productId ? { ...p, stock: p.stock + s.qty } : p);
    const newSales = data.sales.map(x => x.id === saleId ? { ...x, voided: true, voidedBy: OWNER_REP_NAME, voidedAt: new Date().toISOString() } : x);
    let nd = { ...data, sales: newSales, products: newProducts };
    nd = addAudit(nd, 'VOID', `Sale voided: ${s.qty} × ${s.productName}`, OWNER_REP_NAME);
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
        className={`oqs-btn${outOfStock ? ' out' : ''}`}
        disabled={outOfStock}
        onClick={() => recordSale(p)}
      >
        <div className="oqs-name">{displayName(p)}</div>
        <div>
          <div className="oqs-price">{fmt(p.sellPrice)}/box</div>
          <div className="oqs-stock">{outOfStock ? 'Out of stock' : `${p.stock.toLocaleString()} left`}</div>
        </div>
      </button>
    );
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="oqs-header">
        <div>
          <div className="card-title" style={{ marginBottom: 2 }}>💰 Quick Sale — {storeTag}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => changeStore(null)}>Change Store</button>
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

      {sessionGroups.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
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
    </>
  );
}
