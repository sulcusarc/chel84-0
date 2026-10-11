import { useEffect, useMemo, useRef, useState } from "react";
import {
  CORE, CAP_CUP, FRANCHISES, ROSTER_BY_KEY, SHORT, MODE_LABEL, Player, Roster,
  decadeLabel, displayRating, lastName, money, rosterOf, slotPos, teamLine, BonusItem
} from "../lib/game";
import { Session, bump } from "../lib/session";
import { reducedMotion, getPref, setPref } from "../lib/prefs";
import { useDesktop } from "../lib/useMedia";
import { HalfRink, FullRink, JerseyStrip } from "../components/Rink";
import { BonusChip, CapIntro, Eyebrow, Modal } from "../components/Chrome";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const GROUPS: { key: "F" | "D" | "G"; label: string; pos: string[] }[] = [
  { key: "F", label: "FORWARDS", pos: ["C", "LW", "RW"] },
  { key: "D", label: "DEFENSE", pos: ["D"] },
  { key: "G", label: "GOALIES", pos: ["G"] }
];
const CONF_WORD: Record<string, string> = { E: "EAST", W: "WEST" };
const CONF_NAME: Record<string, string> = { E: "East", W: "West" };

type RowState = { kind: "open" } | { kind: "filled"; tag: string } | { kind: "over" };

