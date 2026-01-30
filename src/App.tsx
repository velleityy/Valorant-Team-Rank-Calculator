import React, { useMemo, useRef, useState } from "react";
import { RANK_OPTIONS, TEAM_CAP, scorePlayer, type RankKey } from "./scoring";
import { addTeam, clearTeams, loadTeams, type Player } from "./storage";
import "./index.css";

type PlayerRow = Player;

/* ---------- styles ---------- */
const selectStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ccc",
  background: "white",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  marginTop: 6,
  padding: 10,
  borderRadius: 10,
  border: "1px solid #ccc",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 12,
  padding: 12,
  background: "white",
};

const buttonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #ccc",
  background: "white",
  cursor: "pointer",
};

const primaryButtonStyle = (enabled: boolean): React.CSSProperties => ({
  ...buttonStyle,
  background: enabled ? "#111" : "#999",
  color: "white",
  cursor: enabled ? "pointer" : "not-allowed",
  borderColor: enabled ? "#111" : "#999",
});

/* ---------- tooltip ---------- */
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
        onClick={() => setOpen((v) => !v)}
        aria-label="How rank scoring works"
        title="How rank scoring works"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: "1px solid #bbb",
          background: "#f7f7f7",
          color: "#666",
          fontSize: 11,
          fontWeight: 600,
          cursor: "pointer",
          userSelect: "none",
          lineHeight: 1,
          padding: 0,
        }}
      >
        i
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "125%",
            left: 0,
            width: 320,
            maxWidth: "min(320px, 70vw)",
            background: "#222",
            color: "#f5f5f5",
            padding: 12,
            borderRadius: 10,
            fontSize: 13,
            lineHeight: 1.45,
            zIndex: 9999,
            boxShadow: "0 10px 28px rgba(0,0,0,0.25)",
            border: "1px solid rgba(255,255,255,0.08)",
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

  const breakdown = useMemo(
    () =>
      players.map((p) => ({
        ...p,
        ...scorePlayer(p.rankA1, p.rankA5),
      })),
    [players]
  );

  const total = useMemo(
    () => breakdown.reduce((s, p) => s + p.final, 0),
    [breakdown]
  );

  const overCap = total > TEAM_CAP;
  const remaining = TEAM_CAP - total;

  const canSubmit =
    teamName.trim().length > 0 &&
    !overCap &&
    players.length === 5 &&
    players.every((p) => p.ign.trim().length > 0);

  function updatePlayer(i: number, patch: Partial<PlayerRow>) {
    setPlayers((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p))
    );
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
      for (const pl of t.players) {
        counts[pl.rankA5] = (counts[pl.rankA5] ?? 0) + 1;
      }
    }
    return counts;
  }, [teams]);

  const registrationTooltip = (
    <>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>
        How rank scoring works
      </div>
      <div>
        Each player’s score is based on two competitive ranks:
        <ul style={{ margin: "6px 0 6px 18px" }}>
          <li>an earlier rank (V25 Act 1)</li>
          <li>a recent rank (V25 Act 5)</li>
        </ul>
        The recent rank is weighted more heavily to better represent current
        skill.
        <div style={{ marginTop: 8 }}>
          Player scores are added together to form a team total. Teams must
          remain at or below the point cap to be eligible.
        </div>
      </div>
    </>
  );

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: 20,
        fontFamily: "system-ui",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0 }}>VALORANT@UW Team Rank Calculator</h1>
        <span style={{ opacity: 0.8 }}>
          Team cap: <b>{TEAM_CAP}</b> points
        </span>
      </div>

      <div
        style={{ display: "flex", gap: 10, marginTop: 14, marginBottom: 16 }}
      >
        <button
          onClick={() => setTab("register")}
          style={{
            ...buttonStyle,
            background: tab === "register" ? "#f5f5f5" : "white",
          }}
        >
          Registration
        </button>
        <button
          onClick={() => {
            setTab("admin");
            setAdminRefresh((x) => x + 1);
          }}
          style={{
            ...buttonStyle,
            background: tab === "admin" ? "#f5f5f5" : "white",
          }}
        >
          Organizer View
        </button>
      </div>

      {tab === "register" ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            background: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <h2 style={{ margin: 0 }}>Team Registration</h2>
            <InfoTooltip text={registrationTooltip} />
          </div>

          <label style={{ display: "block", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Team Name</div>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Husky Phantoms"
              style={inputStyle}
            />
          </label>

          <div style={{ display: "grid", gap: 10 }}>
            {players.map((p, i) => {
              const b = breakdown[i];
              return (
                <div
                  key={i}
                  style={{
                    ...cardStyle,
                    display: "grid",
                    gridTemplateColumns: "1.1fr 1fr 1fr 0.6fr",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Player {i + 1} IGN
                    </div>
                    <input
                      value={p.ign}
                      onChange={(e) => updatePlayer(i, { ign: e.target.value })}
                      placeholder="IGN#TAG"
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Rank (V25 A1)
                    </div>
                    <select
                      value={p.rankA1}
                      onChange={(e) =>
                        updatePlayer(i, { rankA1: e.target.value as RankKey })
                      }
                      style={selectStyle}
                    >
                      {RANK_OPTIONS.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      Rank (V25 A5)
                    </div>
                    <select
                      value={p.rankA5}
                      onChange={(e) =>
                        updatePlayer(i, { rankA5: e.target.value as RankKey })
                      }
                      style={selectStyle}
                    >
                      {RANK_OPTIONS.map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Points</div>
                    <div style={{ fontSize: 26, fontWeight: 900 }}>
                      {b.final}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 12,
              border: "1px solid #ddd",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              background: "#fff",
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Team Total</div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{total}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {overCap ? (
                  <span style={{ color: "#b91c1c", fontWeight: 700 }}>
                    Over cap by {Math.abs(remaining)} points
                  </span>
                ) : (
                  <span style={{ color: "green", fontWeight: 700 }}>
                    {remaining} points remaining
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={resetForm} style={buttonStyle}>
                Reset
              </button>
              <button
                onClick={submit}
                disabled={!canSubmit}
                style={primaryButtonStyle(canSubmit)}
              >
                Submit Team
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
            Note: This demo stores submissions in this browser only (local
            storage).
          </div>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            background: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0 }}>Organizer View</h2>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={() => setAdminRefresh((x) => x + 1)}
                style={buttonStyle}
              >
                Refresh
              </button>
              <button
                onClick={() => {
                  clearTeams();
                  setAdminRefresh((x) => x + 1);
                }}
                style={buttonStyle}
              >
                Clear All (local)
              </button>
            </div>
          </div>

          <div style={{ marginTop: 12, marginBottom: 14, opacity: 0.85 }}>
            Total teams saved in this browser: <b>{teams.length}</b>
          </div>

          <h3 style={{ marginBottom: 8 }}>
            Rank Distribution (players, using V25 A5)
          </h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 16,
            }}
          >
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
                    }}
                  >
                    <b>{rank}</b>: {count}
                  </span>
                ))
            )}
          </div>

          <h3 style={{ marginBottom: 8 }}>Teams</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {teams.map((t) => (
              <div
                key={t.id}
                style={{
                  ...cardStyle,
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
                    <div style={{ fontSize: 18, fontWeight: 900 }}>
                      {t.teamName}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      Submitted: {new Date(t.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>Total</div>
                    <div style={{ fontSize: 26, fontWeight: 900 }}>
                      {t.totalPoints}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: t.totalPoints > TEAM_CAP ? "#b91c1c" : "green",
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
                      }}
                    >
                      <div>
                        <b>{p.ign}</b>
                      </div>
                      <div>A1: {p.rankA1}</div>
                      <div style={{ opacity: 0.8 }}>A5: {p.rankA5}</div>
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
