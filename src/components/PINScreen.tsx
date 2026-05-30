import { useState } from 'react';
import { PINScreenProps } from '../types';
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
 --border:#ddd8cf;
 --shadow-lg:0 8px 32px rgba(0,0,0,.12);
 --font-h:'Fraunces',Georgia,serif;
 --font-b:'DM Sans',sans-serif;
 --font-m:'DM Mono',monospace;
 --muted:#6b6b6b;
}
html,body,#root{height:100%;}
body{background:var(--bg);color:var(--text);font-family:var(--font-b);}
.fullscreen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:0;padding-top:28px;}
.pin-card{background:var(--white);border-radius:24px;box-shadow:var(--shadow-lg);padding:28px 24px 26px;max-width:420px;width:100%;margin:0 auto 24px;}
.pin-header{padding:0 8px;}
.pin-display{display:flex;gap:12px;justify-content:center;margin:28px 0;}
.pin-dot{width:18px;height:18px;border-radius:50%;border:2.5px solid var(--green);background:transparent;transition:all .15s;}
.pin-dot.filled{background:var(--green);box-shadow:0 0 8px rgba(26,61,43,.3);}
.numpad{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:280px;margin:0 auto;}
.numpad-btn{background:var(--white);border:1.5px solid var(--border);border-radius:12px;height:56px;font-size:20px;font-weight:600;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;color:var(--text);}
.numpad-btn:hover{background:var(--green);color:white;border-color:var(--green);transform:translateY(-2px);box-shadow:0 2px 16px rgba(0,0,0,.07);}
.numpad-btn:active{transform:translateY(0) scale(.95);}
.numpad-btn.del{color:#c0392b;font-size:24px;}
.numpad-empty{background:transparent;border:none;pointer-events:none;}
.btn{padding:12px 22px;border-radius:8px;font-family:var(--font-b);font-size:15px;font-weight:600;border:none;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;justify-content:center;gap:6px;}
.btn-ghost{background:transparent;border:1.5px solid var(--border);color:var(--text);}
.btn-ghost:hover{border-color:var(--green);color:var(--green);background:rgba(26,61,43,.02);}
.btn-sm{padding:8px 12px;font-size:12px;border-radius:6px;}
.alert{padding:14px 16px;border-radius:8px;font-size:13.5px;display:flex;gap:10px;align-items:flex-start;margin-bottom:12px;border:1px solid;}
.alert-red{background:#fdf0ee;border-color:rgba(192,57,43,.2);color:#c0392b;}
@media(max-width:500px){
 .numpad{gap:10px;}
 .numpad-btn{height:50px;font-size:18px;}
}
`;

export default function PINScreen({ title, subtitle, pin, onSuccess, onBack }: PINScreenProps) {
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
    <div className="fullscreen">
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
