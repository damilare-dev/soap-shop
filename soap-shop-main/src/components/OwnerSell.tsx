import { useState } from 'react';
import { OwnerSellProps, SalesRep } from '../types';
import Alert from './Alert';
import DetailedSale from './DetailedSale';

const OWNER_REP_ID = 'owner';
const OWNER_REP_NAME = 'Owner';

const STYLE = `
.os-stores{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:8px;}
.os-store-btn{background:var(--white);border:2.5px solid var(--border);border-radius:18px;padding:28px 20px;cursor:pointer;text-align:center;transition:all .15s;font-family:var(--font-h);font-size:22px;font-weight:700;color:var(--green);}
.os-store-btn:hover{border-color:var(--green2);transform:translateY(-2px);box-shadow:var(--shadow);}
.os-store-btn:active{transform:scale(.96);}
.os-store-btn:focus-visible{outline:3px solid var(--gold);outline-offset:2px;}
@media(max-width:500px){ .os-stores{grid-template-columns:repeat(2,1fr);} }
`;

export default function OwnerSell({ data, save, addAudit }: OwnerSellProps) {
  const [storeTag, setStoreTag] = useState<string | null>(null);

  // Stores are derived from the "(TAG)" suffix already used on every product name —
  // never hardcoded, so a newly named warehouse shows up automatically.
  const storeTags = Array.from(new Set(
    data.products
      .map(p => p.name.match(/\(([^)]+)\)$/))
      .filter((m): m is RegExpMatchArray => Boolean(m))
      .map(m => m[1])
  )).sort();

  if (!storeTag) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="card-title">💰 Sell</div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Which store are you in?</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Pick a store to start selling.</div>
        {storeTags.length === 0 ? (
          <Alert message="No products set up yet. Add products in Settings first." type="gold" onDismiss={() => {}} />
        ) : (
          <div className="os-stores">
            {storeTags.map(tag => (
              <button key={tag} className="os-store-btn" onClick={() => setStoreTag(tag)}>{tag}</button>
            ))}
          </div>
        )}
      </>
    );
  }

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
      onLogout={() => setStoreTag(null)}
      onChangeStore={() => setStoreTag(null)}
      addAudit={addAudit}
    />
  );
}
