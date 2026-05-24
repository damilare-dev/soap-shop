import { useState, useEffect, useCallback, ChangeEvent } from "react";
import { cloudEnabled, loadRemoteData, saveRemoteData } from "./cloud";

type Product = {
 id: string;
 name: string;
 schedule: string;
 expectedQty: number;
 costPrice: number;
 sellPrice: number;
 stock: number;
};

type SalesRep = {
 id: string;
 name: string;
 pin: string;
};

type Delivery = {
 id: string;
 productId: string;
 qty: number;
 costPerBox: number;
 date: string;
 supplier: string;
};

type Sale = {
 id: string;
 productId: string;
 productName: string;
 repId: string;
 repName: string;
 qty: number;
 pricePerBox: number;
 expectedCash: number;
 cashCollected: number;
 discrepancy: number;
 note: string;
 date: string;
 time: string;
 voided: boolean;
 edited: boolean;
 voidedBy?: string;
 voidedAt?: string;
};

type AuditEntry = {
 id: string;
 ts: string;
 action: string;
 detail: string;
 actor: string;
};

type StateData = {
 ownerPin: string | null;
 reps: SalesRep[];
 products: Product[];
 deliveries: Delivery[];
 sales: Sale[];
 auditLog: AuditEntry[];
};

type AlertProps = {
 message: string;
 type?: string;
 onDismiss?: () => void;
};

type SetupWizardProps = {
 onComplete: (pin: string, reps: SalesRep[]) => void;
};

type LandingProps = {
 onOwner: () => void;
 onRep: () => void;
};

type PINScreenProps = {
 title: string;
 subtitle: string;
 pin: string;
 onSuccess: () => void;
 onBack: () => void;
};

type RepLoginScreenProps = {
 reps: SalesRep[];
 onSuccess: (rep: SalesRep) => void;
 onBack: () => void;
};

