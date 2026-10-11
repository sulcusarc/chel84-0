import { useEffect, useRef, useState } from "react";
import { CORE, BonusItem, streaks } from "../lib/game";
import { Session } from "../lib/session";
import { reducedMotion } from "../lib/prefs";
import { useDesktop } from "../lib/useMedia";
import { HalfRink, JerseyStrip } from "../components/Rink";
import { BonusChip, Eyebrow } from "../components/Chrome";

const MS_PER_GAME = 75;   // one fixed pace (what used to be 2x): a full season takes about 6 seconds

export function SimScreen({ s, onDone, setTitle }: { s: Session; onDone: () => void; setTitle: (t: string) => void }) {
  const desktop = useDesktop();
  const season = s.season!;
  const [shown, setShown] = useState(() => (reducedMotion() ? 84 : 0));
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const iq = s.mode === "iq";

  useEffect(() => {
    if (shown >= 84) {
      const t = setTimeout(() => doneRef.current(), reducedMotion() ? 200 : 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setShown((n) => Math.min(84, n + 1)), MS_PER_GAME);
    return () => clearTimeout(t);
  }, [shown]);

  useEffect(() => { setTitle(shown >= 84 ? "FINAL" : (desktop ? "SEASON · " : "") + "GAME " + Math.max(1, shown) + " OF 84"); }, [shown, setTitle, desktop]);

  const played = season.games.slice(0, shown);
  const wins = played.filter((g) => g.win).length, losses = played.length - wins;
  const pace = played.length ? Math.round((wins / played.length) * 84) : 0;
  const st = streaks(played);
  const lastLoss = [...played].reverse().find((g) => !g.win);
  const cur = played.length ? played[played.length - 1] : null;
  let curRun = 0;
  for (let i = played.length - 1; i >= 0 && cur && played[i].win === cur.win; i--) curRun++;
  const bd = CORE.ratingBreakdown(s.d.picks) as { bonus: number; items: BonusItem[] };
  const boosts = CORE.slotBoosts(s.d.picks);

  const chips = !iq && (
    <div className="chips-row center">
      {bd.items.length ? bd.items.map((i) => <BonusChip key={i.kind + i.type} label={i.label} type={i.type} />) : <span className="chip-empty">NO BONUSES</span>}
    </div>
  );

  return (
    <div className={"sim " + (desktop ? "is-desk" : "is-mob")}>
      <div className="sim-board">
        <div className="sb-cell name">
          <small>{iq ? "ICE-IQ · RATINGS AT THE END" : "RATING " + s.rating.toFixed(1) + (bd.bonus ? " · +" + bd.bonus.toFixed(1) + " BONUS" : "")}</small>
          <b>YOUR SIX</b>
        </div>
        <div className="sb-cell blue"><b>{wins}</b><small>WINS</small></div>
        <div className="sb-cell game">
          {!desktop && <small>GAME</small>}<b>{desktop ? "GAME " : ""}{Math.max(shown, 0)} / 84</b>
          <span className="sb-prog"><span style={{ width: (shown / 84) * 100 + "%" }} /></span>
        </div>
        <div className="sb-cell red"><b>{losses}</b><small>LOSSES</small></div>
        <div className="sb-cell name pace"><small>ON PACE FOR</small><b>{played.length ? pace + "-" + (84 - pace) : "--"}</b></div>
      </div>

      <div className="sim-main">
        {desktop ? (
          <section className="sim-lineup">
            <Eyebrow color="red">[YOUR SIX]</Eyebrow>
            <HalfRink picks={s.d.picks} boosts={boosts} iq={iq} className="small" />
            {chips}
          </section>
        ) : (
          <section className="sim-lineup m">
            <JerseyStrip picks={s.d.picks} size={42} />
            {chips}
          </section>
        )}
        <section className="sim-season">
          <div className="season-head">
            <Eyebrow color="blue">[THE SEASON]</Eyebrow>
            <span className="legend"><i className="w" />WIN<i className="l" />LOSS<i className="t" />TO PLAY</span>
          </div>
          <div className="game-grid" role="list" aria-label="84-game season">
            {season.games.map((g, i) => {
              const state = i < shown ? (g.win ? "w" : "l") : "t";
              return (
                <div key={i} role="listitem" className={"tile " + state + (i === shown - 1 && shown < 84 ? " cur" : "")} title={i < shown ? `Game ${g.n}: ${g.win ? "W" : "L"} vs ${g.opp}` : `Game ${g.n}`}>
                  <span className="gn">{g.n}</span>
                  {state !== "t" && <b>{g.win ? "W" : "L"}</b>}
                </div>
              );
            })}
          </div>
          <div className="sim-foot">
            <div className="stat-box"><small>CURRENT STREAK</small><b>{cur ? (cur.win ? "W" : "L") + curRun : "--"}</b><span>{cur ? "since game " + (played.length - curRun + 1) : "puck drop"}</span></div>
            <div className="stat-box"><small>LONGEST STREAK</small><b>{st.best || "--"}</b><span>{st.best ? "games " + st.bestStart + " to " + st.bestEnd : "no wins yet"}</span></div>
            <div className="stat-box"><small>LAST LOSS</small><b>{lastLoss ? "G" + lastLoss.n : "NONE"}</b><span>{lastLoss ? "vs " + lastLoss.opp : "still perfect"}</span></div>
            <div className="sim-ctrls">
              <button className="btn primary" onClick={() => { setShown(84); doneRef.current(); }}>SKIP TO RESULTS</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
