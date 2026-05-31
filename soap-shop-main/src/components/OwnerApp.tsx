import { useState } from 'react';
import { OwnerAppProps } from '../types';
import OwnerHome from './owner/OwnerHome';
import OwnerDelivery from './owner/OwnerDelivery';
import OwnerSales from './owner/OwnerSales';
import OwnerReport from './owner/OwnerReport';
import OwnerSettings from './owner/OwnerSettings';
import OwnerAudit from './owner/OwnerAudit';

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
.topbar-btn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:white;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.topbar-btn:hover{background:rgba(255,255,255,.25);}
.content{padding:24px 16px 130px;max-width:620px;margin:0 auto;width:100%;}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;background:var(--white);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:8px 0;z-index:1000;}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-top:3px solid transparent;font-size:12px;font-weight:600;color:var(--muted);cursor:pointer;transition:all .2s;}
.nav-item.active{color:var(--green);border-top-color:var(--green);}
.nav-icon{font-size:24px;}
.card{background:var(--white);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);margin-bottom:16px;border:1px solid var(--border);}
.card-title{font-family:var(--font-h);font-size:16px;font-weight:600;color:var(--green);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px;}
.stat-card{background:var(--white);border-radius:var(--radius);padding:16px 18px;border:1px solid var(--border);position:relative;overflow:hidden;}
.stat-accent{position:absolute;left:0;top:0;bottom:0;width:4px;}
.stat-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:8px;}
.stat-value{font-family:var(--font-m);font-size:19px;font-weight:600;line-height:1.2;}
.stat-sub{font-size:11px;color:var(--muted);margin-top:6px;}
.section-title{font-family:var(--font-h);font-size:24px;font-weight:700;margin-bottom:20px;color:var(--text);}
.divider{height:1px;background:var(--border);margin:16px 0;}
.empty{text-align:center;padding:48px 16px;color:var(--muted);font-size:14px;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.row{display:flex;justify-content:space-between;align-items:center;}
.tag-deleted{opacity:.5;text-decoration:line-through;}
.fg{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.flabel{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;}
.finput,.fselect{background:#f9f7f3;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;font-family:var(--font-b);font-size:15px;transition:all .2s;width:100%;}
.finput:focus,.fselect:focus{outline:none;border-color:var(--green);background:white;box-shadow:0 0 0 3px rgba(26,61,43,.1);}
.btn{padding:12px 22px;border-radius:var(--radius-sm);font-family:var(--font-b);font-size:15px;font-weight:600;border:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
.btn:active{transform:scale(.97);}
.btn-green{background:var(--green);color:white;}
.btn-green:hover{background:var(--green2);transform:translateY(-2px);box-shadow:var(--shadow-lg);}
.btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--text);}
.btn-ghost:hover{border-color:var(--green);color:var(--green);background:rgba(26,61,43,.02);}
.btn-red{background:var(--red-light);border:1px solid rgba(192,57,43,.25);color:var(--red);}
.btn-red:hover{background:#f9e0de;}
.btn-full{width:100%;}
.btn-lg{padding:15px;font-size:16px;border-radius:10px;}
.btn-sm{padding:8px 12px;font-size:12px;border-radius:6px;}
.btn:disabled{opacity:.5;cursor:not-allowed;}
.alert{padding:14px 16px;border-radius:var(--radius-sm);font-size:13.5px;display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;border:1px solid;}
.alert-red{background:var(--red-light);border-color:rgba(192,57,43,.2);color:var(--red);}
.alert-gold{background:var(--gold-light);border-color:rgba(181,134,13,.25);color:#7a5c00;}
.alert-green{background:var(--green-light);border-color:rgba(45,106,79,.2);color:var(--green2);}
.badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px 4px 2px 0;}
.badge-green{background:var(--green-light);color:var(--green2);}
.badge-red{background:var(--red-light);color:var(--red);}
.badge-gold{background:var(--gold-light);color:var(--gold);}
.badge-grey{background:#ece9e3;color:var(--muted);}
.bar-bg{height:6px;border-radius:3px;background:#e8e3da;overflow:hidden;margin-top:6px;}
.bar-fill{height:100%;border-radius:3px;transition:width .5s ease;}
@media(max-width:500px){
 .two-col{grid-template-columns:1fr;}
 .stat-grid{grid-template-columns:1fr;}
 .content{padding:20px 14px 130px;}
 .card{padding:16px;}
}
`;

export default function OwnerApp({ data, save, onLogout, addAudit }: OwnerAppProps) {
  const [tab, setTab] = useState<"home" | "delivery" | "sales" | "report" | "audit" | "settings">("home");
  const TABS: Array<{ id: "home" | "delivery" | "sales" | "report" | "audit" | "settings"; icon: string; label: string }> = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "delivery", icon: "📦", label: "Delivery" },
    { id: "sales", icon: "📊", label: "Sales" },
    { id: "report", icon: "📈", label: "Report" },
    { id: "audit", icon: "🛡", label: "Audit" },
    { id: "settings", icon: "⚙", label: "Settings" },
  ];

  return (
    <><style>{STYLE}</style>
    <div className="page">
      <div className="topbar">
        <div><div className="topbar-logo">📦 SoapStock — Owner</div></div>
        <button className="topbar-btn" onClick={onLogout}>Logout</button>
      </div>

      <div className="content">
        {tab === "home" && <OwnerHome data={data} />}
        {tab === "delivery" && <OwnerDelivery data={data} save={save} addAudit={addAudit} />}
        {tab === "sales" && <OwnerSales data={data} save={save} addAudit={addAudit} />}
        {tab === "report" && <OwnerReport data={data} />}
        {tab === "audit" && <OwnerAudit data={data} />}
        {tab === "settings" && <OwnerSettings data={data} save={save} addAudit={addAudit} />}
      </div>

      <nav className="bottom-nav">
        {TABS.map(t => (
          <button key={t.id} className={`nav-item${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            <span className="nav-icon">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </div>
    </>
  );
}