export function DraftScreen({ s, onStartSeason }: { s: Session; onStartSeason: () => void }) {
  const desktop = useDesktop();
  const d = s.d, mode = s.mode, iq = mode === "iq", cap = mode === "cap";
  const [sel, setSel] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [reel, setReel] = useState<{ dec: string; fr: string } | null>(null);
  const [intro, setIntro] = useState(() => cap && getPref("capIntroHidden", "") !== "1" && Object.keys(d.picks).length === 0 && !d.current);
  const [rinkOpen, setRinkOpen] = useState(false);
  const run = useRef(0);
  const picksN = Object.keys(d.picks).length;
  const roster: Roster | null = d.current ? ROSTER_BY_KEY[d.current] : null;

  /* ---- spinning ---- */
  async function animate(kind: string, next: Roster) {
    if (reducedMotion()) return;
    const decs = CORE.DECADES as number[], frs = Object.keys(FRANCHISES);
    const ticks = 12;
    for (let i = 0; i < ticks; i++) {
      const last = i === ticks - 1;
      setReel({
        dec: kind === "franchise" || last ? decadeLabel(next.decade) : decadeLabel(decs[(i * 7 + 3) % decs.length]),
        fr: kind === "decade" || last ? FRANCHISES[next.fr].name : FRANCHISES[frs[(i * 11 + 5) % frs.length]].name
      });
      await sleep(45 + i * 9);
    }
  }
  async function land(kind: "both" | "decade" | "franchise") {
    const my = ++run.current;
    const next: Roster | null = kind === "both" ? CORE.spin(d, s.rng) : CORE.reroll(d, kind, s.rng);
    if (!next) return;
    setSel(null); setSpinning(true);
    await animate(kind, next);
    if (my !== run.current) return;
    setReel(null); setSpinning(false);
    if (cap && !CORE.anyAffordable(d, d.current)) {
      s.note = "No one on the " + decadeLabel(next.decade) + " " + SHORT[next.fr] + " fits under your cap, so you get a free re-spin.";
      bump();
      await sleep(reducedMotion() ? 300 : 1100);
      if (my !== run.current) return;
      return land("both");
    }
    bump();
  }
  useEffect(() => {
    if (s.phase === "draft" && !d.current && picksN < 6 && !spinning && !intro) land("both");
    return () => { /* keep running across re-renders */ };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.id, s.phase, d.current, picksN, intro]);
  useEffect(() => () => { run.current++; }, []);

  /* ---- roster rows ---- */
  const selPlayer: Player | null = roster && sel ? roster.players.find((p) => p.id === sel) || null : null;
  function rowState(p: Player): RowState {
    if (CORE.isDrafted(d, p)) return { kind: "filled", tag: "DRAFTED" };
    const opts: string[] = CORE.slotOptions(d, p);
    if (!opts.length) return { kind: "filled", tag: (p.pos === "LW" || p.pos === "RW" ? "W" : p.pos) + " FILLED" };
    if (cap && !CORE.capOptions(d, p).length) return { kind: "over" };
    return { kind: "open" };
  }
  const groups = useMemo(() => {
    if (!roster) return [];
    return GROUPS.map((g) => {
      const list = roster.players.filter((p) => g.pos.includes(p.pos));
      list.sort(iq ? (a, b) => lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name) : (a, b) => b.rating - a.rating);
      return { ...g, list };
    }).filter((g) => g.list.length);
  }, [roster, iq]);

  /* ---- drafting ---- */
  const rawChoices: string[] = selPlayer ? (cap ? CORE.capOptions(d, selPlayer) : CORE.slotOptions(d, selPlayer)) : [];
  const slotChoices = rawChoices.filter((id, i) => rawChoices.findIndex((x) => slotPos(x) === slotPos(id)) === i);   // D1 and D2 are one choice
  async function draft(slot: string) {
    if (!selPlayer) return;
    if (!CORE.draftPlayer(d, selPlayer, slot)) return;
    s.note = "";
    setSel(null);
    if (CORE.isDraftComplete(d)) { s.phase = "ready"; bump(); return; }
    bump();
  }

  const rating = displayRating(d.picks);
  const breakdown = CORE.ratingBreakdown(d.picks) as { items: BonusItem[] };
  const boosts: Record<string, number> = CORE.slotBoosts(d.picks);

  const props: PanelProps = { s, roster, groups, sel, setSel, rowState, spinning, reel, land, selPlayer, slotChoices, draft, rating, onStartSeason, iq, cap };

  return (
    <div className={"draft " + (desktop ? "is-desk" : "is-mob") + (cap ? " cap" : "")}>
      {intro && (
        <CapIntro
          onClose={() => setIntro(false)}
          onStart={(hide) => { if (hide) setPref("capIntroHidden", "1"); setIntro(false); }}
        />
      )}
      {rinkOpen && (
        <Modal onClose={() => setRinkOpen(false)} className="rink-modal" label="Your six on the rink">
          <button className="close" aria-label="Close" onClick={() => setRinkOpen(false)}>✕</button>
          <HalfRink picks={d.picks} boosts={boosts} iq={iq} />
        </Modal>
      )}
      {desktop ? (
        <>
          {cap && <VsBoard s={s} rating={rating} desktop />}
          {cap && <FullRink picks={d.picks} opp={s.opp} />}
          <div className="draft-cols">
            <SpinPanel {...props} />
            <RosterPanel {...props} />
            {cap ? <CapPanel {...props} /> : (
              <section className="lineup-col">
                <div className="lineup-head">
                  <Eyebrow color="red">[YOUR LINEUP]</Eyebrow>
                  <span className="mode-chip">{MODE_LABEL[s.mode]}</span>
                  {!iq && <span className="rating-read"><small>RATING</small>{rating ? rating.toFixed(1) : "--"}</span>}
                </div>
                <HalfRink picks={d.picks} boosts={boosts} iq={iq} />
                {!iq && <div className="chips-row">
                  {breakdown.items.length ? breakdown.items.map((i) => <BonusChip key={i.kind + i.type} label={i.label} type={i.type} />) : <span className="chip-empty">NO BONUSES YET</span>}
                </div>}
              </section>
            )}
          </div>
        </>
      ) : (
        <>
          {cap && <VsBoard s={s} rating={rating} />}
          <SpinPanel {...props} />
          <section className="m-lineup">
            <div className="lineup-head">
              <Eyebrow color="red">[YOUR SIX]</Eyebrow>
              <span className="mode-chip">{MODE_LABEL[s.mode]}</span>
              {!iq && <span className="rating-read"><small>RATING</small>{rating ? rating.toFixed(1) : "--"}</span>}
            </div>
            <button className="strip-btn" onClick={() => setRinkOpen(true)} aria-label="See your six on the rink">
              <JerseyStrip picks={d.picks} />
            </button>
            {cap ? <CapTracker s={s} compact /> : <p className="tap-hint">{iq ? "No stats, no ratings. Draft on hockey IQ." : "Tap your six to see them on the rink"}</p>}
          </section>
          <RosterPanel {...props} />
          <DraftBar {...props} />
        </>
      )}
    </div>
  );
}

