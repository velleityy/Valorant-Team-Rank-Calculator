// src/App.tsx
import React, { useMemo, useRef, useState } from "react";
import { RANK_OPTIONS, TEAM_CAP, scorePlayer, type RankKey } from "./scoring";
import { addTeam, clearTeams, loadTeams, type Player } from "./storage";
import "./index.css";

type PlayerRow = Player;

/* ---------- UI styles ---------- */
const page: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: 24,
  fontFamily: "system-ui",
  color: "#111",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const title: React.CSSProperties = { margin: 0, fontSize: 30, fontWeight: 900 };

const pill: React.CSSProperties = {
  fontSize: 13,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e5e5e5",
  background: "#fafafa",
  color: "#333",
};

const tabs: React.CSSProperties = { display: "flex", gap: 8, marginBottom: 16 };

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: active ? "#111" : "white",
  color: active ? "white" : "#111",
  cursor: "pointer",
  fontWeight: 700,
});

const card: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  background: "white",
  padding: 16,
};

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  marginBottom: 6,
};

const inputBase: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  borderRadius: 12,
  border: "1px solid #d9d9d9",
};

const selectBase: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: 10,
  borderRadius: 12,
  border: "1px solid #d9d9d9",
  background: "white",
};

const helperText: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  opacity: 0.75,
};

const tableWrap: React.CSSProperties = {
  border: "1px solid #ededed",
  borderRadius: 14,
  overflow: "hidden",
  marginTop: 12,
};

const headerRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 1fr 1fr 0.5fr",
  gap: 10,
  padding: "10px 12px",
  background: "#fafafa",
  borderBottom: "1px solid #eee",
  fontSize: 12,
  fontWeight: 800,
  color: "#444",
};

const playerRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.35fr 1fr 1fr 0.5fr",
  gap: 10,
  padding: "12px 12px",
  borderBottom: "1px solid #f0f0f0",
  alignItems: "start",
};

const pointsCell: React.CSSProperties = {
  textAlign: "right",
  fontWeight: 900,
  fontSize: 22,
  paddingTop: 8,
};

const errorText: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: "#b91c1c",
  fontWeight: 700,
};

const footer: React.CSSProperties = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  border: "1px solid #eee",
  background: "#fafafa",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const footerTotal: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  marginTop: 2,
};

const btn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #d9d9d9",
  background: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const primaryBtn = (enabled: boolean): React.CSSProperties => ({
  ...btn,
  borderColor: enabled ? "#111" : "#bbb",
  background: enabled ? "#111" : "#bbb",
  color: "white",
  cursor: enabled ? "pointer" : "not-allowed",
});

/* ---------- single tooltip (only next to Team Registration) ---------- */
function InfoTooltip({ text }: { text: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement | null>(null);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <span
      ref={rootRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)} // mobile-friendly
        aria-label="How rank scoring works"
        title="How rank scoring works"
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          border: "1px solid #d1d5db",
          background: "white",
          color: "#6b7280",
          fontSize: 12,
          fontWeight: 800,
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ?
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "130%",
            left: 0,
            width: 360,
            maxWidth: "min(360px, 80vw)",
            background: "#222",
            color: "#f5f5f5",
            padding: 12,
            borderRadius: 12,
            fontSize: 13,
            lineHeight: 1.45,
            zIndex: 9999,
            boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
          }}
        >
          {text}
        </div>
      )}
    </span>
  );
}

/* ---------- helpers ---------- */
const emptyPlayer = (): PlayerRow => ({
  ign: "",
  rankA1: "iron",
  rankA5: "iron",
});

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Gentle auto-format:
 * - trims left whitespace
 * - if user types a space and no # yet, we convert the first space to #
 *   e.g. "Elaine UW" -> "Elaine#UW"
 */
function normalizeRiotIdInput(raw: string): string {
  let s = raw.replace(/^\s+/, "");
  if (!s.includes("#")) {
    const idx = s.indexOf(" ");
    if (idx !== -1) s = s.slice(0, idx) + "#" + s.slice(idx + 1);
  }
  return s;
}

function isValidRiotId(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  // Must be "name#tag" with at least 1 char on each side, and only one #
  const parts = s.split("#");
  if (parts.length !== 2) return false;
  return parts[0].trim().length > 0 && parts[1].trim().length > 0;
}

