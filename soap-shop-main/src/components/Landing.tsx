import { LandingProps } from '../types';

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
 --font-h:'Fraunces',Georgia,serif;
 --font-b:'DM Sans',sans-serif;
 --muted:#6b6b6b;
}
html,body,#root{height:100%;}
body{background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:15px;line-height:1.5;}
.fullscreen{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28;}
`;

export default function Landing({ onOwner, onRep }: LandingProps) {
  return (
    <><style>{STYLE}</style>
    <div className="fullscreen" style={{ gap: 28 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>📦</div>
        <div style={{ fontFamily: "var(--font-h)", fontSize: 32, fontWeight: 700, color: "var(--green)" }}>Soap Stock Audit</div>
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
