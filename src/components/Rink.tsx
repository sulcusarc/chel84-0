import { Jersey, EmptyJersey } from "./Jersey";
import { Player, rosterOf, teamLine, lastName, slotPos, numberFor, RecordTeam } from "../lib/game";

/* Painted half-rink from the Figma file (400 x 620). */
function HalfRinkMarkings() {
  return (
    <svg className="rink-svg" viewBox="0 0 400 620" preserveAspectRatio="none" aria-hidden="true">
      <path d="M6 6H394V524C394 584 364 614 304 614H96C36 614 6 584 6 524V6Z" fill="#F4F8FB" stroke="var(--rink-board)" strokeWidth="4" />
      <path d="M370 583H30V586H370V583Z" fill="#C8102E" />
      <path d="M11 11H389V524C389 580.667 360.667 609 304 609H96C39.3333 609 11 580.667 11 524V11Z" stroke="#F2C94C" strokeWidth="2" fill="none" />
      <path d="M392 20H8V28H392V20Z" fill="#C8102E" />
      <path d="M140 28C140 43.913 146.321 59.1742 157.574 70.4264C168.826 81.6786 184.087 88 200 88C215.913 88 231.174 81.6786 242.426 70.4264C253.679 59.1742 260 43.913 260 28" stroke="#1F4FA3" strokeWidth="2.5" fill="none" />
      <circle cx="200" cy="24" r="5" fill="#1F4FA3" />
      <circle cx="100" cy="232" r="6" fill="#C8102E" />
      <circle cx="300" cy="232" r="6" fill="#C8102E" />
      <path d="M392 256H8V268H392V256Z" fill="#1F4FA3" />
      {[100, 300].map((x) => (
        <g key={x}>
          <circle cx={x} cy="470" r="46" stroke="#C8102E" strokeWidth="2.5" fill="none" />
          <circle cx={x} cy="470" r="6" fill="#C8102E" />
          <path d={`M${x - 46} 462H${x - 56}M${x + 46} 462H${x + 56}M${x - 46} 478H${x - 56}M${x + 46} 478H${x + 56}`} stroke="#C8102E" strokeWidth="2" />
        </g>
      ))}
      <path d="M125 584C125 564.109 132.902 545.032 146.967 530.967C161.032 516.902 180.109 509 200 509C219.891 509 238.968 516.902 253.033 530.967C267.098 545.032 275 564.109 275 584H125Z" fill="#9FCDEB" stroke="#C8102E" strokeWidth="2" />
    </svg>
  );
}

/* Where each slot sits on the half rink, as % of the board (left, top). */
const HALF_SPOTS: Record<string, [number, number]> = {
  LW: [19.5, 15], C: [50, 9], RW: [80.5, 15], D1: [24.5, 48], D2: [75.5, 48], G: [50, 74]
};

export function Spot({ id, player, boost, hideTeam, size, iq }: { id: string; player?: Player; boost?: number; hideTeam?: boolean; size: number; iq?: boolean }) {
  if (!player) {
    return (
      <div className="spot open">
        <EmptyJersey label={slotPos(id) === "D" ? "D" : id} size={size} />
        <span className="spot-open">Open</span>
      </div>
    );
  }
  const r = rosterOf(player);
  return (
    <div className="spot filled">
      <div className="spot-jersey">
        <Jersey fr={r.fr} number={player.number} size={size} />
        {!iq && boost ? <span className="boost">+{Math.round(boost)}</span> : null}
      </div>
      <span className="plate">
        <b>{player.name}</b>
        {!hideTeam && <small>{teamLine(player)}</small>}
      </span>
    </div>
  );
}

export function HalfRink({ picks, boosts, iq, className = "" }: { picks: Record<string, Player>; boosts?: Record<string, number>; iq?: boolean; className?: string }) {
  return (
    <div className={"half-rink " + className}>
      <HalfRinkMarkings />
      {Object.entries(HALF_SPOTS).map(([id, [x, y]]) => (
        <div key={id} className={"rink-spot slot-" + id} style={{ left: x + "%", top: y + "%" }}>
          <Spot id={id} player={picks[id]} boost={boosts?.[id]} size={84} iq={iq} />
        </div>
      ))}
    </div>
  );
}

