import { useEffect, useMemo, useState } from "react";
import {
  CORE, CAP_CUP, BonusItem, MODE_LABEL, Player, chanceAtLeast, fromPerfect, lastName, money, perfectOdds,
  rosterOf, streaks, teamLine, tierFor, todaysField
} from "../lib/game";
import { Session } from "../lib/session";
import { playHorn, reducedMotion } from "../lib/prefs";
import { Jersey } from "../components/Jersey";
import { BonusChip, Eyebrow } from "../components/Chrome";

const ORDER = ["LW", "C", "RW", "D1", "D2", "G"];
export const pct = (p: number) => (p < 0.0001 ? "<0.01%" : p < 0.01 ? (p * 100).toFixed(2) + "%" : p >= 0.995 ? ">99%" : (p * 100).toFixed(1) + "%");

function Strip({ s, label }: { s: Session; label: string }) {
  return (
    <div className="season-strip">
      <div className="bars" aria-hidden="true">{s.season!.games.map((g) => <i key={g.n} className={g.win ? "w" : "l"} />)}</div>
      <div className="strip-labels"><span>GAME 1</span><span className="mid">{label}</span><span>GAME 84</span></div>
    </div>
  );
}

function SixCards({ picks, show }: { picks: Record<string, Player>; show: "ovr" | "price" }) {
  return (
    <div className="six-cards">
      {ORDER.map((id) => {
        const p = picks[id];
        if (!p) return null;
        return (
          <div key={id} className="six-card">
            <Jersey fr={rosterOf(p).fr} number={p.number} size={50} />
            <b>{p.name}</b>
            <small>{teamLine(p)}</small>
            <span className={show === "price" ? "price" : ""}>{id.startsWith("D") ? "D" : id} · {show === "price" ? money(p.price) : p.rating + " OVR"}</span>
          </div>
        );
      })}
    </div>
  );
}

function share(text: string, setMsg: (m: string) => void) {
  const url = "https://chel84-0.com";
  const nav = navigator as any;
  if (nav.share) { nav.share({ title: "Chel 84-0", text, url }).catch(() => {}); return; }
  try { navigator.clipboard.writeText(text + " " + url).then(() => setMsg("Copied. Paste it to a friend.")); } catch { setMsg(text + " " + url); }
}

