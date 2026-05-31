import { useState } from 'react';
import { SetupWizardProps, SalesRep } from '../types';
import { uid } from '../lib/utils';
import { hashPin } from '../lib/crypto';
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
body{background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;}
.fullscreen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.alert{padding:14px 16px;border-radius:var(--radius-sm);font-size:13.5px;display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;border:1px solid;}
.alert-red{background:var(--red-light);border-color:rgba(192,57,43,.2);color:var(--red);}
.alert-gold{background:var(--gold-light);border-color:rgba(181,134,13,.25);color:#7a5c00;}
.alert-green{background:var(--green-light);border-color:rgba(45,106,79,.2);color:var(--green2);}
.alert-blue{background:var(--blue-light);border-color:rgba(26,92,138,.2);color:var(--blue);}
.fg{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.flabel{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:600;}
.finput,.fselect{background:#f9f7f3;border:1.5px solid var(--border);border-radius:var(--radius-sm);padding:12px 14px;font-family:var(--font-b);font-size:15px;transition:all .2s;width:100%;}
.finput:focus,.fselect:focus{outline:none;border-color:var(--green);background:white;box-shadow:0 0 0 3px rgba(26,61,43,.1);}
.finput.err{border-color:var(--red);background:rgba(192,57,43,.05);}
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
.setup-step{background:var(--white);border-radius:18px;padding:32px 28px;box-shadow:var(--shadow-lg);}
.setup-number{background:var(--green);color:white;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;margin-bottom:20px;}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
@media(max-width:500px){
 .two-col{grid-template-columns:1fr;}
 .content{padding:20px 14px 130px;}
 .card{padding:16px;}
}
`;

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [pin, setPin] = useState<string>("");
  const [pin2, setPin2] = useState<string>("");
  const [err, setErr] = useState<string>("");
  const [reps, setReps] = useState<SalesRep[]>([]);
  const [repName, setRepName] = useState<string>("");
  const [repPin, setRepPin] = useState<string>("");
  const [repPin2, setRepPin2] = useState<string>("");
  const [repErr, setRepErr] = useState<string>("");

  const addRep = async () => {
    if (!repName.trim()) return setRepErr("Enter a name.");
    if (!/^\d{4}$/.test(repPin)) return setRepErr("PIN must be exactly 4 digits.");
    if (repPin !== repPin2) return setRepErr("PINs don't match.");
    const hashedRepPin = await hashPin(repPin);
    setReps(r => [...r, { id: uid(), name: repName.trim(), pin: hashedRepPin }]);
    setRepName(""); setRepPin(""); setRepPin2(""); setRepErr("");
  };

  const finish = async () => {
    if (step === 1) {
      if (!/^\d{4}$/.test(pin)) return setErr("PIN must be exactly 4 digits.");
      if (pin !== pin2) return setErr("The two PINs don't match.");
      setErr(""); setStep(2);
    } else {
      if (reps.length === 0) return setRepErr("Please add at least one sales rep.");
      const hashedOwnerPin = await hashPin(pin);
      onComplete(hashedOwnerPin, reps);
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
            {err && <Alert message={err} type="red" onDismiss={() => setErr("")} />}
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
            {repErr && <Alert message={repErr} type="red" onDismiss={() => setRepErr("")} />}
            <button className="btn btn-ghost btn-full" style={{ marginBottom: 10 }} onClick={addRep}>+ Add Another Rep</button>
            <button className="btn btn-green btn-full btn-lg" onClick={finish} disabled={reps.length === 0}>✓ Finish Setup</button>
          </>
        )}
      </div>
    </div>
    </>
  );
}