type PanelProps = {
  s: Session; roster: Roster | null; groups: { key: string; label: string; list: Player[] }[];
  sel: string | null; setSel: (id: string | null) => void; rowState: (p: Player) => RowState;
  spinning: boolean; reel: { dec: string; fr: string } | null; land: (k: "both" | "decade" | "franchise") => void;
  selPlayer: Player | null; slotChoices: string[]; draft: (slot: string) => void; rating: number; onStartSeason: () => void;
  iq: boolean; cap: boolean;
};

function SpinPanel({ s, roster, spinning, reel, land, iq }: PanelProps) {
  const d = s.d;
  const dec = reel ? reel.dec : roster ? decadeLabel(roster.decade) : "—";
  const frName = reel ? reel.fr : roster ? FRANCHISES[roster.fr].name : "—";
  const fr = roster && !reel ? FRANCHISES[roster.fr] : null;
  const canDec = !spinning && s.phase === "draft" && CORE.canReroll(d, "decade");
  const canFr = !spinning && s.phase === "draft" && CORE.canReroll(d, "franchise");
  const ready = s.phase !== "draft";
  return (
    <section className="spin-col">
      <Eyebrow color="yellow">[THE SPIN]</Eyebrow>
      <div className="reels" aria-live="polite">
        <div className={"reel dec" + (spinning ? " rolling" : "")}><small>DECADE</small><b>{ready ? "—" : dec}</b></div>
        <div className={"reel fr" + (spinning ? " rolling" : "")}>
          <small>FRANCHISE</small><b>{ready ? "SIX DRAFTED" : frName}</b>
          <span className="team-bar" style={{ background: fr ? `linear-gradient(90deg, ${fr.c1} 0 50%, ${fr.c2} 50% 100%)` : "transparent" }} />
        </div>
      </div>
      {roster && !spinning && !ready && (
        <div className="spin-tags">
          {!iq && <span className="conf-tag">{CONF_WORD[roster.conf]}</span>}
          {!iq && CORE.isO6(roster.fr) && <span className="conf-tag o6">ORIGINAL SIX</span>}
          <span className="count">{roster.players.length} players</span>
        </div>
      )}
      {s.note && <p className="spin-note">{s.note}</p>}
      <p className="reroll-label">RE-ROLLS · ONE EACH PER DRAFT</p>
      <div className="rerolls">
        <button className="reroll" disabled={!canDec} onClick={() => land("decade")}>
          <b>DECADE</b><small>{d.used.decade ? "Used" : "1 left"}</small>
        </button>
        <button className="reroll" disabled={!canFr} onClick={() => land("franchise")}>
          <b>TEAM</b><small>{d.used.franchise ? "Used" : "1 left"}</small>
        </button>
      </div>
    </section>
  );
}

