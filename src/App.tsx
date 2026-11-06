import { useEffect, useMemo, useRef, useState } from "react";
import { RANK_OPTIONS, TEAM_CAP, scorePlayer, type RankKey } from "./scoring";
import "./index.css";

type Player = { ign: string; rankA1: RankKey; rankA5: RankKey };
const makePlayer = (): Player => ({ ign: "", rankA1: "iron", rankA5: "iron" });
const makeRoster = () => Array.from({ length: 5 }, makePlayer);
const isValidRiotId = (s: string) => {
  const parts = s.trim().split("#");
  return parts.length === 2 && parts[0].trim().length >= 3 &&
    parts[0].trim().length <= 16 && /^[a-zA-Z0-9]{3,5}$/.test(parts[1]);
};

function RulesTooltip() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <span className="tooltip-anchor" ref={root}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}>
      <button className="info-button" type="button"
        aria-label="How rank scoring works" aria-expanded={open}
        onClick={() => setOpen(!open)}>ⓘ</button>
      {open && <span className="tooltip-panel" role="tooltip">
        <strong>How rank scoring works</strong>
        <span>Each player’s score is based on two competitive ranks:</span>
        <span>• Your rank from V26 Act 4 (30%)<br />• Your rank from V26 Act 6 (70%)</span>
        <span>Your more recent rank counts more, so your score better reflects how you're playing now.</span>
        <span>We add all five players' scores together. Your team needs 85 points or fewer to stay within the cap.</span>
      </span>}
    </span>
  );
}