type RepAppProps = {
 data: StateData;
 save: (next: StateData) => Promise<void>;
 rep: SalesRep;
 onLogout: () => void;
 addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

type OwnerAppProps = {
 data: StateData;
 save: (next: StateData) => Promise<void>;
 onLogout: () => void;
 addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

type OwnerDeliveryProps = {
 data: StateData;
 save: (next: StateData) => Promise<void>;
 addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

type OwnerSalesProps = {
 data: StateData;
 save: (next: StateData) => Promise<void>;
 addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

type OwnerReportProps = {
 data: StateData;
};

type OwnerSettingsProps = {
 data: StateData;
 save: (next: StateData) => Promise<void>;
 addAudit: (currentData: StateData, action: string, detail: string, actor: string) => StateData;
};

declare global {
 interface Window {
 storage?: {
 get(key: string): Promise<{ value: string } | null>;
 set(key: string, value: string): Promise<void>;
 };
 }
}

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
/* ── Layout ── */
.fullscreen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.content{padding:24px 16px 130px;max-width:620px;margin:0 auto;width:100%;}
.page{background:var(--bg);min-height:100vh;display:flex;flex-direction:column;}
/* ── Topbar ── */
.topbar{background:var(--green);color:white;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;box-shadow:var(--shadow);}
.topbar-logo{font-family:var(--font-h);font-size:19px;font-weight:700;letter-spacing:-0.3px;}
.topbar-sub{font-size:11px;opacity:.65;margin-top:2px;}
.topbar-btn{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);color:white;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;}
.topbar-btn:hover{background:rgba(255,255,255,.25);}
/* ── Bottom Nav ── */
.bottom-nav{position:fixed;bottom:0;left:0;right:0;background:var(--white);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:8px 0;z-index:1000;}
.nav-item{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-top:3px solid transparent;font-size:12px;font-weight:600;color:var(--muted);cursor:pointer;transition:all .2s;}
.nav-item.active{color:var(--green);border-top-color:var(--green);}
.nav-icon{font-size:24px;}
/* ── Cards ── */
.card{background:var(--white);border-radius:var(--radius);padding:20px;box-shadow:var(--shadow);margin-bottom:16px;border:1px solid var(--border);}
.card-title{font-family:var(--font-h);font-size:16px;font-weight:600;color:var(--green);margin-bottom:16px;display:flex;align-items:center;gap:8px;}
/* ── Stats ── */
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:16px;}
.stat-card{background:var(--white);border-radius:var(--radius);padding:16px 18px;border:1px solid var(--border);position:relative;overflow:hidden;}
.stat-accent{position:absolute;left:0;top:0;bottom:0;width:4px;}
.stat-label{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:8px;}
.stat-value{font-family:var(--font-m);font-size:19px;font-weight:600;line-height:1.2;}
.stat-sub{font-size:11px;color:var(--muted);margin-top:6px;}
/* ── Forms ── */
.fg{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.flabel{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;}
.finput,.fselect{background:#f9f7f3;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;font-family:var(--font-b);font-size:15px;transition:all .2s;width:100%;}
.finput:focus,.fselect:focus{outline:none;border-color:var(--green);background:white;box-shadow:0 0 0 3px rgba(26,61,43,.1);}
.finput.big{font-size:28px;font-family:var(--font-m);padding:18px;text-align:center;letter-spacing:8px;font-weight:600;background:#f9f7f3;}
.finput.err{border-color:var(--red);background:rgba(192,57,43,.05);}
/* ── Buttons ── */
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
/* ── Alerts ── */
.alert{padding:14px 16px;border-radius:var(--radius-sm);font-size:13.5px;display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;border:1px solid;}
.alert-red{background:var(--red-light);border-color:rgba(192,57,43,.2);color:var(--red);}
.alert-gold{background:var(--gold-light);border-color:rgba(181,134,13,.25);color:#7a5c00;}
.alert-green{background:var(--green-light);border-color:rgba(45,106,79,.2);color:var(--green2);}
.alert-blue{background:var(--blue-light);border-color:rgba(26,92,138,.2);color:var(--blue);}
/* ── Products grid ── */
.prod-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;}
.prod-card{background:var(--white);border:2px solid var(--border);border-radius:var(--radius);padding:14px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.prod-card:hover{border-color:var(--green2);transform:translateY(-2px);box-shadow:var(--shadow);}
.prod-card.selected{border-color:var(--green);background:var(--green-light);}
.prod-card.disabled{opacity:.45;cursor:not-allowed;}
.prod-name{font-family:var(--font-h);font-size:14px;font-weight:600;color:var(--text);margin-bottom:4px;}
.prod-price{font-family:var(--font-m);font-size:13px;color:var(--green2);font-weight:600;}
.prod-stock{font-size:11px;color:var(--muted);margin-top:4px;}
/* ── Bar ── */
.bar-bg{height:6px;border-radius:3px;background:#e8e3da;overflow:hidden;margin-top:6px;}
.bar-fill{height:100%;border-radius:3px;transition:width .5s ease;}
/* ── PIN Display ── */
.pin-display{display:flex;gap:12px;justify-content:center;margin:28px 0;}
.pin-dot{width:18px;height:18px;border-radius:50%;border:2.5px solid var(--green);background:transparent;transition:all .15s;}
.pin-dot.filled{background:var(--green);box-shadow:0 0 8px rgba(26,61,43,.3);}
/* ── Numpad ── */
.numpad{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:280px;margin:0 auto;}
.numpad-btn{background:var(--white);border:1.5px solid var(--border);border-radius:12px;height:56px;font-size:20px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;color:var(--text);}
.numpad-btn:hover{background:var(--green);color:white;border-color:var(--green);transform:translateY(-2px);box-shadow:var(--shadow);}
.numpad-btn:active{transform:translateY(0) scale(.95);}
.numpad-btn.del{color:var(--red);font-size:24px;}
.numpad-empty{background:transparent;border:none;pointer-events:none;}
.pin-card{background:var(--white);border-radius:24px;box-shadow:var(--shadow-lg);padding:28px 24px 26px;max-width:420px;width:100%;margin:0 auto 24px;}
.pin-header{padding:0 8px;}
/* ── Modal ── */
.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;z-index:2000;}
.modal-content{background:var(--white);border-radius:var(--radius) var(--radius) 0 0;padding:28px 20px 24px;width:100%;max-width:600px;max-height:90vh;overflow-y:auto;animation:slideUp .3s ease;}
@keyframes slideUp{from{transform:translateY(100%);opacity:0;}to{transform:translateY(0);opacity:1;}}
.modal-close{position:absolute;top:12px;right:12px;background:transparent;border:none;font-size:24px;cursor:pointer;color:var(--muted);z-index:10;}
.modal-header{font-family:var(--font-h);font-size:20px;font-weight:700;margin-bottom:16px;color:var(--text);}
/* ── Badges ── */
.badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:2px 4px 2px 0;}
.badge-green{background:var(--green-light);color:var(--green2);}
.badge-red{background:var(--red-light);color:var(--red);}
.badge-gold{background:var(--gold-light);color:var(--gold);}
.badge-grey{background:#ece9e3;color:var(--muted);}
/* ── Misc ── */
.section-title{font-family:var(--font-h);font-size:24px;font-weight:700;margin-bottom:20px;color:var(--text);}
.divider{height:1px;background:var(--border);margin:16px 0;}
.empty{text-align:center;padding:48px 16px;color:var(--muted);font-size:14px;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.row{display:flex;justify-content:space-between;align-items:center;}
.tag-deleted{opacity:.5;text-decoration:line-through;}
/* ── Setup wizard ── */
.setup-step{background:var(--white);border-radius:18px;padding:32px 28px;box-shadow:var(--shadow-lg);}
.setup-number{background:var(--green);color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;margin-bottom:20px;}
/* ── Responsive ── */
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

const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const nowTime = () => new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
const fmt = (n: number | string | null | undefined) => `₦${Number(n || 0).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtD = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
const STORAGE_KEY = "soapstock_v4";

const DEFAULT_PRODUCTS: Product[] = [
 { id: "p1", name: "Sunlight Soap", schedule: "biweekly", expectedQty: 2200, costPrice: 850, sellPrice: 1200, stock: 500 },
 { id: "p2", name: "Premier Soap", schedule: "monthly", expectedQty: 700, costPrice: 600, sellPrice: 950, stock: 300 },
 { id: "p3", name: "Key Soap", schedule: "monthly", expectedQty: 650, costPrice: 700, sellPrice: 1100, stock: 250 },
 { id: "p4", name: "Morning Fresh", schedule: "monthly", expectedQty: 650, costPrice: 650, sellPrice: 1050, stock: 280 },
];

const FRESH_STATE: StateData = {
 ownerPin: null,
 reps: [],
 products: DEFAULT_PRODUCTS,
 deliveries: [],
 sales: [],
 auditLog: [],
};

function useStore() {
 const [data, setData] = useState<StateData | null>(null);
 const [loaded, setLoaded] = useState(false);
 useEffect(() => {
 (async () => {
 try {
 const stored = window.storage?.get ? await window.storage.get(STORAGE_KEY) : null;
 let raw = stored?.value ?? (typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null);
 if (!raw && cloudEnabled) {
 const remote = await loadRemoteData();
 raw = remote ?? raw;
 }
 setData(raw ? JSON.parse(raw) : FRESH_STATE);
 } catch {
 setData(FRESH_STATE);
 }
 setLoaded(true);
 })();
 }, []);
 const save = useCallback(async (next: StateData) => {
 setData(next);
 try {
 if (window.storage?.set) await window.storage.set(STORAGE_KEY, JSON.stringify(next));
 } catch {}
 try {
 if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
 } catch {}
 if (cloudEnabled) {
 try {
 await saveRemoteData(JSON.stringify(next));
 } catch {}
 }
 }, []);
 const addAudit = useCallback((currentData: StateData, action: string, detail: string, actor: string): StateData => {
 const entry: AuditEntry = { id: uid(), ts: new Date().toISOString(), action, detail, actor };
 return { ...currentData, auditLog: [...currentData.auditLog, entry] };
 }, []);
 return { data, save, loaded, addAudit };
}

function Alert({ message, type = "blue", onDismiss }: AlertProps) {
 return (
 <div className={`alert alert-${type}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <span>{message}</span>
 {onDismiss && <button className="btn btn-sm" style={{ background: "transparent", border: "none", padding: "4px 8px", fontSize: "18px", color: "inherit" }} onClick={onDismiss}>✕</button>}
 </div>
 );
}

export default function App() {
 const { data, save, loaded, addAudit } = useStore();
 const [role, setRole] = useState<"owner" | "rep" | null>(null);
 const [authed, setAuthed] = useState<SalesRep | null>(null);
 const [screen, setScreen] = useState<"landing" | "ownerpin" | "reppin" | "app">("landing");

 if (!loaded || !data) return (
 <><style>{STYLE}</style>
 <div className="fullscreen" style={{ color: "var(--green)", fontFamily: "var(--font-b)" }}>
 <div style={{ fontSize: 40 }}>📦</div>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 18, marginTop: 12 }}>Loading SoapStock…</div>
 </div>
 </>
 );

 if (!data.ownerPin) {
 return <SetupWizard onComplete={(pin, reps) => {
 const newData = addAudit({ ...data, ownerPin: pin, reps }, "SETUP", "App initialized", "SYSTEM");
 save(newData);
 }} />;
 }

 if (screen === "landing") return <Landing onOwner={() => setScreen("ownerpin")} onRep={() => setScreen("reppin")} />;
 if (screen === "ownerpin") return <PINScreen title="Owner Login" subtitle="Enter your 4-digit PIN" pin={data.ownerPin} onSuccess={() => { setRole("owner"); setAuthed(null); setScreen("app"); }} onBack={() => setScreen("landing")} />;
 if (screen === "reppin") return <RepLoginScreen reps={data.reps} onSuccess={(rep) => { setRole("rep"); setAuthed(rep); setScreen("app"); }} onBack={() => setScreen("landing")} />;

 const logout = () => { setRole(null); setAuthed(null); setScreen("landing"); };
 if (role === "owner") return <OwnerApp data={data} save={save} onLogout={logout} addAudit={addAudit} />;
 if (role === "rep" && authed) return <RepApp data={data} save={save} rep={authed} onLogout={logout} addAudit={addAudit} />;

 return null;
}

function SetupWizard({ onComplete }: SetupWizardProps) {
 const [step, setStep] = useState<number>(1);
 const [pin, setPin] = useState<string>("");
 const [pin2, setPin2] = useState<string>("");
 const [err, setErr] = useState<string>("");
 const [reps, setReps] = useState<SalesRep[]>([]);
 const [repName, setRepName] = useState<string>("");
 const [repPin, setRepPin] = useState<string>("");
 const [repPin2, setRepPin2] = useState<string>("");
 const [repErr, setRepErr] = useState<string>("");

 const addRep = () => {
 if (!repName.trim()) return setRepErr("Enter a name.");
 if (!/^\d{4}$/.test(repPin)) return setRepErr("PIN must be exactly 4 digits.");
 if (repPin !== repPin2) return setRepErr("PINs don't match.");
 setReps(r => [...r, { id: uid(), name: repName.trim(), pin: repPin }]);
 setRepName(""); setRepPin(""); setRepPin2(""); setRepErr("");
 };

 const finish = () => {
 if (step === 1) {
 if (!/^\d{4}$/.test(pin)) return setErr("PIN must be exactly 4 digits.");
 if (pin !== pin2) return setErr("The two PINs don't match.");
 setErr(""); setStep(2);
 } else {
 if (reps.length === 0) return setRepErr("Please add at least one sales rep.");
 onComplete(pin, reps);
 }
 };

 return (
 <><style>{STYLE}</style>
 <div className="fullscreen" style={{ gap: 0, background: "var(--bg)", padding: "20px" }}>
 <div style={{ textAlign: "center", marginBottom: 32 }}>
 <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 28, fontWeight: 700, color: "var(--green)" }}>SoapStock Setup</div>
 <div style={{ color: "var(--muted)", marginTop: 6, fontSize: 14 }}>Let's get your business ready</div>
 </div>

 <div className="setup-step" style={{ maxWidth: 480, margin: "0 auto" }}>
 <div className="setup-number">{step}</div>
 {step === 1 ? (
 <>
 <div style={{ textAlign: "center", marginBottom: 20 }}>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 18, fontWeight: 600, color: "var(--green)" }}>Your Admin PIN</div>
 <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>4-digit PIN for owner access</div>
 </div>
 <div className="fg">
 <label className="flabel">New PIN</label>
 <input className={`finput big${err ? " err" : ""}`} type="password" inputMode="numeric" maxLength={4} value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setErr(""); }} />
 </div>
 <div className="fg">
 <label className="flabel">Confirm PIN</label>
 <input className={`finput big${err ? " err" : ""}`} type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={e => { setPin2(e.target.value.replace(/\D/g, "")); setErr(""); }} />
 </div>
 {err && <Alert message={err} type="red" />}
 <button className="btn btn-green btn-full btn-lg" onClick={finish} style={{ marginTop: 8 }}>Next → Add Sales Reps</button>
 </>
 ) : (
 <>
 <div style={{ textAlign: "center", marginBottom: 20 }}>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 18, fontWeight: 600, color: "var(--green)" }}>Sales Reps</div>
 <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Each rep gets their own PIN</div>
 </div>
 {reps.map(r => (
 <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
 <span style={{ fontWeight: 600 }}>{r.name}</span>
 <button className="btn btn-red btn-sm" onClick={() => setReps(rs => rs.filter(x => x.id !== r.id))}>Remove</button>
 </div>
 ))}
 <div className="fg" style={{ marginTop: 12 }}>
 <label className="flabel">Rep Name</label>
 <input className="finput" value={repName} onChange={e => { setRepName(e.target.value); setRepErr(""); }} placeholder="E.g., John" />
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
 {repErr && <Alert message={repErr} type="red" />}
 <button className="btn btn-ghost btn-full" style={{ marginBottom: 10 }} onClick={addRep}>+ Add Another Rep</button>
 <button className="btn btn-green btn-full btn-lg" onClick={finish} disabled={reps.length === 0}>✓ Finish Setup</button>
 </>
 )}
 </div>
 </div>
 </>
 );
}