export default function App() {
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<PlayerRow[]>([
    emptyPlayer(),
    emptyPlayer(),
    emptyPlayer(),
    emptyPlayer(),
    emptyPlayer(),
  ]);

  const [tab, setTab] = useState<"register" | "admin">("register");
  const [adminRefresh, setAdminRefresh] = useState(0);

  // track which Riot ID fields have been touched (to show validation messages)
  const [touched, setTouched] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);

  const breakdown = useMemo(
    () => players.map((p) => ({ ...p, ...scorePlayer(p.rankA1, p.rankA5) })),
    [players]
  );

  const total = useMemo(
    () => breakdown.reduce((s, p) => s + p.final, 0),
    [breakdown]
  );
  const overCap = total > TEAM_CAP;
  const remaining = TEAM_CAP - total;

  const idValid = useMemo(
    () => players.map((p) => isValidRiotId(p.ign)),
    [players]
  );

  const canSubmit =
    teamName.trim().length > 0 &&
    !overCap &&
    players.length === 5 &&
    idValid.every(Boolean);

  function updatePlayer(i: number, patch: Partial<PlayerRow>) {
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p))
    );
  }

  function markTouched(i: number) {
    setTouched((prev) => prev.map((v, idx) => (idx === i ? true : v)));
  }

  function resetForm() {
    setTeamName("");
    setPlayers([
      emptyPlayer(),
      emptyPlayer(),
      emptyPlayer(),
      emptyPlayer(),
      emptyPlayer(),
    ]);
    setTouched([false, false, false, false, false]);
  }

  function submit() {
    if (!canSubmit) return;

    addTeam({
      id: uid(),
      createdAt: new Date().toISOString(),
      teamName: teamName.trim(),
      players: players.map((p) => ({
        ign: p.ign.trim(),
        rankA1: p.rankA1,
        rankA5: p.rankA5,
      })),
      totalPoints: total,
    });

    resetForm();
    setTab("admin");
    setAdminRefresh((x) => x + 1);
  }

  const teams = useMemo(() => {
    adminRefresh;
    return loadTeams();
  }, [adminRefresh]);

  const distribution = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of teams) {
      for (const pl of t.players)
        counts[pl.rankA5] = (counts[pl.rankA5] ?? 0) + 1;
    }
    return counts;
  }, [teams]);

  // ✅ previous tooltip description you liked (no equations)
  const registrationTooltip = (
    <>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>
        How rank scoring works
      </div>
      <div style={{ marginBottom: 8 }}>
        Each player’s score is based on two competitive ranks:
      </div>
      <ul style={{ margin: "0 0 8px 18px" }}>
        <li>an earlier rank (V25 Act 1)</li>
        <li>a recent rank (V25 Act 5)</li>
      </ul>
      <div style={{ marginBottom: 8 }}>
        The recent rank is weighted more heavily to better represent current
        skill.
      </div>
      <div style={{ marginBottom: 8 }}>
        Player scores are added together to form a team total. Teams must remain
        at or below the point cap to be eligible.
      </div>
    </>
  );

  return (
    <div style={page}>
      <div style={topBar}>
        <h1 style={title}>VALORANT@UW Team Rank Calculator</h1>
        <span style={pill}>
          Team cap: <b>{TEAM_CAP}</b> points
        </span>
      </div>

      <div style={tabs}>
        <button
          style={tabBtn(tab === "register")}
          onClick={() => setTab("register")}
        >
          Registration
        </button>
        <button
          style={tabBtn(tab === "admin")}
          onClick={() => {
            setTab("admin");
            setAdminRefresh((x) => x + 1);
          }}
        >
          Organizer View
        </button>
      </div>

      {tab === "register" ? (
        <div style={card}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 900,
                lineHeight: 1.1,
              }}
            >
              Team Registration
            </h2>
            <div style={{ transform: "translateY(1px)" }}>
              <InfoTooltip text={registrationTooltip} />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={label}>Team Name</div>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Husky Phantoms"
              style={inputBase}
            />
          </div>

          <div style={helperText}>
            Player Riot ID format: <b>Name#TAG</b> (example:{" "}
            <b>UW Chungus#velle</b>)
          </div>

          <div style={tableWrap}>
            <div style={headerRow}>
              <div>Player</div>
              <div>Rank (V25 A1)</div>
              <div>Rank (V25 A5)</div>
              <div style={{ textAlign: "right" }}>Points</div>
            </div>

            {players.map((p, i) => {
              const valid = idValid[i];
              const showError = touched[i] && !valid;

              const inputStyle: React.CSSProperties = {
                ...inputBase,
                borderColor: showError
                  ? "#ef4444"
                  : valid && p.ign.trim()
                  ? "#10b981"
                  : "#d9d9d9",
              };

              return (
                <div key={i} style={playerRow}>
                  <div>
                    <input
                      value={p.ign}
                      onChange={(e) => {
                        const next = normalizeRiotIdInput(e.target.value);
                        updatePlayer(i, { ign: next });
                      }}
                      onBlur={() => markTouched(i)}
                      placeholder={`Player ${i + 1} Riot ID#tagline`}
                      style={inputStyle}
                      inputMode="text"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {showError && (
                      <div style={errorText}>
                        Please use the format Name#TAG (example: UW
                        Chungus#velle)
                      </div>
                    )}
                  </div>

                  <select
                    value={p.rankA1}
                    onChange={(e) =>
                      updatePlayer(i, { rankA1: e.target.value as RankKey })
                    }
                    style={selectBase}
                  >
                    {RANK_OPTIONS.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={p.rankA5}
                    onChange={(e) =>
                      updatePlayer(i, { rankA5: e.target.value as RankKey })
                    }
                    style={selectBase}
                  >
                    {RANK_OPTIONS.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  <div style={pointsCell}>{breakdown[i].final}</div>
                </div>
              );
            })}
          </div>

          <div style={footer}>
            <div style={{ display: "grid", gap: 4 }}>
              <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 800 }}>
                Team Total
              </div>
              <div style={footerTotal}>{total}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {overCap ? (
                  <span style={{ color: "#b91c1c", fontWeight: 900 }}>
                    Over cap by {Math.abs(remaining)} points
                  </span>
                ) : (
                  <span style={{ color: "#0f7a2e", fontWeight: 900 }}>
                    {remaining} points remaining
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button style={btn} onClick={resetForm}>
                Reset
              </button>
              <button
                style={primaryBtn(canSubmit)}
                onClick={submit}
                disabled={!canSubmit}
              >
                Submit Team
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Note: This demo stores submissions in this browser only (local
            storage).
          </div>
        </div>
      ) : (
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
              Organizer View
            </h2>

            <div style={{ display: "flex", gap: 10 }}>
              <button style={btn} onClick={() => setAdminRefresh((x) => x + 1)}>
                Refresh
              </button>
              <button
                style={btn}
                onClick={() => {
                  clearTeams();
                  setAdminRefresh((x) => x + 1);
                }}
              >
                Clear All (local)
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, opacity: 0.85 }}>
            Total teams saved in this browser: <b>{teams.length}</b>
          </div>

          <h3 style={{ marginTop: 16, marginBottom: 8, fontSize: 16 }}>
            Rank Distribution (V25 A5)
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Object.keys(distribution).length === 0 ? (
              <div style={{ opacity: 0.7 }}>No teams yet.</div>
            ) : (
              Object.entries(distribution)
                .sort((a, b) => b[1] - a[1])
                .map(([rank, count]) => (
                  <span
                    key={rank}
                    style={{
                      border: "1px solid #eee",
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "#fafafa",
                      fontSize: 13,
                    }}
                  >
                    <b>{rank}</b>: {count}
                  </span>
                ))
            )}
          </div>

          <h3 style={{ marginTop: 18, marginBottom: 10, fontSize: 16 }}>
            Teams
          </h3>
          <div style={{ display: "grid", gap: 10 }}>
            {teams.map((t) => (
              <div
                key={t.id}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 12,
                  background: t.totalPoints > TEAM_CAP ? "#fff5f5" : "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>
                      {t.teamName}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      Submitted: {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{ fontSize: 12, opacity: 0.7, fontWeight: 800 }}
                    >
                      Total
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>
                      {t.totalPoints}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 900,
                        color: t.totalPoints > TEAM_CAP ? "#b91c1c" : "#0f7a2e",
                      }}
                    >
                      {t.totalPoints > TEAM_CAP ? "OVER CAP" : "OK"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                  {t.players.map((p, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.2fr 1fr 1fr",
                        gap: 10,
                        padding: "6px 8px",
                        borderRadius: 10,
                        background: "#fafafa",
                        border: "1px solid #f0f0f0",
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <b>{p.ign}</b>
                      </div>
                      <div>A1: {p.rankA1}</div>
                      <div style={{ opacity: 0.85 }}>A5: {p.rankA5}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
            Tip: If you want shared submissions across devices, we can swap
            local storage for Supabase later.
          </div>
        </div>
      )}
    </div>
  );
}