function RosterPanel(p: PanelProps) {
  const { s, roster, groups, sel, setSel, rowState, spinning, iq, cap } = p;
  const desktop = useDesktop();
  const title = roster ? "[" + decadeLabel(roster.decade).toUpperCase() + " " + FRANCHISES[roster.fr].name.toUpperCase() + "]" : "[ROSTER]";
  const ready = s.phase !== "draft";
  return (
    <section className="roster-col">
      {desktop && <Eyebrow color="blue" rule>{title}</Eyebrow>}
      <div className={"roster" + (spinning ? " dim" : "")}>
        {ready ? (
          <div className="roster-done">
            <b>YOUR SIX IS SET.</b>
            <p>{iq ? "No peeking at ratings. Time to find out." : "Team rating " + p.rating.toFixed(1) + ". Time to find out."}</p>
          </div>
        ) : !roster ? (
          <div className="roster-done"><p>Spinning…</p></div>
        ) : (
          groups.map((g) => (
            <div key={g.key} className={"group g-" + g.key}>
              <div className="group-head">
                <span>{g.label} ({g.list.length})</span>
                {!iq && <span>{cap ? "PRICE  OVR" : "OVR"}</span>}
              </div>
              <div className="group-rows">
                {g.list.map((pl) => {
                  const st = rowState(pl);
                  const off = st.kind !== "open";
                  const r = rosterOf(pl);
                  return (
                    <button
                      key={pl.id}
                      className={"prow" + (off ? " off" : "") + (sel === pl.id ? " sel" : "") + (iq ? " iq" : "")}
                      disabled={off || spinning}
                      aria-pressed={sel === pl.id}
                      onClick={() => setSel(sel === pl.id ? null : pl.id)}
                    >
                      <span className="pos">{pl.pos}</span>
                      <span className="nm"><b>{pl.name}</b>{!iq && <small>{pl.line}</small>}</span>
                      {st.kind === "filled" ? <span className="tag">{st.tag}</span>
                        : st.kind === "over" ? <span className="tag over">OVER CAP</span>
                        : !iq ? <span className="tag conf">{CONF_WORD[r.conf]}</span> : <span />}
                      {cap && <span className={"price" + (st.kind === "over" ? " over" : "")}>{money(pl.price)}</span>}
                      {!iq && <span className={"ovr" + (pl.rating >= 95 ? " elite" : "")}>{pl.rating}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
      {desktop && !cap && <DraftBar {...p} />}
    </section>
  );
}

function hintFor(s: Session, pl: Player, slot: string): string {
  if (s.mode !== "classic") return "";
  const pv = CORE.bonusPreview(s.d, pl, slot) as { newItems: BonusItem[] };
  if (pv.newItems.length) return "Completes the " + pv.newItems.map((i) => i.label).join(" and ");
  const conf = rosterOf(pl).conf;
  const line = ["LW", "C", "RW"].includes(slot) ? ["LW", "C", "RW"] : slot.startsWith("D") ? ["D1", "D2"] : null;
  if (!line) return "";
  const others = line.filter((id) => id !== slot);
  const filled = others.filter((id) => s.d.picks[id]);
  if (filled.some((id) => rosterOf(s.d.picks[id]).conf !== conf)) return "";
  const open = others.length - filled.length;
  if (line.length === 2) return "Pair with a " + CONF_NAME[conf] + " D for +2 Conference";
  return open === 2 ? "Start a " + CONF_NAME[conf] + " forward line for +2 Conference" : "One more " + CONF_NAME[conf] + " forward for +2 Conference";
}

function DraftBar({ s, selPlayer, slotChoices, draft, rating, onStartSeason, iq, cap }: PanelProps) {
  if (s.phase === "ready") {
    return (
      <div className="draft-bar ready">
        <div className="db-info"><b>YOUR SIX IS SET</b>{!iq && <span className="db-rate">Team rating {rating.toFixed(1)}</span>}</div>
        <button className="btn primary" onClick={onStartSeason}>PLAY 84 GAMES</button>
      </div>
    );
  }
  if (!selPlayer) {
    return (
      <div className="draft-bar empty">
        <div className="db-info"><b>PICK A PLAYER</b><span className="db-hint">{cap ? "Stay under the cap. Red prices won’t fit." : "Tap a name to see what he adds."}</span></div>
        <button className="btn primary" disabled>DRAFT</button>
      </div>
    );
  }
  const slot = slotChoices[0];
  const after = displayRating({ ...s.d.picks, [slot]: selPlayer });
  const hint = hintFor(s, selPlayer, slot);
  return (
    <div className="draft-bar">
      <div className="db-info">
        <b>{selPlayer.name.toUpperCase()} · {selPlayer.pos} · {decadeLabel(rosterOf(selPlayer).decade) + " " + rosterOf(selPlayer).fr}</b>
        {cap ? <span className="db-rate">{money(selPlayer.price)} · Rating {rating ? rating.toFixed(1) : "--"} → {after.toFixed(1)}</span>
          : !iq ? <span className="db-rate">Team rating {rating ? rating.toFixed(1) : "--"} → {after.toFixed(1)}</span> : null}
        {cap && <span className="db-hint">Cap left after this pick: {money(CAP_CUP.CAP - CORE.spentOf(s.d) - selPlayer.price)}</span>}
        {hint && <span className="db-hint">{hint}</span>}
      </div>
      <div className="db-btns">
        {slotChoices.map((id) => (
          <button key={id} className="btn primary" onClick={() => draft(id)}>DRAFT TO {slotPos(id)}</button>
        ))}
      </div>
    </div>
  );
}

function CapTracker({ s, compact }: { s: Session; compact?: boolean }) {
  const spent = CORE.spentOf(s.d) as number;
  const left = CAP_CUP.CAP - spent;
  const openN = 6 - Object.keys(s.d.picks).length;
  const reserve = (CORE.openSlots(s.d) as { pos: string }[]).reduce((a, sl) => a + CORE.MIN_PRICE[sl.pos], 0);
  const spentPct = (spent / CAP_CUP.CAP) * 100, resPct = (reserve / CAP_CUP.CAP) * 100;
  return (
    <div className={"cap-tracker" + (compact ? " compact" : "")}>
      <div className="cap-row">
        <small>CAP LEFT</small><b>{money(left)}</b><span className="of">of {money(CAP_CUP.CAP)}</span>
        {compact && openN > 0 && <span className="keep">KEEP {money(reserve)} FOR {openN} SPOT{openN === 1 ? "" : "S"}</span>}
      </div>
      <div className="cap-bar"><span className="spent" style={{ width: spentPct + "%" }} /><span className="reserved" style={{ width: Math.min(100 - spentPct, resPct) + "%" }} /></div>
      {!compact && <p className="cap-line">Spent {money(spent)} on {6 - openN} player{6 - openN === 1 ? "" : "s"} · {openN} spot{openN === 1 ? "" : "s"} to fill</p>}
      {!compact && openN > 0 && <p className="cap-hint">Keep at least {money(reserve)} to finish your six</p>}
    </div>
  );
}

function CapPanel(p: PanelProps) {
  return (
    <section className="cap-col">
      <Eyebrow color="red">[SALARY CAP]</Eyebrow>
      <div className="cap-box"><CapTracker s={p.s} /></div>
      <div className="cap-box draft-box"><DraftBar {...p} /></div>
    </section>
  );
}

export function VsBoard({ s, rating, desktop }: { s: Session; rating: number; desktop?: boolean }) {
  const o = s.opp;
  if (!o) return null;
  const rec = o.w + "-" + o.l + "-" + o.t;
  if (!desktop) {
    return (
      <div className="vs-mini">
        <div><small>YOUR SIX</small><b>{rating ? rating.toFixed(1) : "--"}</b></div>
        <span className="vs">VS</span>
        <div className="r"><small>{o.season} {SHORT[o.fr || ""]?.toUpperCase() || o.team.toUpperCase()}</small><b><em>WIN {o.need}+</em> {rec}</b></div>
      </div>
    );
  }
  return (
    <div className="vs-board">
      <div className="vs-cell name"><small>DRAFTING · {money(CAP_CUP.CAP).replace(".0", "")} CAP</small><b>YOUR SIX</b></div>
      <div className="vs-cell blue"><b>{rating ? rating.toFixed(1) : "--"}</b><small>RATING</small></div>
      <div className="vs-cell mid"><b>VS</b><small>WIN {o.need}+ TO BEAT THEM</small></div>
      <div className="vs-cell red"><b>{rec}</b><small>RECORD</small></div>
      <div className="vs-cell name opp"><small>{o.season} · {o.pace.toFixed(1)}-WIN PACE</small><b>{o.team.toUpperCase()}</b></div>
    </div>
  );
}
