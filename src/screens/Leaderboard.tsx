import { useEffect, useMemo, useState } from "react";
import { CORE, ModeKey, MODE_LABEL, Player, hms, lastName, rosterOf, secondsToMidnightET, todaysField, dayKey } from "../lib/game";
import { getPref } from "../lib/prefs";
import { Eyebrow } from "../components/Chrome";
import { useDesktop } from "../lib/useMedia";
import { Board, fetchBoard, fetchTicker, hiddenRids, report } from "../lib/live";

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
  const [live, setLive] = useState<Board | null | undefined>(undefined);   // undefined = loading, null = backend unavailable
  const [hidden, setHidden] = useState<string[]>(hiddenRids());
  const [open, setOpen] = useState<string | null>(null);
  const [club, setClub] = useState<number | null>(null);
  useEffect(() => { fetchTicker().then((t) => t && !(t as any).failed && setClub(Number(t.perfect_all) || 0)); }, []);
  useEffect(() => {
    if (mode === "cap") return;
    let on = true;
    setLive(undefined); setOpen(null);
    const load = () => fetchBoard(mode).then((b) => { if (on) setLive(b && !(b as any).failed ? b : null); });
    load();
    const i = setInterval(load, 30000);
    return () => { on = false; clearInterval(i); };
  }, [mode]);
  const board = useMemo(() => {
    if (mode === "cap") return [];
    const field = todaysField(mode).map((f) => ({ ...f, top: topPick(f.picks) }));
    return CORE.leaderboard(field, mine ? { name: "YOU", wins: mine.wins, losses: mine.losses, rating: mine.rating, top: mine.top } : null) as
      { name: string; wins: number; losses: number; rating: number; top: string; rank: number; isMe?: boolean }[];
  }, [mode, mine?.wins, mine?.rating]);
  const isLive = !!live;
  const liveRows = live ? live.rows.filter((r) => !hidden.includes(r.rid)) : [];
  const top = isLive ? [] : board.slice(0, 10);
  const me = isLive ? null : board.find((r) => r.isMe);
  const liveMe = live?.me || null;
  const doReport = (rid: string, name: string) => {
    if (!window.confirm("Report the name “" + name + "”? It disappears from your board today, and it gets reviewed within 24 hours.")) return;
    report(mode, rid); setHidden(hiddenRids()); setOpen(null);
  };
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
          {mode !== "cap" && <span className="board-count">{(isLive ? live!.total : board.length).toLocaleString()} {isLive ? "real " : ""}teams today · record first, team rating breaks ties</span>}
        </div>
        {mode === "cap" ? (
          <div className="board-empty">
            <b>CAP CUP HAS NO BOARD.</b>
            <p>It’s you against history: beat the record team’s pace and the Cup is yours. Your wins and losses against the record teams show on the verdict screen after each season.</p>
            <button className="btn primary" onClick={() => go("/play/cap-cup")}>PLAY CAP CUP</button>
          </div>
        ) : live === undefined ? (
          <div className="board-empty"><p>Loading today’s board…</p></div>
        ) : isLive ? (
          <div className="board-table">
            <div className="bt-row head"><span>RANK</span><span className="bn">NAME</span><span className="rec">RECORD</span><span className="rt">RATING</span><span className="tp">TOP PICK</span></div>
            {liveRows.length === 0 && <div className="board-empty"><b>NO NAMES ON THE BOARD YET.</b><p>Finish a season and pick a display name to be the first.</p></div>}
            {liveRows.map((r) => {
              const mineRow = !!liveMe && liveMe.name === r.name && liveMe.wins === r.wins && liveMe.rating === r.rating;
              return (
                <div key={r.rid}>
                  <button className={"bt-row bt-btn" + (mineRow ? " me" : "")} aria-expanded={open === r.rid} onClick={() => setOpen(open === r.rid ? null : r.rid)}>
                    <span><i className={"rank-badge" + (r.rank <= 3 ? " top" : "")}>{r.rank}</i></span>
                    <span className="bn"><b>{mineRow && <em className="you-tag">YOU</em>}{r.name}</b><small className="m-top">{r.top_pick}</small></span>
                    <span className="rec">{r.wins}-{r.losses}</span>
                    <span className="rt">{r.rating.toFixed(1)}</span>
                    <span className="tp">{r.top_pick}</span>
                  </button>
                  {open === r.rid && (
                    <div className="bt-drop">
                      <ul>{["LW", "C", "RW", "D1", "D2", "G"].map((id) => r.lineup[id] && <li key={id}><span>{id.startsWith("D") ? "D" : id}</span><b>{r.lineup[id].name}</b><small>{r.lineup[id].team}</small></li>)}</ul>
                      {!mineRow && <button className="link-btn" onClick={() => doReport(r.rid, r.name)}>REPORT THIS NAME</button>}
                    </div>
                  )}
                </div>
              );
            })}
            {liveMe && !liveRows.some((r) => liveMe.name === r.name && liveMe.wins === r.wins) && (
              <><div className="bt-gap">· · ·</div>
              <div className="bt-row me">
                <span><i className="rank-badge">{liveMe.rank}</i></span>
                <span className="bn"><b><em className="you-tag">YOU</em>{liveMe.name || ""}</b><small className="m-top">{liveMe.name ? liveMe.top_pick : "No display name yet, so only you see this row"}</small></span>
                <span className="rec">{liveMe.wins}-{liveMe.losses}</span>
                <span className="rt">{liveMe.rating.toFixed(1)}</span>
                <span className="tp">{liveMe.top_pick}</span>
              </div></>
            )}
          </div>
        ) : (
          <div className="board-table">
            <div className="bt-row head"><span>RANK</span><span className="bn">NAME</span><span className="rec">RECORD</span><span className="rt">RATING</span><span className="tp">TOP PICK</span></div>
            {top.map((r) => <Row key={r.name + r.rank} r={r} label={label} />)}
            {me && me.rank > 10 && <><div className="bt-gap">· · ·</div><Row r={me} label={label} /></>}
          </div>
        )}
        {mode !== "cap" && !isLive && live !== undefined && <p className="board-note">The live board couldn’t be reached, so this is today’s simulated field: 1,000 bot drafts, the same for everyone, with your latest season slotted in.</p>}
      </section>
      <aside className="board-side">
        <div className="rank-card">
          <small>YOUR LATEST SEASON</small>
          {isLive && liveMe ? (
            <div className="rank-row"><b className="red">#{liveMe.rank}</b><span>{liveMe.wins}-{liveMe.losses} · {MODE_LABEL[mode]} · of {liveMe.total}</span></div>
          ) : !isLive && me ? (
            <div className="rank-row"><b className="red">#{me.rank}</b><span>{me.wins}-{me.losses} · {MODE_LABEL[mode]}</span></div>
          ) : <p className="rank-note">No {MODE_LABEL[mode]} season from you today yet.</p>}
          <button className="btn primary big" onClick={() => go(mode === "iq" ? "/play/ice-iq" : mode === "cap" ? "/play/cap-cup" : "/play/classic")}>{(isLive ? liveMe : me) ? "DRAFT AGAIN" : "START A DRAFT"}</button>
        </div>
        <div className="club-card">
          <p className="club-h"><span className="chip yellow" />THE 84-0 CLUB</p>
          <b>{club ?? 0}</b>
          <p>{club ? "Perfect 84-0 seasons since the live board opened." : "No one has gone 84-0 since the live board opened. A straight-ratings draft goes undefeated about 1 time in 900. Be the first."}</p>
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
