// Shared server code for the leaderboard API (files under api/_lib are not routes).
// The browser reports its finished season; the server never trusts its numbers blindly:
// the lineup must be real players in legal slots, the team rating is recomputed here,
// and the win total has to be believable for that rating.
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import CORE from "../../src/core/core.js";

const C: any = CORE;
export const SLOT_IDS = ["LW", "C", "RW", "D1", "D2", "G"];
export const BOARD_MODES = ["classic", "iq"];

let client: SupabaseClient | null = null;
export function db(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return null;   // not connected yet: endpoints answer { live: false } and the site keeps its simulated board
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

/* Today in US Eastern as 20261011. Same rule as the site: the board flips at midnight Eastern. */
export function dayKey(d = new Date()): number {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  return +p.replace(/-/g, "");
}

export const json = (body: unknown, status = 200, cache = "no-store") =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": cache } });

export const validDevice = (d: unknown): d is string => typeof d === "string" && /^[A-Za-z0-9-]{8,64}$/.test(d);

const PLAYER_BY_ID: Record<string, any> = {};
for (const r of C.ROSTERS) for (const p of r.players) PLAYER_BY_ID[p.id] = p;

/* lineup is { LW: "EDM-1980:3", ... }. Returns the players by slot, or an error message. */
export function checkLineup(lineup: unknown): { picks: Record<string, any> } | { error: string } {
  if (!lineup || typeof lineup !== "object") return { error: "Missing lineup." };
  const picks: Record<string, any> = {};
  const names = new Set<string>();
  for (const id of SLOT_IDS) {
    const p = PLAYER_BY_ID[(lineup as any)[id]];
    if (!p) return { error: "Unknown player in " + id + "." };
    const slot = C.SLOTS.find((s: any) => s.id === id);
    if (!C.eligible(slot, p)) return { error: p.name + " can't play " + id + "." };
    if (names.has(p.name)) return { error: p.name + " is in the lineup twice." };
    names.add(p.name);
    picks[id] = p;
  }
  return { picks };
}

/* Is this many wins believable for this rating? Over 200 simulated schedules, work out the exact chance of reaching
   at least that many wins and average it. Anything rarer than 1 in 10 million is rejected as tampered. */
export function plausible(rating: number, wins: number): boolean {
  const rng = C.mulberry32(Math.round(rating * 1000));
  const N = 200;
  let chance = 0;
  for (let i = 0; i < N; i++) {
    let dist = [1];
    for (const g of C.simulateSeason(rating, rng).games) {
      const next = new Array(dist.length + 1).fill(0);
      for (let k = 0; k < dist.length; k++) { next[k] += dist[k] * (1 - g.p); next[k + 1] += dist[k] * g.p; }
      dist = next;
    }
    for (let k = wins; k < dist.length; k++) chance += dist[k] / N;
  }
  return chance >= 1e-7;
}

export const teamLine = (p: any) => { const r = C.ROSTER_BY_KEY[p.rosterKey]; return r.decade + "s " + C.SHORT_NAME[r.fr]; };
export function topPick(picks: Record<string, any>) {
  const p = Object.values(picks).sort((a: any, b: any) => b.rating - a.rating)[0] as any;
  const r = C.ROSTER_BY_KEY[p.rosterKey];
  return p.name.split(" ").slice(-1)[0] + " · " + r.fr + " " + String(r.decade).slice(2) + "s";
}
export const lineupForStore = (picks: Record<string, any>) =>
  Object.fromEntries(SLOT_IDS.map((id) => [id, { id: picks[id].id, name: picks[id].name, team: teamLine(picks[id]) }]));

export const nameProblem = (n: string): string => C.nameProblem(n);
export const cleanName = (n: string) => n.replace(/\s+/g, " ").trim();
export const RECORD_TEAMS: any[] = C.RECORD_TEAMS;
export const lineupRating = (picks: Record<string, any>): number => Math.round(C.lineupRating(picks) * 100) / 100;

export async function rankFor(sb: SupabaseClient, day: number, mode: string, wins: number, rating: number) {
  const { data, error } = await sb.rpc("board_rank", { p_day: day, p_mode: mode, p_wins: wins, p_rating: rating });
  if (error) throw error;
  const better = Number(data.better), total = Number(data.total);
  return { rank: better + 1, total, beatsPct: total > 1 ? ((total - 1 - better) / (total - 1)) * 100 : 100 };
}
