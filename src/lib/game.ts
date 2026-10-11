// Thin, typed helpers around the plain-JS game core (src/core/core.js).
import CORE from "../core/core.js";

export { CORE };

export type ModeKey = "classic" | "iq" | "cap";
export const MODE_SLUG: Record<ModeKey, string> = { classic: "classic", iq: "ice-iq", cap: "cap-cup" };
export const SLUG_MODE: Record<string, ModeKey> = { classic: "classic", "ice-iq": "iq", "cap-cup": "cap" };
export const MODE_LABEL: Record<ModeKey, string> = { classic: "CLASSIC", iq: "ICE-IQ", cap: "CAP CUP" };

export interface Player {
  id: string; name: string; pos: "C" | "LW" | "RW" | "D" | "G"; rating: number;
  number: number | null; line: string; price: number; rosterKey: string;
}
export interface Roster { key: string; fr: string; decade: number; conf: "E" | "W"; players: Player[] }
export interface BonusItem { kind: "F" | "D" | "ALL"; type: "conf" | "o6" | "chic"; ids: string[]; label: string; detail: string; points: number; rating: number }
export interface Game { n: number; opp: string; oppRating: number; p: number; win: boolean }
export interface Season { games: Game[]; wins: number; losses: number; bestStreak: number; perfect: boolean }
export interface RecordTeam {
  id: string; season: string; team: string; fr?: string; w: number; l: number; t: number;
  lineup: Record<string, string>; colors: { c1: string; c2: string }; gp: number; pace: number; need: number;
}

export const SLOTS: { id: string; pos: string; label: string; weight: number }[] = CORE.SLOTS;
export const SLOT_IDS = ["LW", "C", "RW", "D1", "D2", "G"];
export const FRANCHISES: Record<string, { name: string; c1: string; c2: string }> = CORE.FRANCHISES;
export const SHORT: Record<string, string> = CORE.SHORT_NAME;
export const ROSTER_BY_KEY: Record<string, Roster> = CORE.ROSTER_BY_KEY;
export const CAP_CUP = CORE.CAP_CUP as { CAP: number };

export const rosterOf = (p: Player): Roster => ROSTER_BY_KEY[p.rosterKey];
export const lastName = (n: string) => n.split(" ").slice(-1)[0];
export const decadeLabel = (d: number) => d + "s";
export const teamLine = (p: Player) => { const r = rosterOf(p); return decadeLabel(r.decade) + " " + SHORT[r.fr]; };
export const money = (x: number) => "$" + x.toFixed(1) + "M";
export const slotPos = (id: string) => (id.startsWith("D") ? "D" : id);

/* Team rating as players see it: the weighted average of the slots filled so far, bonuses included. */
export function displayRating(picks: Record<string, Player>): number {
  const filled = SLOTS.filter((s) => picks[s.id]);
  if (!filled.length) return 0;
  const w = filled.reduce((a, s) => a + s.weight, 0);
  return CORE.ratingBreakdown(picks).total / w;
}

/* Chance of a perfect season for this exact schedule. */
export function perfectOdds(season: Season): number {
  return season.games.reduce((a, g) => a * g.p, 1);
}

/* Chance of reaching at least `need` wins over these games (exact, Poisson-binomial). */
export function chanceAtLeast(season: Season, need: number): number {
  let dist = [1];
  for (const g of season.games) {
    const next = new Array(dist.length + 1).fill(0);
    for (let k = 0; k < dist.length; k++) { next[k] += dist[k] * (1 - g.p); next[k + 1] += dist[k] * g.p; }
    dist = next;
  }
  let s = 0;
  for (let k = need; k < dist.length; k++) s += dist[k];
  return s;
}

export function streaks(games: Game[]) {
  let cur = 0, best = 0, bestStart = 1, bestEnd = 0, runStart = 1;
  games.forEach((g, i) => {
    if (g.win) { if (cur === 0) runStart = i + 1; cur++; if (cur > best) { best = cur; bestStart = runStart; bestEnd = i + 1; } }
    else cur = 0;
  });
  return { current: cur, best, bestStart, bestEnd };
}

/* Today's date in US Eastern, as a number like 20261010. The board resets at midnight Eastern. */
export function dayKey(): number {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return +p.replace(/-/g, "");
}
export function secondsToMidnightET(): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return 86400 - ((get("hour") % 24) * 3600 + get("minute") * 60 + get("second"));
}
export const hms = (sec: number) => [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60].map((n) => String(n).padStart(2, "0")).join(":");

/* The simulated field (bots) that ranks your season until the real leaderboard exists. Cached per day and mode. */
const FIELDS: Record<string, { key: number; teams: { name: string; wins: number; losses: number; rating: number; picks: Record<string, Player> }[] }> = {};
export function todaysField(mode: ModeKey) {
  const key = dayKey();
  let f = FIELDS[mode];
  if (!f || f.key !== key) f = FIELDS[mode] = { key, teams: CORE.buildField(key, 1000, mode) };
  return f.teams;
}

/* Jersey number color: the team's second color, unless it is too close to the body color. */
function lum(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a: string, b: string) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
export function jerseyColors(fr: string) {
  const f = FRANCHISES[fr] || { c1: "#151C2C", c2: "#FFFFFF" };
  const num = contrast(f.c1, f.c2) >= 2.2 ? f.c2 : contrast(f.c1, "#FFFFFF") > contrast(f.c1, "#111111") ? "#FFFFFF" : "#111111";
  return { body: f.c1, trim: f.c2, num };
}

/* Opponent sweater numbers for the Cap Cup board, looked up by name in the pool where we have them. */
const NUMBER_BY_NAME: Record<string, number> = {};
for (const r of CORE.ROSTERS as Roster[]) for (const p of r.players) if (p.number != null && NUMBER_BY_NAME[p.name] == null) NUMBER_BY_NAME[p.name] = p.number;
export const numberFor = (name: string) => NUMBER_BY_NAME[name] ?? null;

export const tierFor = (wins: number): { name: string; note: string } => CORE.tierFor(wins);

const NUM_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
export function fromPerfect(losses: number) {
  if (losses === 0) return "Not a single loss.";
  const w = losses <= 10 ? NUM_WORDS[losses] : String(losses);
  return w + (losses === 1 ? " loss" : " losses") + " from perfect.";
}
