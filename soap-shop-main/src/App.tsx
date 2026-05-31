import { useState } from "react";
import { useAppData } from "./hooks/useAppData";
import { cloudEnabled } from "./lib/supabase";
import { uid } from "./lib/utils";
import { AuditEntry, SalesRep, StateData } from "./types";
import SetupWizard from "./components/SetupWizard";
import Landing from "./components/Landing";
import PINScreen from "./components/PINScreen";
import RepLoginScreen from "./components/RepLoginScreen";
import RepApp from "./components/RepApp";
import OwnerApp from "./components/OwnerApp";

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
body{background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;}
.fullscreen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.content{padding:24px 16px 130px;max-width:620px;margin:0 auto;width:100%;}
.page{background:var(--bg);min-height:100vh;display:flex;flex-direction:column;}
.topbar{background:var(--green);color:white;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow);}
.topbar-logo{font-family:var(--font-h);font-size:19px;font-weight:700;letter-spacing:-0.3px;}
.topbar-sub{font-size:11px;opacity:.65;margin-top:2px;}
.topbar-btn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:white;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.topbar-btn:hover{background:rgba(255,255,255,.25);}
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
.finput.big{font-size:28px;font-family:var(--font-m);padding:18px;text-align:center;letter-spacing:8px;font-weight:600;background:#f9f7f3;}
.finput.err{border-color:var(--red);background:rgba(192,57,43,.05);}
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
.alert-blue{background:var(--blue-light);border-color:rgba(26,92,138,.2);color:var(--blue);}
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
.pin-display{display:flex;gap:12px;justify-content:center;margin:28px 0;}
.pin-dot{width:18px;height:18px;border-radius:50%;border:2.5px solid var(--green);background:transparent;transition:all .15s;}
.pin-dot.filled{background:var(--green);box-shadow:0 0 8px rgba(26,61,43,.3);}
.numpad{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:280px;margin:0 auto;}
.numpad-btn{background:var(--white);border:1.5px solid var(--border);border-radius:12px;height:56px;font-size:20px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;color:var(--text);}
.numpad-btn:hover{background:var(--green);color:white;border-color:var(--green);transform:translateY(-2px);box-shadow:var(--shadow);}
.numpad-btn:active{transform:translateY(0) scale(.95);}
.numpad-btn.del{color:var(--red);font-size:24px;}
.numpad-empty{background:transparent;border:none;pointer-events:none;}
.pin-card{background:var(--white);border-radius:24px;box-shadow:var(--shadow-lg);padding:28px 24px 26px;max-width:420px;width:100%;margin:0 auto 24px;}
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;z-index:2000;}
.modal-content{background:var(--white);border-radius:var(--radius) var(--radius) 0 0;padding:28px 20px 24px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;animation:slideUp .3s ease;}
@keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
.modal-close{position:absolute;top:12px;right:12px;background:transparent;border:none;font-size:24px;cursor:pointer;color:var(--muted);z-index:10;}
.modal-header{font-family:var(--font-h);font-size:20px;font-weight:700;margin-bottom:16px;color:var(--text);}
.badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px 4px 2px 0;}
.badge-green{background:var(--green-light);color:var(--green2);}
.badge-red{background:var(--red-light);color:var(--red);}
.badge-gold{background:var(--gold-light);color:var(--gold);}
.badge-blue{background:var(--blue-light);color:var(--blue);}
.badge-grey{background:#ece9e3;color:var(--muted);}
.section-title{font-family:var(--font-h);font-size:24px;font-weight:700;margin-bottom:20px;color:var(--text);}
.divider{height:1px;background:var(--border);margin:16px 0;}
.empty{text-align:center;padding:48px 16px;color:var(--muted);font-size:14px;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.row{display:flex;justify-content:space-between;align-items:center;}
.tag-deleted{opacity:.5;text-decoration:line-through;}
@media(max-width:500px){
 .two-col{grid-template-columns:1fr;}
 .prod-grid{grid-template-columns:1fr;}
 .stat-grid{grid-template-columns:1fr;}
 .content{padding:20px 14px 130px;}
 .card{padding:16px;}
 .numpad{gap:10px;}
 .numpad-btn{height:50px;font-size:18px;}
 .btn-lg{padding:13px;font-size:15px;}
}
`;

export default function App() {
  const { data, save, loading } = useAppData();
  const [role, setRole] = useState<"owner" | "rep" | null>(null);
  const [authed, setAuthed] = useState<SalesRep | null>(null);
  const [screen, setScreen] = useState<"landing" | "ownerpin" | "reppin" | "app">("landing");

  const addAudit = (currentData: StateData, action: string, detail: string, actor: string): StateData => {
    const entry: AuditEntry = {
      id: uid(),
      ts: new Date().toISOString(),
      action,
      detail,
      actor,
    };
    return { ...currentData, auditLog: [...currentData.auditLog, entry] };
  };

  const [hideOfflineBanner, setHideOfflineBanner] = useState<boolean>(() => {
    try { return localStorage.getItem('hideOfflineBanner') === '1'; } catch { return false; }
  });

  const offlineBanner = !cloudEnabled && !hideOfflineBanner ? (
    <div className="alert alert-blue" style={{ margin: "16px auto", maxWidth: 640 }}>
      <div style={{ flex: 1 }}>Cloud unavailable. Offline mode is active and changes are stored locally.</div>
      <button
        aria-label="Dismiss cloud banner"
        onClick={() => { setHideOfflineBanner(true); try { localStorage.setItem('hideOfflineBanner', '1'); } catch {} }}
        style={{ marginLeft: 12, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}
      >
        ✕
      </button>
    </div>
  ) : null;

  if (loading || !data) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="fullscreen" style={{ color: "var(--green)", fontFamily: "var(--font-b)" }}>
          <div style={{ fontSize: 40 }}>⌛</div>
          <div style={{ fontFamily: "var(--font-h)", fontSize: 18, marginTop: 12 }}>Loading Soap Stock Audit</div>
        </div>
      </>
    );
  }

  const handleLogout = () => {
    setRole(null);
    setAuthed(null);
    setScreen("landing");
  };

  if (!data.ownerPin) {
    return (
      <>
        <style>{STYLE}</style>
        {offlineBanner}
        <SetupWizard onComplete={(pin, reps) => {
          // Initialize a clean app state on first setup: keep owner PIN and reps,
          // but clear any pre-existing sales/deliveries/audit entries so counts start at zero.
          save({ ownerPin: pin, maxDiscountPct: data.maxDiscountPct ?? 15, reps, products: data.products ?? [], deliveries: [], sales: [], auditLog: [] });
        }} />
      </>
    );
  }

  if (screen === "landing") {
    return (
      <>
        <style>{STYLE}</style>
        {offlineBanner}
        <Landing onOwner={() => setScreen("ownerpin")} onRep={() => setScreen("reppin")} />
      </>
    );
  }

  if (screen === "ownerpin") {
    return (
      <>
        <style>{STYLE}</style>
        {offlineBanner}
        <PINScreen
          title="Owner Login"
          subtitle="Enter your 4-digit PIN"
          pin={data.ownerPin}
          onSuccess={() => { setRole("owner"); setAuthed(null); setScreen("app"); }}
          onBack={() => setScreen("landing")}
        />
      </>
    );
  }

  if (screen === "reppin") {
    return (
      <>
        <style>{STYLE}</style>
        {offlineBanner}
        <RepLoginScreen
          reps={data.reps}
          onSuccess={(rep) => { setRole("rep"); setAuthed(rep); setScreen("app"); }}
          onBack={() => setScreen("landing")}
        />
      </>
    );
  }

  if (role === "owner") {
    return (
      <>
        <style>{STYLE}</style>
        {offlineBanner}
        <OwnerApp data={data} save={save} onLogout={handleLogout} addAudit={addAudit} />
      </>
    );
  }

  if (role === "rep" && authed) {
    return (
      <>
        <style>{STYLE}</style>
        {offlineBanner}
        <RepApp data={data} save={save} rep={authed} onLogout={handleLogout} addAudit={addAudit} />
      </>
    );
  }

  return null;
}
