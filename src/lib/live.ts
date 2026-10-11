// The live leaderboard: talks to the site's /api functions (backed by Supabase).
// Every call fails soft: if the backend is down or not connected yet, callers get null and fall back to the simulated field.
import { getPref, setPref } from "./prefs";
import { ModeKey, Player } from "./game";

export function deviceId(): string {
  let id = getPref("device", "");
  if (!id) {
    id = (crypto as any).randomUUID ? crypto.randomUUID() : Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
    setPref("device", id);
  }
  return id;
}
export const savedName = () => getPref("name", "");

async function call<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    const r = await fetch(path, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await r.json();
    if (data && data.live === false) return null;
    if (!r.ok) return { ...data, failed: true } as T;
    return data as T;
  } catch { return null; }
}

export interface PostResult { live: true; rank: number; total: number; beatsPct: number; rating: number; name: string | null; onBoard: boolean; nameError?: string; error?: string; failed?: boolean }
export function postSeason(mode: ModeKey, wins: number, picks: Record<string, Player>, opp?: string) {
  const lineup = Object.fromEntries(Object.entries(picks).map(([slot, p]) => [slot, p.id]));
  return call<PostResult>("/api/season", { device: deviceId(), mode, wins, lineup, name: savedName() || undefined, opp });
}

export async function saveName(name: string): Promise<{ name?: string; error?: string } | null> {
  const r = await call<{ name?: string; error?: string }>("/api/name", { device: deviceId(), name });
  if (r && r.name) setPref("name", r.name);
  return r;
}

export interface BoardRow { rank: number; rid: string; name: string; wins: number; losses: number; rating: number; top_pick: string; lineup: Record<string, { id: string; name: string; team: string }> }
export interface Board { total: number; rows: BoardRow[]; me: (Omit<BoardRow, "rid"> & { total: number; beatsPct: number; name: string | null }) | null }
export const fetchBoard = (mode: ModeKey) => call<Board>("/api/leaderboard?mode=" + mode + "&device=" + encodeURIComponent(deviceId()));

export interface Ticker { seasons: number; drafters: number; perfect_today: number; perfect_all: number; cups_today: number; best_classic: number | null; best_iq: number | null; most_drafted: { name: string; count: number } | null }
export const fetchTicker = () => call<Ticker>("/api/ticker");

/* Reporting hides that row for this device for the rest of the day, then tells the server. */
export function hiddenRids(): string[] {
  try { const v = JSON.parse(getPref("hidden", "{}")); return v.day === new Date().toDateString() ? v.rids : []; } catch { return []; }
}
export function report(mode: ModeKey, rid: string) {
  setPref("hidden", JSON.stringify({ day: new Date().toDateString(), rids: [...hiddenRids(), rid] }));
  return call<{ ok?: boolean }>("/api/report", { device: deviceId(), mode, rid });
}