export function ResultsScreen({ s, again, home, board }: { s: Session; again: () => void; home: () => void; board: () => void }) {
  const season = s.season!;
  const [msg, setMsg] = useState("");
  const bd = CORE.ratingBreakdown(s.d.picks) as { base: number; bonus: number; total: number; items: BonusItem[] };
  const tier = tierFor(season.wins);
  const st = streaks(season.games);
  const lossGames = season.games.filter((g) => !g.win).map((g) => g.n);
  const field = useMemo(() => todaysField(s.mode), [s.mode]);
  const rank = CORE.rankAgainst(field, season.wins, s.rating) as { rank: number; total: number; beatsPct: number };
  const names = ORDER.map((id) => lastName(s.d.picks[id].name));
  const iq = s.mode === "iq";

  useEffect(() => { if (season.perfect) playHorn(); }, [season.perfect]);

  return (
    <div className="results">
      <section className="res-main">
        <Eyebrow color="yellow">[FINAL RECORD]</Eyebrow>
        <div className="record-row">
          <h1 className="record">{season.wins}-<span className={season.losses ? "red" : ""}>{season.losses}</span></h1>
          <div className="tier">
            <span className="tier-badge">{tier.name.toUpperCase()}</span>
            <p className="tier-note">{tier.note}</p>
            <p className="tier-sub">{fromPerfect(season.losses)}</p>
          </div>
        </div>
        <Strip s={s} label={lossGames.length === 0 ? "84-0. PERFECT." : lossGames.length <= 8 ? "LOSSES: " + lossGames.join(" · ") : lossGames.length + " LOSSES"} />
        <div className="key-stats">
          <div className="stat-box"><small>ODDS OF 84-0</small><b className="red">{pct(perfectOdds(season))}</b><span>this lineup, this schedule</span></div>
          <div className="stat-box"><small>LONGEST STREAK</small><b>{st.best}</b><span>{st.best ? "games " + st.bestStart + " to " + st.bestEnd : "no wins"}</span></div>
          <div className="stat-box"><small>TEAM RATING</small><b>{bd.total.toFixed(1)}</b><span>{bd.base.toFixed(1)} + {bd.bonus.toFixed(1)} bonus</span></div>
          <div className="stat-box"><small>WIN RATE</small><b>{(season.wins / 84).toFixed(3).replace(/^0/, "")}</b><span>{season.wins} of 84</span></div>
        </div>
        <div className="bonus-line">
          <span className="bl-label">{iq ? "BONUSES YOU EARNED" : "BONUSES"}</span>
          {bd.items.length ? bd.items.map((i) => <BonusChip key={i.kind + i.type} label={i.label} type={i.type} />) : <span className="chip-empty">NONE THIS TIME</span>}
        </div>
        <Eyebrow color="red">[YOUR SIX]{iq ? " · RATINGS REVEALED" : ""}</Eyebrow>
        <SixCards picks={s.d.picks} show="ovr" />
      </section>

      <aside className="res-side">
        <div className="rank-card">
          <small>TODAY’S RANK · {MODE_LABEL[s.mode]}</small>
          <div className="rank-row"><b className="red">#{rank.rank.toLocaleString()}</b><span>of {rank.total.toLocaleString()} teams today</span></div>
          <div className="rank-row"><b>{rank.beatsPct.toFixed(1)}%</b><span>of today’s teams beaten</span></div>
          <hr />
          <p className="rank-note">The live leaderboard opens soon. Until then you’re ranked against 1,000 simulated drafts, the same field for everyone today.</p>
          <button className="link-btn" onClick={board}>SEE TODAY’S BOARD →</button>
        </div>
        <button className="btn primary big" onClick={again}>DRAFT AGAIN</button>
        <button className="btn outline big" onClick={() => share(`I went ${season.wins}-${season.losses} in Chel 84-0 (${MODE_LABEL[s.mode]}) with ${names.join(", ")}. Can you go 84-0?`, setMsg)}>CHALLENGE A FRIEND</button>
        {msg && <p className="share-msg" role="status">{msg}</p>}
        <button className="link-btn center" onClick={home}>BACK TO GAME MODES</button>
      </aside>
    </div>
  );
}

/* ---------------- Cap Cup verdict ---------------- */

