import { useState, useEffect, useMemo } from "react";

/* ---------------- constants ---------------- */

const CAD = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });
const fmt = (n) => CAD.format(Number.isFinite(n) ? n : 0);

const OUT_CATEGORIES = [
  { id: "rent", label: "Rent & home", color: "#5B7C99" },
  { id: "groceries", label: "Groceries", color: "#4E8D6E" },
  { id: "dining", label: "Dining out", color: "#D08C3C" },
  { id: "transport", label: "Transport & gas", color: "#7A6FB3" },
  { id: "car", label: "Car payment", color: "#8A5A44" },
  { id: "utilities", label: "Utilities", color: "#4A8FA6" },
  { id: "internet", label: "Phone & internet", color: "#3F7F74" },
  { id: "subscriptions", label: "Subscriptions", color: "#9C6FA6" },
  { id: "shopping", label: "Shopping", color: "#C77D9E" },
  { id: "health", label: "Health", color: "#6FA687" },
  { id: "pet", label: "Pet care", color: "#B98A4C" },
  { id: "personal", label: "Personal & fun", color: "#C2694F" },
  { id: "savings", label: "Savings transfer", color: "#C9A227" },
  { id: "other-out", label: "Other", color: "#8B8B8B" },
];

const IN_CATEGORIES = [
  { id: "paycheque", label: "Paycheque", color: "#1F7A5C" },
  { id: "freelance", label: "Freelance", color: "#2E8B8B" },
  { id: "gift", label: "Gift", color: "#B98A4C" },
  { id: "other-in", label: "Other income", color: "#6B7F77" },
];

const CAT_MAP = {};
[...OUT_CATEGORIES, ...IN_CATEGORIES].forEach((c) => (CAT_MAP[c.id] = c));

const STORAGE_KEY = "budget-data";
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------------- component ---------------- */