export default function App() {
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<Player[]>(makeRoster);
  const [touched, setTouched] = useState<boolean[]>(Array(5).fill(false));
  const [copied, setCopied] = useState(false);

  const breakdown = useMemo(
    () => players.map(p => scorePlayer(p.rankA1, p.rankA5)), [players]
  );
  const total = breakdown.reduce((sum, p) => sum + p.final, 0);
  const remaining = TEAM_CAP - total;
  const overCap = remaining < 0;
  const complete = teamName.trim().length > 0 && players.every(p => isValidRiotId(p.ign));
  const progress = Math.min(100, (total / TEAM_CAP) * 100);

  function updatePlayer(index: number, patch: Partial<Player>) {
    setPlayers(previous => previous.map((p, i) => i === index ? { ...p, ...patch } : p));
    setCopied(false);
  }
  function reset() {
    setTeamName("");
    setPlayers(makeRoster());
    setTouched(Array(5).fill(false));
    setCopied(false);
  }

  async function copySummary() {
    if (!complete) return;
    const rows = players.map((player, i) =>
      (i + 1) + ". " + player.ign.trim() + " | V26 Act 4: " +
      RANK_OPTIONS.find(r => r.key === player.rankA1)?.label +
      " | V26 Act 6: " + RANK_OPTIONS.find(r => r.key === player.rankA5)?.label +
      " | " + breakdown[i].final + " pts"
    );
    const report = [
      "VALORANT @ UW — Team Rank Calculator",
      "Team: " + teamName.trim(),
      ...rows,
      "Team score: " + total + " / " + TEAM_CAP,
      "Status: " + (overCap ? "Over the cap" : "Within the cap"),
      "Calculated estimate only — not a tournament registration."
    ].join("\n");
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
    } catch {
      window.prompt("Copy your team summary:", report);
    }
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="brand-mark" aria-hidden="true"><span>V</span></div>
        <div className="brand-text"><strong>VALORANT <span>@ UW</span></strong><small>TOURNAMENT TOOLS</small></div>
        <div className="header-cap"><span className="status-dot" /> {TEAM_CAP} POINT CAP</div>
      </header>

      <main>
        <section className="hero">
          <div className="eyebrow"><span className="eyebrow-line" /> COMPETITIVE TEAM BUILDER</div>
          <h1>Build your roster.<br /><span>Stay within the cap.</span></h1>
          <p>Enter your team's ranks to see where you stand against the 85-point limit.</p>
          <div className="hero-stats">
            <div><strong>05</strong><span>PLAYERS</span></div>
            <div><strong>30<span>%</span></strong><span>V26 ACT 4</span></div>
            <div><strong>70<span>%</span></strong><span>V26 ACT 6</span></div>
            <div><strong>{TEAM_CAP}</strong><span>MAX POINTS</span></div>
          </div>
        </section>

        <section className="calculator-card" aria-labelledby="calculator-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">01 / TEAM SETUP</span>
              <div className="heading-with-help">
                <h2 id="calculator-title">Team Rank Calculator</h2>
                <RulesTooltip />
              </div>
            </div>
            <span className="draft-pill">LIVE CALCULATION</span>
          </div>

          <label className="field-block" htmlFor="team-name">
            <span className="field-label">TEAM NAME</span>
            <input id="team-name" className="field-control team-input"
              value={teamName} maxLength={60}
              onChange={event => { setTeamName(event.target.value); setCopied(false); }}
              placeholder="e.g. Husky Phantoms" />
          </label>

          <div className="roster-heading">
            <div><span className="section-kicker">02 / YOUR ROSTER</span><h3>Players <span>({players.length}/5)</span></h3></div>
            <p>Add each player's Riot ID and ranks</p>
          </div>

          <div className="roster-head" aria-hidden="true">
            <span>PLAYER / RIOT ID</span><span>V26 ACT 4 <small>30%</small></span>
            <span>V26 ACT 6 <small>70%</small></span><span>POINTS</span>
          </div>
          <div className="roster-list">
            {players.map((player, index) => {
              const invalid = touched[index] && player.ign.trim() !== "" && !isValidRiotId(player.ign);
              return (
                <div className="player-row" key={index}>
                  <div className="player-id">
                    <label htmlFor={"riot-" + index} className="mobile-label">PLAYER {index + 1} · RIOT ID</label>
                    <div className="riot-field">
                      <span className="player-index">{String(index + 1).padStart(2, "0")}</span>
                      <input id={"riot-" + index} className={"field-control riot-input" + (invalid ? " invalid" : "")}
                        value={player.ign} onChange={event => updatePlayer(index, { ign: event.target.value })}
                        onBlur={() => setTouched(previous => previous.map((value, i) => i === index ? true : value))}
                        placeholder={"Player " + (index + 1) + " Riot ID#tagline"} autoComplete="off" spellCheck={false}
                        aria-invalid={invalid} aria-describedby={invalid ? "riot-error-" + index : undefined} />
                    </div>
                    {invalid && <span className="field-error" id={"riot-error-" + index}>Use a Riot ID such as Player Name#UW25 (name 3–16 characters, tag 3–5 letters or numbers).</span>}
                  </div>
                  <div className="rank-field">
                    <label className="mobile-label" htmlFor={"a1-" + index}>V26 ACT 4 · 30%</label>
                    <select id={"a1-" + index} className="field-control rank-select" value={player.rankA1}
                      onChange={event => updatePlayer(index, { rankA1: event.target.value as RankKey })}>
                      {RANK_OPTIONS.map(rank => <option key={rank.key} value={rank.key}>{rank.label}</option>)}
                    </select>
                  </div>
                  <div className="rank-field">
                    <label className="mobile-label" htmlFor={"a5-" + index}>V26 ACT 6 · 70%</label>
                    <select id={"a5-" + index} className="field-control rank-select" value={player.rankA5}
                      onChange={event => updatePlayer(index, { rankA5: event.target.value as RankKey })}>
                      {RANK_OPTIONS.map(rank => <option key={rank.key} value={rank.key}>{rank.label}</option>)}
                    </select>
                  </div>
                  <div className="player-points"><span className="mobile-label">POINTS</span><strong>{breakdown[index].final}</strong></div>
                </div>
              );
            })}
          </div>

          <div className="score-panel">
            <div className="score-top">
              <div><span className="score-caption">TEAM SCORE</span>
                <div className="score-number">{total}<span> / {TEAM_CAP}</span></div>
              </div>
              <div className={"eligibility " + (overCap ? "over" : "within")}>
                <span className="eligibility-dot" /> {overCap ? "OVER THE CAP" : "WITHIN THE CAP"}
              </div>
            </div>
            <div className="score-track" role="progressbar" aria-label="Team points used"
              aria-valuenow={Math.min(total, TEAM_CAP)} aria-valuemin={0} aria-valuemax={TEAM_CAP}>
              <div className={"score-fill" + (overCap ? " over-fill" : "")} style={{ width: progress + "%" }} />
            </div>
            <p className={"score-help" + (overCap ? " score-warning" : "")}>
              {overCap ? "Your team is " + Math.abs(remaining) + (Math.abs(remaining) === 1 ? " point" : " points") + " over the limit. Try adjusting your lineup." :
                remaining + " points left before you reach the cap."}
            </p>
            <div className="actions">
              <button type="button" className="reset-btn" onClick={reset}>Reset roster</button>
              <button type="button" className="primary-btn" disabled={!complete}
                onClick={copySummary}>{copied ? "✓ Results copied" : "Copy team results ↗"}</button>
            </div>
          </div>
          <p className="disclaimer">This is an eligibility calculator, not a registration form. No team data is sent to tournament organizers or stored on a server.</p>
        </section>
      </main>
      <footer className="site-footer">Built by <a href="https://www.linkedin.com/in/elaineshsu/" target="_blank" rel="noopener noreferrer" aria-label="Elaine Hsu on LinkedIn">Elaine Hsu</a><span aria-hidden="true"> · </span>Est. 2025</footer>
    </div>
  );
}