export function VerdictScreen({ s, newOpp, home }: { s: Session; newOpp: () => void; home: () => void }) {
  const season = s.season!, o = s.opp!;
  const won = season.wins >= o.need;
  const [msg, setMsg] = useState("");
  const [party, setParty] = useState(won && !reducedMotion());
  const bd = CORE.ratingBreakdown(s.d.picks) as { total: number; items: BonusItem[] };
  const spent = CORE.spentOf(s.d) as number;
  const chance = chanceAtLeast(season, o.need);
  const st = streaks(season.games);
  let clinch = 0, w = 0;
  for (const g of season.games) { if (g.win) w++; if (w === o.need) { clinch = g.n; break; } }
  const confN = bd.items.filter((i) => i.type === "conf").length;
  const shortName = o.team.split(" ").slice(-1)[0];
  const won2 = s.history.filter((h) => h.won).length, lost2 = s.history.length - won2;

  useEffect(() => { if (won) playHorn(); const t = setTimeout(() => setParty(false), 4200); return () => clearTimeout(t); }, [won]);

  return (
    <div className="results verdict">
      {party && <Celebration />}
      <section className="res-main">
        <Eyebrow color="red">[CAP CUP VERDICT]</Eyebrow>
        <h1 className="verdict-head">
          {won ? <><span className="blue">YOU</span> BEAT THE<br />{o.season} {shortName.toUpperCase()}</> : <>THE {shortName.toUpperCase()}<br /><span className="red">HELD YOU OFF</span></>}
        </h1>
        <p className="verdict-sub">
          {season.wins} wins. You needed {o.need}. {won ? "The Cap Cup is yours." : (o.need - season.wins) + " short of the Cup."}
        </p>
        <div className="h2h">
          <div className="vs-cell name"><small>{money(spent)} PAYROLL</small><b>YOUR SIX</b></div>
          <div className="vs-cell blue"><b>{season.wins}-{season.losses}</b><small>YOUR SEASON</small></div>
          <div className="vs-cell mid"><b className={won ? "" : "loss"}>{won ? "WIN" : "LOSS"}</b><small>{won ? "BY " + (season.wins - o.need + 1) + " GAME" + (season.wins - o.need + 1 === 1 ? "" : "S") : (o.need - season.wins) + " WIN" + (o.need - season.wins === 1 ? "" : "S") + " SHORT"}</small></div>
          <div className="vs-cell red"><b>{o.pace.toFixed(1)}</b><small>THEIR PACE</small></div>
          <div className="vs-cell name opp"><small>{o.w}-{o.l}-{o.t} · {o.gp} GAMES</small><b>{shortName.toUpperCase()}</b></div>
        </div>
        <Strip s={s} label={won ? "WIN " + o.need + " CLINCHED IN GAME " + clinch : season.losses + " LOSSES · NEEDED " + (84 - o.need) + " OR FEWER"} />
        <div className="key-stats">
          <div className="stat-box"><small>CHANCE YOU HAD</small><b className="blue-t">{chance < 0.005 ? "<1%" : chance > 0.995 ? ">99%" : Math.round(chance * 100) + "%"}</b><span>to beat them, before puck drop</span></div>
          <div className="stat-box"><small>PAYROLL</small><b>{money(spent)}</b><span>{money(CAP_CUP.CAP - spent)} under the cap</span></div>
          <div className="stat-box"><small>TEAM RATING</small><b>{bd.total.toFixed(1)}</b><span>{confN ? "incl. " + (confN === 2 ? "two Conference bonuses" : "a Conference bonus") : bd.items.length ? "bonuses included" : "no bonuses"}</span></div>
          <div className="stat-box"><small>LONGEST STREAK</small><b>{st.best}</b><span>wins in a row</span></div>
        </div>
        <Eyebrow color="blue">[YOUR SIX]</Eyebrow>
        <SixCards picks={s.d.picks} show="price" />
      </section>
      <aside className="res-side">
        <div className="rank-card session">
          <small>THIS SESSION VS HISTORY</small>
          <div className="rank-row"><b>{won2}-{lost2}</b><span>Cups won</span></div>
          <hr />
          <ul className="hist">
            {[...s.history].reverse().slice(0, 6).map((h, i) => (
              <li key={i}><span className={"wl " + (h.won ? "w" : "l")}>{h.won ? "W" : "L"}</span><span className="hn">{h.opp}{i === 0 ? " (just now)" : ""}</span><span className="hv">{h.wins} vs {h.need}</span></li>
            ))}
          </ul>
          <p className="rank-note">Your wins vs the wins you needed.</p>
        </div>
        <button className="btn primary big" onClick={newOpp}>GET A NEW OPPONENT</button>
        <button className="btn outline big" onClick={() => share(won ? `I beat the ${o.season} ${o.team} in Chel 84-0's Cap Cup, ${season.wins}-${season.losses} on a ${money(spent)} payroll.` : `The ${o.season} ${o.team} held me off in Chel 84-0's Cap Cup. ${season.wins} wins, needed ${o.need}.`, setMsg)}>{won ? "SHARE THIS WIN" : "SHARE THIS SEASON"}</button>
        {msg && <p className="share-msg" role="status">{msg}</p>}
        <button className="link-btn center" onClick={home}>BACK TO GAME MODES</button>
      </aside>
    </div>
  );
}

/* Goal light flash plus confetti and pucks falling from the top. */
function Celebration() {
  const bits = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 1.2, dur: 2.2 + Math.random() * 1.6,
    color: ["#C8102E", "#1F4FA3", "#F8C507", "#FFFFFF", "#151C2C"][i % 5], puck: i % 9 === 0, rot: Math.random() * 360
  })), []);
  return (
    <div className="celebrate" aria-hidden="true">
      <div className="goal-light" />
      {bits.map((b, i) => (
        <span key={i} className={b.puck ? "puck" : "confetti"} style={{ left: b.left + "%", animationDelay: b.delay + "s", animationDuration: b.dur + "s", background: b.puck ? undefined : b.color, transform: `rotate(${b.rot}deg)` }} />
      ))}
    </div>
  );
}