function Landing({ onOwner, onRep }: LandingProps) {
 return (
 <><style>{STYLE}</style>
 <div className="fullscreen" style={{ gap: 28 }}>
 <div style={{ textAlign: "center" }}>
 <div style={{ fontSize: 64, marginBottom: 12 }}>📦</div>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 32, fontWeight: 700, color: "var(--green)" }}>SoapStock</div>
 <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>Who are you today?</div>
 </div>
 <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", maxWidth: 340 }}>
 <button onClick={onOwner} style={{ flex: "1 1 140px", background: "var(--green)", color: "white", border: "none", borderRadius: 14, padding: "24px 20px", textAlign: "center", cursor: "pointer", transition: "all .3s", fontSize: 14 }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
 <div style={{ fontSize: 44, marginBottom: 8 }}>👤</div>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 17, fontWeight: 700 }}>Owner</div>
 <div style={{ fontSize: 12, opacity: .75, marginTop: 4 }}>Full access</div>
 </button>
 <button onClick={onRep} style={{ flex: "1 1 140px", background: "var(--white)", color: "var(--text)", border: "2px solid var(--border)", borderRadius: 14, padding: "24px 20px", textAlign: "center", cursor: "pointer", transition: "all .3s", fontSize: 14 }} onMouseOver={e => { e.currentTarget.style.borderColor = "var(--green)"; e.currentTarget.style.transform = "translateY(-4px)"; }} onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}>
 <div style={{ fontSize: 44, marginBottom: 8 }}>👨‍💼</div>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 17, fontWeight: 700 }}>Sales Rep</div>
 <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Record sales</div>
 </button>
 </div>
 </div>
 </>
 );
}