/* Full rink for Cap Cup: your six on the left, the record team on the right (1294 x 252). */
function FullRinkMarkings() {
  const circles = [[215, 60], [215, 192], [1079, 60], [1079, 192]];
  return (
    <svg className="rink-svg" viewBox="0 0 1294 252" preserveAspectRatio="none" aria-hidden="true">
      <path d="M1181 3H113C52.2487 3 3 52.2487 3 113V139C3 199.751 52.2487 249 113 249H1181C1241.75 249 1291 199.751 1291 139V113C1291 52.2487 1241.75 3 1181 3Z" fill="#F4F8FB" stroke="var(--rink-board)" strokeWidth="4" />
      <path d="M62.5 24H60V228H62.5V24Z" fill="#C8102E" />
      <path d="M1234 24H1231.5V228H1234V24Z" fill="#C8102E" />
      <path d="M1181 8H113C55.0101 8 8 55.0101 8 113V139C8 196.99 55.0101 244 113 244H1181C1238.99 244 1286 196.99 1286 139V113C1286 55.0101 1238.99 8 1181 8Z" stroke="#F2C94C" strokeWidth="2" fill="none" />
      <path d="M651 6H643V246H651V6Z" fill="#C8102E" />
      <circle cx="647" cy="126" r="48" stroke="#1F4FA3" strokeWidth="2.5" fill="none" />
      <circle cx="647" cy="126" r="5" fill="#1F4FA3" />
      <path d="M447 6H435V246H447V6Z" fill="#1F4FA3" />
      <path d="M859 6H847V246H859V6Z" fill="#1F4FA3" />
      {circles.map(([x, y]) => (
        <g key={x + "-" + y}>
          <circle cx={x} cy={y} r="33" stroke="#C8102E" strokeWidth="2.5" fill="none" />
          <circle cx={x} cy={y} r="5" fill="#C8102E" />
          <path d={`M${x - 8} ${y - 33}V${y - 42}M${x + 8} ${y - 33}V${y - 42}M${x - 8} ${y + 33}V${y + 42}M${x + 8} ${y + 33}V${y + 42}`} stroke="#C8102E" strokeWidth="2" />
        </g>
      ))}
      <path d="M61 88C71.0782 88 80.7437 92.0036 87.8701 99.1299C94.9964 106.256 99 115.922 99 126C99 136.078 94.9964 145.744 87.8701 152.87C80.7437 159.996 71.0782 164 61 164V88Z" fill="#9FCDEB" stroke="#C8102E" strokeWidth="2" />
      <path d="M1233 88C1222.92 88 1213.26 92.0036 1206.13 99.1299C1199 106.256 1195 115.922 1195 126C1195 136.078 1199 145.744 1206.13 152.87C1213.26 159.996 1222.92 164 1233 164V88Z" fill="#9FCDEB" stroke="#C8102E" strokeWidth="2" />
    </svg>
  );
}

/* centers (x, y) in the 1294 x 252 board */
const MINE: Record<string, [number, number]> = { G: [118, 112], D1: [321, 62], D2: [321, 192], LW: [535, 44], C: [600, 122], RW: [535, 200] };
const THEIRS: Record<string, [number, number]> = { G: [1176, 112], D1: [973, 62], D2: [973, 192], LW: [759, 44], C: [694, 122], RW: [759, 200] };

export function FullRink({ picks, opp }: { picks: Record<string, Player>; opp: RecordTeam | null }) {
  return (
    <div className="full-rink">
      <FullRinkMarkings />
      {Object.entries(MINE).map(([id, [x, y]]) => (
        <div key={"m" + id} className="rink-spot small" style={{ left: (x / 1294) * 100 + "%", top: (y / 252) * 100 + "%" }}>
          <Spot id={id} player={picks[id]} size={50} />
        </div>
      ))}
      {opp && Object.entries(THEIRS).map(([id, [x, y]]) => {
        const name = opp.lineup[id];
        return (
          <div key={"o" + id} className="rink-spot small opp" style={{ left: (x / 1294) * 100 + "%", top: (y / 252) * 100 + "%" }}>
            <div className="spot filled">
              <div className="spot-jersey"><OppJersey opp={opp} number={numberFor(name)} /></div>
              <span className="plate"><b>{name}</b></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OppJersey({ opp, number }: { opp: RecordTeam; number: number | null }) {
  if (opp.fr) return <Jersey fr={opp.fr} number={number} size={50} />;
  // teams outside the pool (1919-20 Senators) use their own two colors
  return (
    <svg className="jersey" width={50} height={45} viewBox="0 0 96 86" aria-hidden="true">
      <path d="M36 4L14 10L2 58L16 62L24 30V84H72V30L80 62L94 58L82 10L60 4C52 10.6667 44 10.6667 36 4Z" fill={opp.colors.c1} stroke={opp.colors.c2} strokeWidth="2" />
      <path d="M24 70H72V76H24V70Z" fill={opp.colors.c2} />
    </svg>
  );
}

/* Six small jerseys in a row (mobile lineup strip, sim, results). */
export function JerseyStrip({ picks, size = 43, showNames = true, onTap }: { picks: Record<string, Player>; size?: number; showNames?: boolean; onTap?: () => void }) {
  return (
    <div className="jersey-strip" onClick={onTap}>
      {["LW", "C", "RW", "D1", "D2", "G"].map((id) => {
        const p = picks[id];
        return (
          <div key={id} className={"strip-slot" + (p ? " filled" : "")}>
            {p ? <Jersey fr={rosterOf(p).fr} number={p.number} size={size} /> : <EmptyJersey label={slotPos(id)} size={size} />}
            {showNames && <span>{p ? lastName(p.name).toUpperCase() : slotPos(id)}</span>}
          </div>
        );
      })}
    </div>
  );
}
