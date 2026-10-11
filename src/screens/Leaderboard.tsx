import { useEffect, useMemo, useState } from "react";
import { CORE, ModeKey, MODE_LABEL, Player, hms, lastName, rosterOf, secondsToMidnightET, todaysField, dayKey } from "../lib/game";
import { getPref } from "../lib/prefs";
import { Eyebrow } from "../components/Chrome";
import { useDesktop } from "../lib/useMedia";

export interface Latest { day: number; wins: number; losses: number; rating: number; top: string }
export function latestFor(mode: ModeKey): Latest | null {
  try { const v = JSON.parse(getPref("latest." + mode, "null")); return v && v.day === dayKey() ? v : null; } catch { return null; }
}
export function topPick(picks: Record<string, Player>) {
  const p = Object.values(picks).sort((a, b) => b.rating - a.rating)[0];
  if (!p) return "";
  const r = rosterOf(p);
  return lastName(p.name) + " · " + r.fr + " " + String(r.decade).slice(2) + "s";
}

export function Leaderboard({ go }: { go: (p: string) => void }) {
  const desktop = useDesktop();
  const [mode, setMode] = useState<ModeKey>("classic");
  const [t, setT] = useState(secondsToMidnightET());
  useEffect(() => { const i = setInterval(() => setT(secondsToMidnightET()), 1000); return () => clearInterval(i); }, []);
  const mine = mode === "cap" ? null : latestFor(mode);
  const board = useMemo(() => {
    if (mode === "cap") return [];
    const field = todaysField(mode).map((f) => ({ ...f, top: topPick(f.picks) }));
    return CORE.leaderboard(field, mine ? { name: "YOU", wins: mine.wins, losses: mine.losses, rating: mine.rating, top: mine.top } : null) as
      { name: string; wins: number; losses: number; rating: number; top: string; rank: number; isMe?: boolean }[];
  }, [mode, mine?.wins, mine?.rating]);
  const top = board.slice(0, 10);
  const me = board.find((r) => r.isMe);
  const label = (n: string) => n.replace(/^sim-/, "SIM-");

  return (
    <div className="board-page">
      <section className="board-main">
        <Eyebrow color="yellow">[TODAY’S BOARD]</Eyebrow>
        <div className="board-title">
          <h1>WHO’S CLOSEST{desktop ? " " : <br />}TO 84-0</h1>
          <span className="reset-pill"><small>RESETS IN</small><b>{hms(t)}</b></span>
        </div>
        <div className="board-tabs-row">
          <div className="board-tabs" role="tablist">
            {(["classic", "iq", "cap"] as ModeKey[]).map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} className={mode === m ? "on" : ""} onClick={() => setMode(m)}>{MODE_LABEL[m]}</button>
            ))}
          </div>
          {mode !== "cap" && <span className="board-count">{board.length.toLocaleString()} teams today · record first, team rating breaks ties</span>}
        </div>
        {mode === "cap" ? (
          <div className="board-empty">
            <b>CAP CUP HAS NO BOARD.</b>
            <p>It’s you against history: beat the record team’s pace and the Cup is yours. Your wins and losses against the record teams show on the verdict screen after each season.</p>
            <button className="btn primary" onClick={() => go("/play/cap-cup")}>PLAY CAP CUP</button>
          </div>
        ) : (
          <div className="board-table">
            <div className="bt-row head"><span>RANK</span><span className="bn">NAME</span><span className="rec">RECORD</span><span className="rt">RATING</span><span className="tp">TOP PICK</span></div>
            {top.map((r) => <Row key={r.name + r.rank} r={r} label={label} />)}
            {me && me.rank > 10 && <><div className="bt-gap">· · ·</div><Row r={me} label={label} /></>}
          </div>
        )}
        <p className="board-note">The live leaderboard opens soon. Until then, today’s board is 1,000 simulated drafts, the same field for everyone, and your latest season slots in among them.</p>
      </section>
      <aside className="board-side">
        <div className="rank-card">
          <small>YOUR LATEST SEASON</small>
          {me ? (
            <div className="rank-row"><b className="red">#{me.rank}</b><span>{me.wins}-{me.losses} · {MODE_LABEL[mode]}</span></div>
          ) : <p className="rank-note">No {MODE_LABEL[mode]} season from you today yet.</p>}
          <button className="btn primary big" onClick={() => go(mode === "iq" ? "/play/ice-iq" : mode === "cap" ? "/play/cap-cup" : "/play/classic")}>{me ? "DRAFT AGAIN" : "START A DRAFT"}</button>
        </div>
        <div className="club-card">
          <p className="club-h"><span className="chip yellow" />THE 84-0 CLUB</p>
          <b>0</b>
          <p>The club opens with the live board. A straight-ratings draft goes undefeated about 1 time in 900. Be the first name on this card.</p>
        </div>
        <ul className="board-rules">
          <li>Your latest season replaces your row, even if it’s worse.</li>
          <li>Resets every night at midnight Eastern.</li>
          <li>Offensive names are blocked. Anyone can report a name.</li>
        </ul>
      </aside>
    </div>
  );
}

function Row({ r, label }: { r: { name: string; wins: number; losses: number; rating: number; top: string; rank: number; isMe?: boolean }; label: (n: string) => string }) {
  return (
    <div className={"bt-row" + (r.isMe ? " me" : "")}>
      <span><i className={"rank-badge" + (r.rank <= 3 ? " top" : "")}>{r.rank}</i></span>
      <span className="bn"><b>{r.isMe ? <em className="you-tag">YOU</em> : label(r.name)}</b><small className="m-top">{r.top}</small></span>
      <span className="rec">{r.wins}-{r.losses}</span>
      <span className="rt">{r.rating.toFixed(1)}</span>
      <span className="tp">{r.top}</span>
    </div>
  );
}