function PINScreen({ title, subtitle, pin, onSuccess, onBack }: PINScreenProps) {
 const [entered, setEntered] = useState<string>("");
 const [error, setError] = useState<boolean>(false);
 const [attempts, setAttempts] = useState<number>(0);
 const [locked, setLocked] = useState<boolean>(false);

 const press = (d: string) => {
 if (locked || entered.length >= 4) return;
 const next = entered + d;
 setEntered(next);
 setError(false);
 if (next.length === 4) {
 if (next === pin) { setTimeout(onSuccess, 200); }
 else {
 setTimeout(() => {
 setEntered("");
 setError(true);
 const a = attempts + 1;
 setAttempts(a);
 if (a >= 5) { setLocked(true); setTimeout(() => { setLocked(false); setAttempts(0); }, 30000); }
 }, 200);
 }
 }
 };

 const del = () => { setEntered(e => e.slice(0, -1)); setError(false); };

 return (
 <div><style>{STYLE}</style>
 <div className="fullscreen" style={{ gap: 0, justifyContent: "flex-start", paddingTop: 28 }}>
 <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginLeft: 16 }} onClick={onBack}>← Back</button>
 <div className="pin-card">
 <div className="pin-header" style={{ textAlign: "center", marginBottom: 24 }}>
 <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 24, fontWeight: 700, color: "var(--green)" }}>{title}</div>
 <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>{subtitle}</div>
 </div>

 <div className="pin-display">
 {[0,1,2,3].map(i => <div key={i} className={`pin-dot${entered.length > i ? " filled" : ""}`}></div>)}
 </div>

 {error && <Alert message={locked ? "Too many attempts. Wait 30 seconds." : `Wrong PIN. ${5 - attempts} attempt${5 - attempts === 1 ? "" : "s"} left`} type="red" />}

 {!locked && (
 <div className="numpad">
 {[1,2,3,4,5,6,7,8,9].map(n => (
 <button key={n} className="numpad-btn" onClick={() => press(String(n))}>{n}</button>
 ))}
 <div className="numpad-empty" />
 <button className="numpad-btn" onClick={() => press("0")}>0</button>
 <button className="numpad-btn del" onClick={del}>⌫</button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

function RepLoginScreen({ reps, onSuccess, onBack }: RepLoginScreenProps) {
 const [chosen, setChosen] = useState<SalesRep | null>(null);
 const [entered, setEntered] = useState<string>("");
 const [error, setError] = useState<boolean>(false);
 const [attempts, setAttempts] = useState<number>(0);
 const [locked, setLocked] = useState<boolean>(false);

 if (!chosen) return (
 <div><style>{STYLE}</style>
 <div className="fullscreen" style={{ gap: 0, justifyContent: "flex-start", paddingTop: 28 }}>
 <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginLeft: 16 }} onClick={onBack}>← Back</button>
 <div className="pin-card">
 <div className="pin-header" style={{ textAlign: "center", marginBottom: 24 }}>
 <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 24, fontWeight: 700, color: "var(--green)" }}>Select Rep</div>
 <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>Tap your name</div>
 </div>
 <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 12, margin: "0 auto" }}>
 {reps.map(r => (
 <button key={r.id} onClick={() => setChosen(r)} style={{ background: "var(--white)", border: "2px solid var(--border)", borderRadius: 18, padding: "16px 14px", textAlign: "left", cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 12, width: "100%" }} onMouseOver={e => e.currentTarget.style.borderColor = "var(--green)"} onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
 <span style={{ fontSize: 28 }}>👤</span>
 <span style={{ fontFamily: "var(--font-h)", fontSize: 17, fontWeight: 600, color: "var(--text)" }}>{r.name}</span>
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>
 );

 const press = (d: string) => {
 if (locked || entered.length >= 4) return;
 const next = entered + d;
 setEntered(next);
 setError(false);
 if (next.length === 4) {
 if (next === chosen.pin) { setTimeout(() => onSuccess(chosen), 200); }
 else {
 setTimeout(() => {
 setEntered("");
 setError(true);
 const a = attempts + 1;
 setAttempts(a);
 if (a >= 5) { setLocked(true); setTimeout(() => { setLocked(false); setAttempts(0); }, 30000); }
 }, 200);
 }
 }
 };

 const del = () => { setEntered(e => e.slice(0,-1)); setError(false); };

 return (
 <div><style>{STYLE}</style>
 <div className="fullscreen" style={{ gap: 0, justifyContent: "flex-start", paddingTop: 28 }}>
 <button className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start", marginLeft: 16 }} onClick={() => setChosen(null)}>← Back</button>
 <div className="pin-card">
 <div className="pin-header" style={{ textAlign: "center", marginBottom: 24 }}>
 <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
 <div style={{ fontFamily: "var(--font-h)", fontSize: 24, fontWeight: 700, color: "var(--green)" }}>Enter PIN for {chosen.name}</div>
 <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>4-digit PIN</div>
 </div>

 <div className="pin-display">
 {[0,1,2,3].map(i => <div key={i} className={`pin-dot${entered.length > i ? " filled" : ""}`}></div>)}
 </div>

 {error && <Alert message={locked ? "Too many attempts. Wait 30 seconds." : `Wrong PIN. ${5 - attempts} attempt${5 - attempts === 1 ? "" : "s"} left`} type="red" />}

 {!locked && (
 <div className="numpad">
 {[1,2,3,4,5,6,7,8,9].map(n => (
 <button key={n} className="numpad-btn" onClick={() => press(String(n))}>{n}</button>
 ))}
 <div className="numpad-empty" />
 <button className="numpad-btn" onClick={() => press("0")}>0</button>
 <button className="numpad-btn del" onClick={del}>⌫</button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

function RepApp({ data, save, rep, onLogout, addAudit }: RepAppProps) {
 const [selected, setSelected] = useState<Product | null>(null);
 const [qty, setQty] = useState<string>("");
 const [cash, setCash] = useState<string>("");
 const [note, setNote] = useState<string>("");
 const [receipt, setReceipt] = useState<Sale | null>(null);
 const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
 const [editQty, setEditQty] = useState<string>("");
 const [editCash, setEditCash] = useState<string>("");
 const [editAlert, setEditAlert] = useState<string>("");

 const activeSales = data.sales.filter(s => !s.voided);
 const todaySales = activeSales.filter(s => s.date === today() && s.repId === rep.id);
 const availableProducts = data.products.filter(p => p.stock > 0);

 const handleQty = (v: string) => {
 setQty(v);
 if (selected && v) setCash(String(+v * selected.sellPrice));
 else setCash("");
 };

 const submit = () => {
 if (!selected) return setEditAlert("Please select a product first.");
 if (!qty || +qty <= 0 || !Number.isInteger(+qty)) return setEditAlert("Please enter a whole number.");
 if (+qty > selected.stock) return setEditAlert(`Only ${selected.stock} boxes available.`);
 if (!cash || isNaN(+cash)) return setEditAlert("Please enter the cash collected.");

 const q = +qty;
 const sale = {
 id: uid(),
 productId: selected.id, productName: selected.name,
 repId: rep.id, repName: rep.name,
 qty: q, pricePerBox: selected.sellPrice,
 expectedCash: q * selected.sellPrice,
 cashCollected: +cash,
 discrepancy: +cash - q * selected.sellPrice,
 note, date: today(), time: nowTime(),
 voided: false, edited: false,
 };

 const newProducts = data.products.map(p =>
 p.id === selected.id ? { ...p, stock: p.stock - q } : p
 );

 let nd = { ...data, sales: [...data.sales, sale], products: newProducts };
 nd = addAudit(nd, "SALE", `${rep.name} sold ${q} × ${selected.name} — ${fmt(+cash)}`, rep.name);
 save(nd);
 setReceipt(sale);
 setSelected(null); setQty(""); setCash(""); setNote(""); setEditAlert("");
 };

 const editSale = (saleId: string, newQty: string, newCash: string) => {
 if (!Number.isInteger(+newQty) || +newQty <= 0) return setEditAlert("Invalid quantity.");
 if (isNaN(+newCash)) return setEditAlert("Invalid cash amount.");

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

 let nd = { ...data, sales: newSales, products: newProducts };
 nd = addAudit(nd, "SALE_EDIT", `Sale edited: ${sale.productName} — ${+newQty} boxes, ${fmt(+newCash)}`, rep.name);
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

 return (
 <><style>{STYLE}</style>
 <div className="page">
 <div className="topbar">
 <div><div className="topbar-logo">📝 Record Sale</div><div className="topbar-sub">{rep.name}</div></div>
 <button className="topbar-btn" onClick={onLogout}>Logout</button>
 </div>

 <div className="content" style={{ paddingBottom: 24 }}>
 {availableProducts.length === 0 && (
 <Alert message="No products in stock. Ask owner to record a delivery." type="gold" />
 )}

 <div style={{ fontFamily: "var(--font-h)", fontSize: 13, color: "var(--muted)", marginBottom: 12, textTransform: "uppercase", fontWeight: 600 }}>Select Product</div>
 <div className="prod-grid">
 {data.products.map(p => (
 <div key={p.id} className={`prod-card${selected?.id === p.id ? " selected" : ""} ${p.stock === 0 ? " disabled" : ""}`} onClick={() => p.stock > 0 && setSelected(p)} style={{ cursor: p.stock > 0 ? "pointer" : "not-allowed" }}>
 <div className="prod-name">{p.name}</div>
 <div className="prod-price">{fmt(p.sellPrice)}/box</div>
 <div className="prod-stock">{p.stock > 0 ? `${p.stock.toLocaleString()} in stock` : "Out of stock"}</div>
 <div className="bar-bg"><div className="bar-fill" style={{ width: Math.min(100, (p.stock / 500) * 100) + "%", background: "var(--green3)" }}></div></div>
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
 Expected: <strong style={{ color: "var(--green2)" }}>{fmt(+qty * selected.sellPrice)}</strong>
 {cash && +cash !== +qty * selected.sellPrice && <span style={{ color: +cash < +qty * selected.sellPrice ? "var(--red)" : "var(--green)" }}> {+cash < +qty * selected.sellPrice ? "−" : "+"} {fmt(Math.abs(+cash - +qty * selected.sellPrice))}</span>}
 </div>}
 </div>

 <div className="fg">
 <label className="flabel">Customer / Note (optional)</label>
 <input className="finput" value={note} onChange={e => setNote(e.target.value)} placeholder="E.g., Repeat customer" />
 </div>

 {editAlert && <Alert message={editAlert} type="red" onDismiss={() => setEditAlert("")} />}

 <button className="btn btn-green btn-full btn-lg" onClick={submit}>✓ Confirm Sale</button>
 </div>
 </>
 )}

 {todaySales.length > 0 && (
 <div className="card">
 <div className="card-title">📊 Your Sales Today ({todaySales.length})</div>
 {todaySales.map(s => (
 <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 600, fontSize: 14 }}>{s.productName} — {s.qty} boxes {s.edited && <span className="badge badge-gold">Edited</span>}</div>
 <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>{fmt(s.cashCollected)}</div>
 </div>
 <button className="btn btn-ghost btn-sm" onClick={() => { setEditingSaleId(s.id); setEditQty(String(s.qty)); setEditCash(String(s.cashCollected)); }} title="Edit this sale">✏</button>
 </div>
 ))}
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

function OwnerApp({ data, save, onLogout, addAudit }: OwnerAppProps) {
 const [tab, setTab] = useState<"home" | "delivery" | "sales" | "report" | "settings">("home");
 const TABS: Array<{ id: "home" | "delivery" | "sales" | "report" | "settings"; icon: string; label: string }> = [
 { id: "home", icon: "🏠", label: "Home" },
 { id: "delivery", icon: "📦", label: "Delivery" },
 { id: "sales", icon: "📊", label: "Sales" },
 { id: "report", icon: "📈", label: "Report" },
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

function OwnerHome({ data }: { data: StateData }) {
 const { products, sales } = data;
 const mKey = today().slice(0, 7);
 const activeSales = sales.filter(s => !s.voided);
 const tSales = activeSales.filter(s => s.date === today());
 const mSales = activeSales.filter(s => s.date.startsWith(mKey));

 const tExpected = tSales.reduce((s, t) => s + t.expectedCash, 0);
 const tCollected = tSales.reduce((s, t) => s + t.cashCollected, 0);
 const tDisc = tCollected - tExpected;

 const mRevenue = mSales.reduce((s, t) => s + t.cashCollected, 0);
 const mCOGS = mSales.reduce((s, t) => {
 const p = products.find(x => x.id === t.productId);
 return s + t.qty * (p?.costPrice || 0);
 }, 0);
 const mProfit = mRevenue - mCOGS;
 const mUnits = mSales.reduce((s, t) => s + t.qty, 0);

 const totalStock = products.reduce((s, p) => s + p.stock, 0);
 const lowStock = products.filter(p => p.stock < 100);
 const critStock = products.filter(p => p.stock < 30);

 return (
 <>
 <div className="section-title">Dashboard</div>

 {critStock.length > 0 && <Alert message={`Critical: ${critStock.length} product${critStock.length === 1 ? "" : "s"} low on stock`} type="red" />}
 {tDisc < -500 && <Alert message={`Cash shortage today: ${fmt(Math.abs(tDisc))}`} type="red" />}
 {lowStock.length > 0 && critStock.length === 0 && <Alert message={`${lowStock.length} product${lowStock.length === 1 ? "" : "s"} running low`} type="gold" />}

 <div className="stat-grid">
 <div className="stat-card">
 <div className="stat-accent" style={{ background: "var(--green)" }} />
 <div className="stat-label">Total Stock</div>
 <div className="stat-value" style={{ color: "var(--green)" }}>{totalStock.toLocaleString()}</div>
 <div className="stat-sub">{products.length} products</div>
 </div>

 <div className="stat-card">
 <div className="stat-accent" style={{ background: "var(--gold)" }} />
 <div className="stat-label">Today Sold</div>
 <div className="stat-value" style={{ color: "var(--gold)" }}>{tSales.reduce((s,t)=>s+t.qty,0).toLocaleString()}</div>
 <div className="stat-sub">{fmt(tCollected)}</div>
 </div>

 <div className="stat-card">
 <div className="stat-accent" style={{ background: "var(--blue)" }} />
 <div className="stat-label">Month Revenue</div>
 <div className="stat-value" style={{ color: "var(--blue)", fontSize: 15 }}>{fmt(mRevenue)}</div>
 <div className="stat-sub">{mUnits.toLocaleString()} boxes</div>
 </div>

 <div className="stat-card">
 <div className="stat-accent" style={{ background: mProfit >= 0 ? "var(--green3)" : "var(--red)" }} />
 <div className="stat-label">Month Profit</div>
 <div className="stat-value" style={{ color: mProfit >= 0 ? "var(--green2)" : "var(--red)", fontSize: 15 }}>{fmt(mProfit)}</div>
 <div className="stat-sub">{mProfit >= 0 ? "▲ Profit" : "▼ Loss"}</div>
 </div>
 </div>

 <div className="card">
 <div className="card-title">💰 Today's Cash Accountability</div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, textAlign: "center" }}>
 {[["Expected", fmt(tExpected), "var(--green2)"], ["Collected", fmt(tCollected), "var(--text)"], ["Diff", fmt(tDisc), tDisc < 0 ? "var(--red)" : "var(--green)"]]
 .map(([l, v, c]) => (
 <div key={l}>
 <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>{l}</div>
 <div style={{ fontFamily: "var(--font-m)", fontSize: 14, color: c, fontWeight: 600, marginTop: 6 }}>{v}</div>
 </div>
 ))}
 </div>
 </div>

 <div className="card">
 <div className="card-title">📦 Stock Levels</div>
 {products.map(p => {
 const pct = Math.min(100, (p.stock / (p.expectedQty || 500)) * 100);
 const color = p.stock < 30 ? "var(--red)" : p.stock < 100 ? "var(--gold)" : "var(--green3)";
 return (
 <div key={p.id} style={{ marginBottom: 14 }}>
 <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
 <span style={{ fontWeight: 600 }}>{p.name}</span>
 <span style={{ fontFamily: "var(--font-m)", color, fontWeight: 600 }}>{p.stock.toLocaleString()}</span>
 </div>
 <div className="bar-bg"><div className="bar-fill" style={{ width: pct + "%", background: color }}></div></div>
 </div>
 );
 })}
 </div>
 </>
 );
}

function OwnerDelivery({ data, save, addAudit }: OwnerDeliveryProps) {
 const blank = { productId: data.products[0]?.id || "", qty: "", costPerBox: "", date: today(), supplier: "" };
 const [form, setForm] = useState(blank);
 const [msg, setMsg] = useState("");

 const set = (k: keyof typeof blank, v: string) => setForm(f => ({ ...f, [k]: v }));

 const submit = () => {
 if (!form.productId || !form.qty || !form.costPerBox) return setMsg("⚠ Please fill all fields.");

 const delivery = { id: uid(), ...form, qty: +form.qty, costPerBox: +form.costPerBox };
 const newProducts = data.products.map(p =>
 p.id === form.productId ? { ...p, stock: p.stock + +form.qty } : p
 );

 let nd = { ...data, deliveries: [...data.deliveries, delivery], products: newProducts };
 const prod = data.products.find(p => p.id === form.productId);
 nd = addAudit(nd, "DELIVERY", `${+form.qty} × ${prod?.name} from ${form.supplier || "supplier"}`, "OWNER");
 save(nd);
 setForm(blank);
 setMsg("");
 };

 const history = [...data.deliveries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

 return (
 <>
 <div className="section-title">Record Delivery</div>

 <div className="card">
 <div className="card-title">📍 New Stock Arrived</div>

 <div className="fg">
 <label className="flabel">Product *</label>
 <select className="fselect" value={form.productId} onChange={e => set("productId", e.target.value)}>
 {data.products.map(p => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
 </select>
 </div>

 <div className="two-col">
 <div className="fg">
 <label className="flabel">Quantity (boxes) *</label>
 <input className="finput" type="number" value={form.qty} onChange={e => set("qty", e.target.value)} />
 </div>
 <div className="fg">
 <label className="flabel">Cost per Box (₦) *</label>
 <input className="finput" type="number" value={form.costPerBox} onChange={e => set("costPerBox", e.target.value)} />
 </div>
 </div>

 <div className="two-col">
 <div className="fg">
 <label className="flabel">Date</label>
 <input className="finput" type="date" value={form.date} onChange={e => set("date", e.target.value)} />
 </div>
 <div className="fg">
 <label className="flabel">Supplier</label>
 <input className="finput" value={form.supplier} onChange={e => set("supplier", e.target.value)} placeholder="Supplier name" />
 </div>
 </div>

 {form.qty && form.costPerBox && (
 <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12 }}>
 Cost: <strong style={{ color: "var(--green)" }}>{fmt(+form.qty * +form.costPerBox)}</strong>
 </div>
 )}

 {msg && <Alert message={msg} type={msg.startsWith("✓") ? "green" : "red"} onDismiss={() => setMsg("")} />}

 <button className="btn btn-green btn-full" onClick={submit}>✓ Record Delivery</button>
 </div>

 <div className="card">
 <div className="card-title">📋 Delivery History</div>
 {history.length === 0 && <div className="empty">No deliveries recorded yet.</div>}
 {history.map(d => {
 const prod = data.products.find(p => p.id === d.productId);
 return (
 <div key={d.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
 <span style={{ fontWeight: 600, fontSize: 14 }}>{prod?.name || "—"}</span>
 <span style={{ fontFamily: "var(--font-m)", color: "var(--blue)", fontSize: 13 }}>{d.qty} boxes</span>
 </div>
 <div style={{ fontSize: 12, color: "var(--muted)" }}>
 {fmtD(d.date)} · {fmt(d.costPerBox)}/box · Total: <strong>{fmt(d.qty * d.costPerBox)}</strong>
 </div>
 </div>
 );
 })}
 </div>
 </>
 );
}

function OwnerSales({ data, save, addAudit }: OwnerSalesProps) {
 const [filter, setFilter] = useState<"today" | "week" | "month">("today");
 const [showVoided, setShowVoided] = useState<boolean>(false);
 const [voidAlert, setVoidAlert] = useState<string>("");

 const cutoff = filter === "today" ? today()
 : filter === "week" ? new Date(Date.now() - 7*86400000).toISOString().split("T")[0]
 : today().slice(0, 7);

 const allFiltered = [...data.sales]
 .filter(s => filter === "month" ? s.date.startsWith(cutoff) : s.date >= cutoff)
 .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

 const activeFiltered = allFiltered.filter(s => !s.voided);
 const voidedFiltered = allFiltered.filter(s => s.voided);

 const repMap: Record<string, { expected: number; collected: number; qty: number; count: number }> = {};
 activeFiltered.forEach(s => {
 if (!repMap[s.repName]) repMap[s.repName] = { expected: 0, collected: 0, qty: 0, count: 0 };
 repMap[s.repName].expected += s.expectedCash;
 repMap[s.repName].collected += s.cashCollected;
 repMap[s.repName].qty += s.qty;
 repMap[s.repName].count++;
 });

 const voidSale = (id: string) => {
 const s = data.sales.find(x => x.id === id);
 if (!s || s.voided) return;

 const newProducts = data.products.map(p => p.id === s.productId ? { ...p, stock: p.stock + s.qty } : p);
 const newSales = data.sales.map(x => x.id === id ? { ...x, voided: true, voidedBy: "OWNER", voidedAt: nowTime() } : x);

 let nd = { ...data, sales: newSales, products: newProducts };
 nd = addAudit(nd, "VOID", `Sale voided: ${s.qty} × ${s.productName}`, "OWNER");
 save(nd);
 setVoidAlert("✓ Sale voided and inventory restored.");
 setTimeout(() => setVoidAlert(""), 3000);
 };

 return (
 <>
 <div className="section-title">Sales Log</div>

 <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
 {[["today","Today"],["week","Last 7 Days"],["month","This Month"]].map(([v,l]) => (
 <button key={v} className={`btn ${filter === v ? "btn-green" : "btn-ghost"} btn-sm`} onClick={() => setFilter(v as "today" | "week" | "month")}>{l}</button>
 ))}
 </div>

 {voidAlert && <Alert message={voidAlert} type="green" onDismiss={() => setVoidAlert("")} />}

 {Object.keys(repMap).length > 0 && (
 <div className="card">
 <div className="card-title">👥 Rep Accountability</div>
 <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>Expected vs collected cash</div>
 {(Object.entries(repMap) as Array<[string, { expected: number; collected: number; qty: number; count: number }]>).map(([name, r]) => {
 const disc = r.collected - r.expected;
 const isShort = disc < -200;
 return (
 <div key={name} className="row" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
 <div>
 <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
 <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.count} sale{r.count !== 1 ? "s" : ""}</div>
 </div>
 <div style={{ textAlign: "right" }}>
 <div style={{ fontFamily: "var(--font-m)", fontSize: 13, fontWeight: 600 }}>{fmt(r.collected)}</div>
 <span className={`badge ${isShort ? "badge-red" : "badge-green"}`}>
 {isShort ? `⚠ Short ${fmt(Math.abs(disc))}` : "✓ OK"}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 )}

 <div className="card">
 <div className="card-title">📊 Transactions ({activeFiltered.length})</div>
 {activeFiltered.length === 0 && <div className="empty">No sales in this period.</div>}
 {activeFiltered.map(s => {
 const disc = s.cashCollected - s.expectedCash;
 return (
 <div key={s.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 600, fontSize: 14 }}>
 {s.productName} · {s.qty} boxes
 {s.edited && <span className="badge badge-gold">Edited</span>}
 </div>
 <div style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0" }}>{s.repName} · {s.date}</div>
 <div style={{ fontSize: 13 }}>
 <span style={{ color: "var(--muted)" }}>Expected: </span>
 <strong style={{ fontFamily: "var(--font-m)", color: "var(--green2)" }}>{fmt(s.expectedCash)}</strong>
 <span style={{ marginLeft: 10, color: "var(--muted)" }}>Got: </span>
 <strong style={{ fontFamily: "var(--font-m)" }}>{fmt(s.cashCollected)}</strong>
 {disc < -100 && <span style={{ marginLeft: 8, color: "var(--red)", fontSize: 12 }}>⚠ Short</span>}
 {disc > 100 && <span style={{ marginLeft: 8, color: "var(--green)", fontSize: 12 }}>+ Extra</span>}
 </div>
 </div>
 <button className="btn btn-red btn-sm" onClick={() => voidSale(s.id)} title="Void this sale">✕</button>
 </div>
 </div>
 );
 })}
 </div>

 {voidedFiltered.length > 0 && (
 <div className="card">
 <div className="card-title" style={{ cursor: "pointer" }} onClick={() => setShowVoided(!showVoided)}>
 🚫 Voided Records ({voidedFiltered.length}) {showVoided ? "▲" : "▼"}
 </div>
 {showVoided && voidedFiltered.map(s => (
 <div key={s.id} className="tag-deleted" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
 <div>{s.productName} · {s.qty} boxes · {s.repName}</div>
 <div style={{ fontSize: 11, color: "var(--muted)" }}>Voided at {s.voidedAt}</div>
 </div>
 ))}
 </div>
 )}
 </>
 );
}

function OwnerReport({ data }: OwnerReportProps) {
 const { products, sales } = data;
 const mKey = today().slice(0, 7);
 const activeSales = sales.filter(s => !s.voided);
 const mSales = activeSales.filter(s => s.date.startsWith(mKey));

 const revenue = mSales.reduce((s, t) => s + t.cashCollected, 0);
 const expected = mSales.reduce((s, t) => s + t.expectedCash, 0);
 const cogs = mSales.reduce((s, t) => {
 const p = products.find(x => x.id === t.productId);
 return s + t.qty * (p?.costPrice || 0);
 }, 0);

 const profit = revenue - cogs;
 const disc = revenue - expected;
 const unitsSold = mSales.reduce((s, t) => s + t.qty, 0);

 return (
 <>
 <div className="section-title">Monthly Report · {mKey}</div>

 {disc < -2000 && <Alert message={`Significant cash shortage: ${fmt(Math.abs(disc))}`} type="red" />}

 <div className="stat-grid">
 {[["Boxes Sold", unitsSold.toLocaleString(), "var(--green)"], ["Revenue", fmt(revenue), "var(--blue)"], ["COGS", fmt(cogs), "var(--muted)"], ["Profit", fmt(profit), profit >= 0 ? "var(--green)" : "var(--red)"]]
 .map(([l, v, c]) => (
 <div key={l} className="stat-card">
 <div className="stat-accent" style={{ background: c }} />
 <div className="stat-label">{l}</div>
 <div className="stat-value" style={{ color: c, fontSize: 16 }}>{v}</div>
 </div>
 ))}
 </div>

 <div className="card">
 <div className="card-title">🛁 Per Product Breakdown</div>
 {products.map(p => {
 const ps = mSales.filter(s => s.productId === p.id);
 const pRev = ps.reduce((s, t) => s + t.cashCollected, 0);
 const pCogs = ps.reduce((s, t) => s + t.qty * p.costPrice, 0);
 const pPft = pRev - pCogs;
 const pQty = ps.reduce((s, t) => s + t.qty, 0);
 return (
 <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
 <div className="row" style={{ marginBottom: 3 }}>
 <span style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</span>
 <span style={{ fontFamily: "var(--font-m)", fontSize: 13, color: pPft >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(pPft)}</span>
 </div>
 <div style={{ fontSize: 12, color: "var(--muted)" }}>
 {pQty} sold · Revenue {fmt(pRev)} · Profit {fmt(pPft)}
 </div>
 </div>
 );
 })}
 </div>

 <div className="card">
 <div className="card-title">📋 P&L Summary</div>
 {[["Expected Revenue", fmt(expected), "var(--muted)"], ["Cash Collected", fmt(revenue), "var(--text)"], ["COGS", fmt(cogs), "var(--red)"], ["Gross Profit", fmt(profit), profit >= 0 ? "var(--green)" : "var(--red)"]]
 .map(([l, v, c]) => (
 <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
 <span style={{ color: "var(--muted)", fontSize: 14 }}>{l}</span>
 <span style={{ fontFamily: "var(--font-m)", fontWeight: 700, color: c }}>{v}</span>
 </div>
 ))}
 </div>
 </>
 );
}

function downloadJson(filename: string, json: string) {
 const blob = new Blob([json], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 link.href = url;
 link.download = filename;
 link.click();
 URL.revokeObjectURL(url);
}

function OwnerSettings({ data, save, addAudit }: OwnerSettingsProps) {
 const [newPin, setNewPin] = useState<string>("");
 const [confirmPin, setConfirmPin] = useState<string>("");
 const [pinMsg, setPinMsg] = useState<string>("");
 const [repName, setRepName] = useState<string>("");
 const [repPin, setRepPin] = useState<string>("");
 const [repPin2, setRepPin2] = useState<string>("");
 const [repErr, setRepErr] = useState<string>("");
 const [prod, setProd] = useState({ name: "", costPrice: "", sellPrice: "", expectedQty: "", schedule: "monthly" });
 const [settingsMsg, setSettingsMsg] = useState<string>("");

 const sp = (k: keyof typeof prod, v: string) => setProd(f => ({ ...f, [k]: v }));

 const changePin = () => {
 if (!/^\d{4}$/.test(newPin)) return setPinMsg("PIN must be exactly 4 digits.");
 if (newPin !== confirmPin) return setPinMsg("PINs don't match.");

 let nd: StateData = { ...data, ownerPin: newPin };
 nd = addAudit(nd, "PIN_CHANGE", "Owner PIN changed", "OWNER");
 save(nd);
 setNewPin(""); setConfirmPin("");
 setPinMsg("✓ PIN changed successfully!");
 setTimeout(() => setPinMsg(""), 3000);
 };

 const addRep = () => {
 if (!repName.trim()) return setRepErr("Enter rep name.");
 if (!/^\d{4}$/.test(repPin)) return setRepErr("PIN must be 4 digits.");
 if (repPin !== repPin2) return setRepErr("PINs don't match.");

 const newRep = { id: uid(), name: repName.trim(), pin: repPin };
 let nd = { ...data, reps: [...data.reps, newRep] };
 nd = addAudit(nd, "REP_ADDED", `New rep: ${repName.trim()}`, "OWNER");
 save(nd);
 setRepName(""); setRepPin(""); setRepPin2(""); setRepErr("");
 setSettingsMsg("✓ Rep added");
 setTimeout(() => setSettingsMsg(""), 2000);
 };

 const removeRep = (id: string) => {
 const rep = data.reps.find(r => r.id === id);
 const newReps = data.reps.filter(r => r.id !== id);
 let nd = { ...data, reps: newReps };
 nd = addAudit(nd, "REP_REMOVED", `Rep removed: ${rep?.name}`, "OWNER");
 save(nd);
 setSettingsMsg("✓ Rep removed");
 setTimeout(() => setSettingsMsg(""), 2000);
 };

 const addProduct = () => {
 if (!prod.name || !prod.costPrice || !prod.sellPrice) return setSettingsMsg("⚠ Fill name, cost, sell price.");

 const newProd = { id: uid(), ...prod, costPrice: +prod.costPrice, sellPrice: +prod.sellPrice, expectedQty: +prod.expectedQty || 500, stock: 0 };
 let nd = { ...data, products: [...data.products, newProd] };
 nd = addAudit(nd, "PRODUCT_ADDED", `New product: ${prod.name}`, "OWNER");
 save(nd);
 setProd({ name: "", costPrice: "", sellPrice: "", expectedQty: "", schedule: "monthly" });
 setSettingsMsg("✓ Product added");
 setTimeout(() => setSettingsMsg(""), 2000);
 };

 const delProduct = (id: string) => {
 const p = data.products.find(x => x.id === id);
 const newProducts = data.products.filter(x => x.id !== id);
 let nd = { ...data, products: newProducts };
 nd = addAudit(nd, "PRODUCT_REMOVED", `Product removed: ${p?.name}`, "OWNER");
 save(nd);
 setSettingsMsg("✓ Product removed");
 setTimeout(() => setSettingsMsg(""), 2000);
 };

 const updateSellPrice = (id: string, price: string) => {
 save({ ...data, products: data.products.map(p => p.id === id ? { ...p, sellPrice: +price } : p) });
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
 const imported = JSON.parse(text) as StateData;
 if (!imported || typeof imported !== "object" || !Array.isArray(imported.sales) || !Array.isArray(imported.products)) {
 throw new Error("Invalid backup file");
 }
 save(imported);
 setSettingsMsg("✓ Data imported successfully");
 } catch {
 setSettingsMsg("⚠ Invalid backup file");
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
 {data.reps.map(r => (
 <div key={r.id} className="row" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
 <span style={{ fontWeight: 600 }}>👤 {r.name}</span>
 <button className="btn btn-red btn-sm" onClick={() => removeRep(r.id)}>Remove</button>
 </div>
 ))}

 <div className="divider" />

 <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Add New Rep</div>
 <div className="fg">
 <label className="flabel">Rep Name</label>
 <input className="finput" value={repName} onChange={e => { setRepName(e.target.value); setRepErr(""); }} placeholder="E.g., John" />
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
 <div className="card-title">🛁 Manage Products</div>
 {data.products.map(p => (
 <div key={p.id} className="row" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
 <div style={{ fontSize: 12, color: "var(--muted)" }}>Cost: {fmt(p.costPrice)} · Stock: {p.stock}</div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <input className="finput" type="number" style={{ width: 100, padding: "6px 10px", fontSize: 13 }} value={p.sellPrice} onChange={e => updateSellPrice(p.id, e.target.value)} placeholder="Sell price" title="Sell Price" />
 <button className="btn btn-red btn-sm" onClick={() => delProduct(p.id)} title="Delete product">✕</button>
 </div>
 </div>
 ))}

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
 <button className="btn btn-red btn-full" onClick={() => {
 if (window.confirm("Delete all data? CANNOT be undone.")) {
 save({ ownerPin: data.ownerPin, reps: data.reps, products: DEFAULT_PRODUCTS.map(p => ({ ...p, stock: 0 })), deliveries: [], sales: [], auditLog: [] });
 setSettingsMsg("✓ Data reset");
 setTimeout(() => setSettingsMsg(""), 2000);
 }
 }}>Reset All Data</button>
 </div>
 </>
 );
}