export default function BudgetTracker() {
  const now = new Date();
  const [data, setData] = useState({ transactions: [], goals: [] });
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [view, setView] = useState("overview");
  const [month, setMonth] = useState({ y: now.getFullYear(), m: now.getMonth() });

  // add-transaction sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [txType, setTxType] = useState("out");
  const [txAmount, setTxAmount] = useState("");
  const [txCat, setTxCat] = useState("groceries");
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState(todayISO());

  // goals
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalStart, setGoalStart] = useState("");
  const [contrib, setContrib] = useState({}); // goalId -> input string

  /* ---- load ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) {
          const parsed = JSON.parse(res.value);
          setData({
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            goals: Array.isArray(parsed.goals) ? parsed.goals : [],
          });
        }
      } catch (e) {
        // no saved data yet — start fresh
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---- persist ---- */
  const persist = async (next) => {
    setData(next);
    try {
      const ok = await window.storage.set(STORAGE_KEY, JSON.stringify(next));
      setSaveError(!ok);
    } catch (e) {
      setSaveError(true);
    }
  };

  /* ---- derived ---- */
  const monthTx = useMemo(() => {
    return data.transactions
      .filter((t) => {
        const d = new Date(t.date + "T12:00:00");
        return d.getFullYear() === month.y && d.getMonth() === month.m;
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt));
  }, [data.transactions, month]);

  const totals = useMemo(() => {
    let tin = 0, tout = 0;
    monthTx.forEach((t) => (t.type === "in" ? (tin += t.amount) : (tout += t.amount)));
    return { in: tin, out: tout, left: tin - tout };
  }, [monthTx]);

  const byCategory = useMemo(() => {
    const map = {};
    monthTx.forEach((t) => {
      if (t.type !== "out") return;
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([id, amount]) => ({ ...(CAT_MAP[id] || { id, label: id, color: "#8B8B8B" }), amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTx]);

  const grouped = useMemo(() => {
    const groups = [];
    let cur = null;
    monthTx.forEach((t) => {
      if (!cur || cur.date !== t.date) {
        cur = { date: t.date, items: [] };
        groups.push(cur);
      }
      cur.items.push(t);
    });
    return groups;
  }, [monthTx]);

  const monthLabel = new Date(month.y, month.m, 1).toLocaleDateString("en-CA", {
    month: "long",
    year: "numeric",
  });
  const isCurrentMonth = month.y === now.getFullYear() && month.m === now.getMonth();

  /* ---- actions ---- */
  const shiftMonth = (delta) => {
    const d = new Date(month.y, month.m + delta, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
  };

  const openSheet = (type) => {
    setTxType(type);
    setTxCat(type === "out" ? "groceries" : "paycheque");
    setTxAmount("");
    setTxNote("");
    setTxDate(todayISO());
    setSheetOpen(true);
  };

  const saveTx = () => {
    const amt = parseFloat(txAmount);
    if (!Number.isFinite(amt) || amt <= 0) return;
    const tx = {
      id: uid(),
      type: txType,
      amount: Math.round(amt * 100) / 100,
      category: txCat,
      note: txNote.trim(),
      date: txDate || todayISO(),
      createdAt: Date.now(),
    };
    persist({ ...data, transactions: [tx, ...data.transactions] });
    setSheetOpen(false);
  };

  const deleteTx = (id) => {
    persist({ ...data, transactions: data.transactions.filter((t) => t.id !== id) });
  };

  const addGoal = () => {
    const target = parseFloat(goalTarget);
    if (!goalName.trim() || !Number.isFinite(target) || target <= 0) return;
    const start = parseFloat(goalStart);
    const goal = {
      id: uid(),
      name: goalName.trim(),
      target: Math.round(target * 100) / 100,
      saved: Number.isFinite(start) && start > 0 ? Math.round(start * 100) / 100 : 0,
    };
    persist({ ...data, goals: [...data.goals, goal] });
    setGoalName("");
    setGoalTarget("");
    setGoalStart("");
    setGoalFormOpen(false);
  };

  const addToGoal = (id) => {
    const amt = parseFloat(contrib[id]);
    if (!Number.isFinite(amt) || amt === 0) return;
    persist({
      ...data,
      goals: data.goals.map((g) =>
        g.id === id ? { ...g, saved: Math.max(0, Math.round((g.saved + amt) * 100) / 100) } : g
      ),
    });
    setContrib({ ...contrib, [id]: "" });
  };

  const deleteGoal = (id) => {
    persist({ ...data, goals: data.goals.filter((g) => g.id !== id) });
  };

  /* ---- ribbon segments ---- */
  const ribbonBase = Math.max(totals.in, totals.out, 1);
  const leftPct = totals.left > 0 ? (totals.left / ribbonBase) * 100 : 0;

  const catChips = txType === "out" ? OUT_CATEGORIES : IN_CATEGORIES;

  /* ---------------- render ---------------- */

  return (
    <div className="bt-root">
      <style>{CSS}</style>

      {/* ---------- header ---------- */}
      <header className="bt-header">
        <div className="bt-shell">
          <div className="bt-monthnav">
            <button className="bt-navbtn" aria-label="Previous month" onClick={() => shiftMonth(-1)}>‹</button>
            <div className="bt-monthlabel">
              {monthLabel}
              {!isCurrentMonth && (
                <button className="bt-today" onClick={() => setMonth({ y: now.getFullYear(), m: now.getMonth() })}>
                  back to today
                </button>
              )}
            </div>
            <button className="bt-navbtn" aria-label="Next month" onClick={() => shiftMonth(1)}>›</button>
          </div>

          <div className="bt-hero">
            <div className="bt-herolabel">{totals.left < 0 ? "Over budget by" : "Left this month"}</div>
            <div className={"bt-balance" + (totals.left < 0 ? " bt-neg" : "")}>
              {loading ? "· · ·" : fmt(Math.abs(totals.left))}
            </div>
            <div className="bt-inout">
              <span className="bt-pill bt-pill-in">In&nbsp;&nbsp;{fmt(totals.in)}</span>
              <span className="bt-pill bt-pill-out">Out&nbsp;&nbsp;{fmt(totals.out)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ---------- body ---------- */}
      <main className="bt-shell bt-body">
        {saveError && (
          <div className="bt-alert">Couldn't save your last change. Check your connection and try again.</div>
        )}

        <nav className="bt-tabs" role="tablist">
          {[
            ["overview", "Overview"],
            ["activity", "Activity"],
            ["goals", "Goals"],
          ].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              className={"bt-tab" + (view === id ? " bt-tab-on" : "")}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ----- overview ----- */}
        {view === "overview" && (
          <section>
            <h2 className="bt-h2">Where the money went</h2>
            {totals.out === 0 && totals.in === 0 ? (
              <div className="bt-empty">
                Nothing recorded for {monthLabel} yet. Tap <strong>＋</strong> below to add your first
                money in or money out.
              </div>
            ) : (
              <>
                <div className="bt-ribbon" aria-hidden="true">
                  {byCategory.map((c) => (
                    <div
                      key={c.id}
                      className="bt-seg"
                      title={`${c.label} ${fmt(c.amount)}`}
                      style={{ width: `${(c.amount / ribbonBase) * 100}%`, background: c.color }}
                    />
                  ))}
                  {leftPct > 0 && <div className="bt-seg bt-seg-left" style={{ width: `${leftPct}%` }} />}
                </div>
                <p className="bt-note">
                  {totals.in > 0
                    ? totals.left >= 0
                      ? `You've spent ${Math.round((totals.out / totals.in) * 100)}% of what came in. The green stripe is what's still yours.`
                      : `Spending is ${fmt(-totals.left)} more than what came in this month.`
                    : "No money in recorded yet this month — add your paycheques so the balance is accurate."}
                </p>

                <div className="bt-card">
                  {byCategory.length === 0 && <div className="bt-emptyrow">No spending yet this month.</div>}
                  {byCategory.map((c) => (
                    <div key={c.id} className="bt-catrow">
                      <span className="bt-dot" style={{ background: c.color }} />
                      <div className="bt-catmain">
                        <div className="bt-cattop">
                          <span className="bt-catname">{c.label}</span>
                          <span className="bt-catamt">{fmt(c.amount)}</span>
                        </div>
                        <div className="bt-track">
                          <div
                            className="bt-fill"
                            style={{
                              width: `${totals.out ? (c.amount / totals.out) * 100 : 0}%`,
                              background: c.color,
                            }}
                          />
                        </div>
                      </div>
                      <span className="bt-catpct">
                        {totals.out ? Math.round((c.amount / totals.out) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* ----- activity ----- */}
        {view === "activity" && (
          <section>
            <h2 className="bt-h2">Every dollar, in and out</h2>
            {grouped.length === 0 ? (
              <div className="bt-empty">No transactions in {monthLabel}. Tap <strong>＋</strong> to add one.</div>
            ) : (
              grouped.map((g) => (
                <div key={g.date} className="bt-daygroup">
                  <div className="bt-dayhead">
                    {new Date(g.date + "T12:00:00").toLocaleDateString("en-CA", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="bt-card">
                    {g.items.map((t) => {
                      const cat = CAT_MAP[t.category] || { label: t.category, color: "#8B8B8B" };
                      return (
                        <div key={t.id} className="bt-txrow">
                          <span className="bt-dot" style={{ background: cat.color }} />
                          <div className="bt-txmain">
                            <div className="bt-txname">{t.note || cat.label}</div>
                            {t.note && <div className="bt-txcat">{cat.label}</div>}
                          </div>
                          <span className={"bt-txamt " + (t.type === "in" ? "bt-in" : "bt-out")}>
                            {t.type === "in" ? "+" : "−"}{fmt(t.amount)}
                          </span>
                          <button
                            className="bt-del"
                            aria-label={`Delete ${t.note || cat.label}`}
                            onClick={() => deleteTx(t.id)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* ----- goals ----- */}
        {view === "goals" && (
          <section>
            <h2 className="bt-h2">What you're saving toward</h2>

            {data.goals.length === 0 && !goalFormOpen && (
              <div className="bt-empty">
                No goals yet. A goal is anything you're putting money aside for — an emergency fund,
                a trip, a big purchase. Create one below.
              </div>
            )}

            {data.goals.map((g) => {
              const pct = Math.min(100, (g.saved / g.target) * 100);
              const done = g.saved >= g.target;
              return (
                <div key={g.id} className="bt-card bt-goal">
                  <div className="bt-goaltop">
                    <span className="bt-goalname">{g.name}</span>
                    <button className="bt-del" aria-label={`Delete goal ${g.name}`} onClick={() => deleteGoal(g.id)}>×</button>
                  </div>
                  <div className="bt-goalnums">
                    <span className="bt-goalsaved">{fmt(g.saved)}</span>
                    <span className="bt-goaltarget">of {fmt(g.target)}</span>
                  </div>
                  <div className="bt-track bt-track-lg">
                    <div className={"bt-fill" + (done ? " bt-fill-done" : " bt-fill-gold")} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="bt-goalfoot">
                    {done ? (
                      <span className="bt-done">Goal reached 🎉</span>
                    ) : (
                      <span className="bt-remain">{fmt(g.target - g.saved)} to go</span>
                    )}
                    <div className="bt-contrib">
                      <input
                        className="bt-input bt-input-sm"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={contrib[g.id] || ""}
                        onChange={(e) => setContrib({ ...contrib, [g.id]: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && addToGoal(g.id)}
                        aria-label={`Amount to add to ${g.name}`}
                      />
                      <button className="bt-btn bt-btn-sm" onClick={() => addToGoal(g.id)}>Add</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {goalFormOpen ? (
              <div className="bt-card bt-goalform">
                <label className="bt-label">Goal name</label>
                <input
                  className="bt-input"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="Emergency fund"
                />
                <div className="bt-row2">
                  <div>
                    <label className="bt-label">Target ($)</label>
                    <input
                      className="bt-input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                      placeholder="3000"
                    />
                  </div>
                  <div>
                    <label className="bt-label">Already saved ($)</label>
                    <input
                      className="bt-input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={goalStart}
                      onChange={(e) => setGoalStart(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="bt-formactions">
                  <button className="bt-btn bt-btn-ghost" onClick={() => setGoalFormOpen(false)}>Cancel</button>
                  <button className="bt-btn" onClick={addGoal} disabled={!goalName.trim() || !(parseFloat(goalTarget) > 0)}>
                    Create goal
                  </button>
                </div>
              </div>
            ) : (
              <button className="bt-newgoal" onClick={() => setGoalFormOpen(true)}>＋ New goal</button>
            )}

            <p className="bt-note">
              Tip: when you move money into savings, record it as a "Savings transfer" in your
              spending too, so your monthly balance stays honest.
            </p>
          </section>
        )}
      </main>

      {/* ---------- floating add ---------- */}
      <button className="bt-fab" aria-label="Add transaction" onClick={() => openSheet("out")}>＋</button>

      {/* ---------- add sheet ---------- */}
      {sheetOpen && (
        <div className="bt-scrim" onClick={(e) => e.target === e.currentTarget && setSheetOpen(false)}>
          <div className="bt-sheet" role="dialog" aria-label="Add transaction">
            <div className="bt-grab" />
            <div className="bt-toggle">
              <button
                className={"bt-togglebtn" + (txType === "out" ? " bt-toggle-out" : "")}
                onClick={() => { setTxType("out"); setTxCat("groceries"); }}
              >
                Money out
              </button>
              <button
                className={"bt-togglebtn" + (txType === "in" ? " bt-toggle-in" : "")}
                onClick={() => { setTxType("in"); setTxCat("paycheque"); }}
              >
                Money in
              </button>
            </div>

            <label className="bt-label">Amount</label>
            <div className="bt-amountwrap">
              <span className="bt-dollar">$</span>
              <input
                autoFocus
                className="bt-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
              />
            </div>

            <label className="bt-label">Category</label>
            <div className="bt-chips">
              {catChips.map((c) => (
                <button
                  key={c.id}
                  className={"bt-chip" + (txCat === c.id ? " bt-chip-on" : "")}
                  style={txCat === c.id ? { background: c.color, borderColor: c.color } : {}}
                  onClick={() => setTxCat(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="bt-row2">
              <div>
                <label className="bt-label">Note (optional)</label>
                <input
                  className="bt-input"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder={txType === "out" ? "Zehrs run" : "July 15 pay"}
                />
              </div>
              <div>
                <label className="bt-label">Date</label>
                <input
                  className="bt-input"
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                />
              </div>
            </div>

            <div className="bt-formactions">
              <button className="bt-btn bt-btn-ghost" onClick={() => setSheetOpen(false)}>Cancel</button>
              <button className="bt-btn" onClick={saveTx} disabled={!(parseFloat(txAmount) > 0)}>
                {txType === "out" ? "Add money out" : "Add money in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- styles ---------------- */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

.bt-root {
  --ink: #0E2A24;
  --ink-2: #123830;
  --paper: #F3F6F2;
  --card: #FFFFFF;
  --line: #E1E8E1;
  --text: #22302B;
  --muted: #6C7A73;
  --green: #1F7A5C;
  --red: #A8433B;
  --gold: #C9A227;
  min-height: 100vh;
  background: var(--paper);
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}
.bt-shell { max-width: 560px; margin: 0 auto; padding: 0 16px; }

/* header */
.bt-header {
  background:
    radial-gradient(circle at 20% -40%, rgba(255,255,255,0.07), transparent 55%),
    radial-gradient(circle at 90% 130%, rgba(201,162,39,0.10), transparent 45%),
    var(--ink);
  color: #EAF2ED;
  padding: 18px 0 30px;
  border-bottom: 3px solid var(--gold);
}
.bt-monthnav { display: flex; align-items: center; justify-content: space-between; }
.bt-navbtn {
  width: 38px; height: 38px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.22); background: transparent;
  color: #EAF2ED; font-size: 20px; line-height: 1; cursor: pointer;
}
.bt-navbtn:hover { background: rgba(255,255,255,0.08); }
.bt-monthlabel { font-weight: 600; letter-spacing: 0.02em; text-align: center; }
.bt-today {
  display: block; margin: 2px auto 0; background: none; border: none;
  color: var(--gold); font-size: 11px; cursor: pointer; text-decoration: underline;
}
.bt-hero { text-align: center; margin-top: 18px; animation: bt-rise 0.5s ease both; }
.bt-herolabel {
  font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
  color: rgba(234,242,237,0.65);
}
.bt-balance {
  font-family: 'Fraunces', serif; font-weight: 500;
  font-size: clamp(44px, 12vw, 64px); line-height: 1.1;
  font-variant-numeric: tabular-nums; margin-top: 4px;
}
.bt-neg { color: #F0A9A0; }
.bt-inout { display: flex; gap: 10px; justify-content: center; margin-top: 12px; }
.bt-pill {
  font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 999px;
  font-variant-numeric: tabular-nums;
}
.bt-pill-in { background: rgba(72,187,142,0.18); color: #9FE0C4; }
.bt-pill-out { background: rgba(240,169,160,0.14); color: #F0B9B1; }

/* tabs */
.bt-body { padding-bottom: 110px; }
.bt-tabs { display: flex; gap: 4px; margin: 18px 0 6px; border-bottom: 1px solid var(--line); }
.bt-tab {
  flex: 1; padding: 10px 0 12px; background: none; border: none; cursor: pointer;
  font: 600 14px 'Inter', sans-serif; color: var(--muted);
  border-bottom: 2px solid transparent; margin-bottom: -1px;
}
.bt-tab-on { color: var(--ink); border-bottom-color: var(--ink); }

.bt-h2 {
  font-family: 'Fraunces', serif; font-weight: 600; font-size: 20px;
  color: var(--ink); margin: 20px 2px 12px;
}

/* ribbon (signature) */
.bt-ribbon {
  display: flex; height: 26px; border-radius: 13px; overflow: hidden;
  background: #E5DCC3; box-shadow: inset 0 1px 3px rgba(0,0,0,0.12);
}
.bt-seg { min-width: 3px; }
.bt-seg-left {
  background: repeating-linear-gradient(-45deg, #2E8B67, #2E8B67 6px, #27795a 6px, #27795a 12px);
}
.bt-note { font-size: 13px; color: var(--muted); margin: 10px 2px 16px; line-height: 1.5; }

/* cards & rows */
.bt-card {
  background: var(--card); border: 1px solid var(--line); border-radius: 14px;
  padding: 6px 14px; margin-bottom: 14px;
}
.bt-catrow, .bt-txrow { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); }
.bt-catrow:last-child, .bt-txrow:last-child { border-bottom: none; }
.bt-dot { width: 12px; height: 12px; border-radius: 50%; flex: none; }
.bt-catmain { flex: 1; min-width: 0; }
.bt-cattop { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 6px; }
.bt-catname { font-weight: 500; }
.bt-catamt { font-weight: 600; font-variant-numeric: tabular-nums; }
.bt-catpct { font-size: 12px; color: var(--muted); width: 34px; text-align: right; font-variant-numeric: tabular-nums; }
.bt-track { height: 6px; border-radius: 3px; background: #EDF1EC; overflow: hidden; }
.bt-track-lg { height: 10px; border-radius: 5px; }
.bt-fill { height: 100%; border-radius: inherit; transition: width 0.4s ease; }
.bt-fill-gold { background: var(--gold); }
.bt-fill-done { background: var(--green); }

/* activity */
.bt-daygroup { margin-bottom: 4px; }
.bt-dayhead {
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--muted); margin: 14px 2px 6px;
}
.bt-txmain { flex: 1; min-width: 0; }
.bt-txname { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bt-txcat { font-size: 12px; color: var(--muted); }
.bt-txamt { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
.bt-in { color: var(--green); }
.bt-out { color: var(--red); }
.bt-del {
  width: 26px; height: 26px; border-radius: 50%; border: none; background: transparent;
  color: #B7C0BA; font-size: 17px; line-height: 1; cursor: pointer; flex: none;
}
.bt-del:hover { background: #F4E5E3; color: var(--red); }

/* goals */
.bt-goal { padding: 14px; }
.bt-goaltop { display: flex; justify-content: space-between; align-items: center; }
.bt-goalname { font-weight: 600; font-size: 15px; }
.bt-goalnums { display: flex; align-items: baseline; gap: 6px; margin: 6px 0 8px; }
.bt-goalsaved { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 600; color: var(--ink); font-variant-numeric: tabular-nums; }
.bt-goaltarget { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }
.bt-goalfoot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; gap: 10px; }
.bt-remain { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.bt-done { font-size: 13px; font-weight: 600; color: var(--green); }
.bt-contrib { display: flex; gap: 6px; }
.bt-newgoal {
  width: 100%; padding: 13px; border-radius: 14px; cursor: pointer;
  border: 1.5px dashed #B9C6BC; background: transparent;
  font: 600 14px 'Inter', sans-serif; color: var(--ink);
}
.bt-newgoal:hover { background: #EAF0EA; }
.bt-goalform { padding: 14px; }

/* forms */
.bt-label { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin: 12px 0 5px; }
.bt-input {
  width: 100%; box-sizing: border-box; padding: 10px 12px; font: 500 15px 'Inter', sans-serif;
  border: 1px solid #CBD5CD; border-radius: 10px; background: #fff; color: var(--text);
}
.bt-input:focus { outline: 2px solid var(--ink); outline-offset: 1px; border-color: var(--ink); }
.bt-input-sm { width: 90px; padding: 8px 10px; font-size: 14px; }
.bt-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.bt-btn {
  padding: 11px 18px; border-radius: 10px; border: none; cursor: pointer;
  background: var(--ink); color: #fff; font: 600 14px 'Inter', sans-serif;
}
.bt-btn:disabled { opacity: 0.4; cursor: default; }
.bt-btn-sm { padding: 8px 14px; }
.bt-btn-ghost { background: transparent; color: var(--ink); border: 1px solid #CBD5CD; }
.bt-formactions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }

/* add sheet */
.bt-fab {
  position: fixed; right: 20px; bottom: 24px; width: 60px; height: 60px;
  border-radius: 50%; border: none; cursor: pointer; z-index: 40;
  background: var(--ink); color: #fff; font-size: 28px; line-height: 1;
  box-shadow: 0 6px 18px rgba(14,42,36,0.35);
}
.bt-fab:hover { background: var(--ink-2); }
.bt-scrim {
  position: fixed; inset: 0; background: rgba(14,42,36,0.45); z-index: 50;
  display: flex; align-items: flex-end; justify-content: center;
}
.bt-sheet {
  width: 100%; max-width: 560px; background: var(--paper);
  border-radius: 20px 20px 0 0; padding: 10px 18px 26px;
  max-height: 88vh; overflow-y: auto; animation: bt-up 0.28s ease both;
}
.bt-grab { width: 40px; height: 4px; border-radius: 2px; background: #C6CFC8; margin: 4px auto 12px; }
.bt-toggle { display: flex; background: #E4EAE4; border-radius: 12px; padding: 4px; gap: 4px; }
.bt-togglebtn {
  flex: 1; padding: 10px; border: none; border-radius: 9px; cursor: pointer;
  background: transparent; font: 600 14px 'Inter', sans-serif; color: var(--muted);
}
.bt-toggle-out { background: var(--red); color: #fff; }
.bt-toggle-in { background: var(--green); color: #fff; }
.bt-amountwrap { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #CBD5CD; border-radius: 12px; padding: 4px 14px; }
.bt-amountwrap:focus-within { outline: 2px solid var(--ink); outline-offset: 1px; }
.bt-dollar { font-family: 'Fraunces', serif; font-size: 24px; color: var(--muted); }
.bt-amount {
  flex: 1; border: none; background: none; padding: 8px 0;
  font-family: 'Fraunces', serif; font-size: 32px; font-weight: 500; color: var(--ink);
  font-variant-numeric: tabular-nums;
}
.bt-amount:focus { outline: none; }
.bt-chips { display: flex; flex-wrap: wrap; gap: 7px; }
.bt-chip {
  padding: 7px 12px; border-radius: 999px; cursor: pointer;
  border: 1px solid #C4CFC6; background: #fff;
  font: 500 13px 'Inter', sans-serif; color: var(--text);
}
.bt-chip-on { color: #fff; font-weight: 600; }

/* misc */
.bt-empty {
  background: var(--card); border: 1px dashed #C4CFC6; border-radius: 14px;
  padding: 22px 18px; font-size: 14px; color: var(--muted); line-height: 1.6; text-align: center;
}
.bt-emptyrow { padding: 16px 0; font-size: 14px; color: var(--muted); text-align: center; }
.bt-alert {
  margin-top: 14px; padding: 10px 14px; border-radius: 10px; font-size: 13px;
  background: #F8E8E6; color: #7C2D24; border: 1px solid #E8C4BF;
}

@keyframes bt-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes bt-up { from { transform: translateY(40px); opacity: 0.6; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .bt-hero, .bt-sheet { animation: none; }
  .bt-fill { transition: none; }
}
`;
