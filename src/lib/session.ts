// The game in progress lives here, outside React, so it survives a trip to How It Works or About and back.
import { useEffect, useState } from "react";
import { CORE, ModeKey, Player, RecordTeam, Season } from "./game";

export type Phase = "draft" | "ready" | "sim" | "done";
export interface Draft {
  picks: Record<string, Player>;
  used: { decade: boolean; franchise: boolean };
  current: string | null;
  seen: string[];
  capOnly: boolean;
}
export interface CupResult { opp: string; wins: number; need: number; won: boolean }
export interface Session {
  mode: ModeKey;
  d: Draft;
  phase: Phase;
  opp: RecordTeam | null;
  season: Season | null;
  rating: number;           // final team rating, set when the season starts
  rng: () => number;
  note: string;             // e.g. Cap Cup free re-spin message
  history: CupResult[];     // Cap Cup: this session vs history
  id: number;               // changes whenever a new draft starts
}

let S: Session | null = null;
let version = 0;
const subs = new Set<() => void>();
export const bump = () => { version++; subs.forEach((f) => f()); };

export function useSession(): Session | null {
  const [, setV] = useState(version);
  useEffect(() => { const f = () => setV(version); subs.add(f); return () => { subs.delete(f); }; }, []);
  return S;
}
export const getSession = () => S;

let nextId = 1;
export function newSession(mode: ModeKey, keepHistory = false): Session {
  const seed = (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0;
  const rng = CORE.mulberry32(seed);
  const history = keepHistory && S && S.mode === mode ? S.history : [];
  S = {
    mode, d: CORE.newDraft({ cap: mode === "cap" }), phase: "draft",
    opp: mode === "cap" ? CORE.pickRecordTeam(rng) : null,
    season: null, rating: 0, rng, note: "", history, id: nextId++
  };
  bump();
  return S;
}
export function endSession() { S = null; bump(); }

/* Mid-draft = at least one pick made and not all six. Leaving then needs a warning. */
export function midDraft(): boolean {
  if (!S || S.phase !== "draft") return false;
  const n = Object.keys(S.d.picks).length;
  return n >= 1 && n < 6;
}
