// POST /api/season — a finished season.
// Body: { device, mode: "classic" | "iq" | "cap", wins, lineup: { LW: playerId, ... }, name?, opp? (Cap Cup record-team id) }
// Classic and ICE-IQ: replaces this device's row on today's board and returns the rank.
// Cap Cup: no board, only logged for the ticker.
import {
  db, dayKey, json, validDevice, checkLineup, plausible, lineupRating, topPick, lineupForStore,
  nameProblem, cleanName, RECORD_TEAMS, rankFor, BOARD_MODES, SLOT_IDS
} from "./_lib/board.js";

export async function POST(req: Request) {
  const sb = db();
  if (!sb) return json({ live: false });
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad request." }, 400); }

  const { device, mode } = b;
  const wins = Number(b.wins);
  if (!validDevice(device)) return json({ error: "Bad device id." }, 400);
  if (!["classic", "iq", "cap"].includes(mode)) return json({ error: "Unknown mode." }, 400);
  if (!Number.isInteger(wins) || wins < 0 || wins > 84) return json({ error: "Bad record." }, 400);

  const checked = checkLineup(b.lineup);
  if ("error" in checked) return json({ error: checked.error }, 400);
  const picks = checked.picks;
  const rating = lineupRating(picks);
  if (!plausible(rating, wins)) return json({ error: "That record doesn't add up for this lineup." }, 422);

  // One season every few seconds per device is plenty (the fastest Skip still takes longer).
  const since = new Date(Date.now() - 5000).toISOString();
  const recent = await sb.from("season_log").select("id", { count: "exact", head: true }).eq("device", device).gte("created_at", since);
  if ((recent.count || 0) > 0) return json({ error: "Slow down a little." }, 429);

  let name: string | null = null, nameError = "";
  if (typeof b.name === "string" && b.name.trim()) {
    const n = cleanName(b.name);
    nameError = nameProblem(n);
    if (!nameError) name = n;
  }

  const day = dayKey();
  let cupWon: boolean | null = null;
  if (mode === "cap") {
    const opp = RECORD_TEAMS.find((t) => t.id === b.opp);
    if (!opp) return json({ error: "Unknown opponent." }, 400);
    cupWon = wins >= opp.need;
  }

  const log = await sb.from("season_log").insert({
    day, mode, device, name, wins, rating, perfect: wins === 84, cup_won: cupWon,
    players: SLOT_IDS.map((id) => picks[id].name)
  });
  if (log.error) return json({ error: "Couldn't save the season." }, 500);

  if (!BOARD_MODES.includes(mode)) return json({ live: true, logged: true });

  // Name: the one sent now, else keep whatever name this device already has on today's row.
  const row: Record<string, unknown> = {
    day, mode, device, wins, losses: 84 - wins, rating,
    lineup: lineupForStore(picks), top_pick: topPick(picks), updated_at: new Date().toISOString()
  };
  if (name) row.name = name;
  const up = await sb.from("board").upsert(row, { onConflict: "day,mode,device" }).select("name, hidden").single();
  if (up.error) return json({ error: "Couldn't save the season." }, 500);

  const rank = await rankFor(sb, day, mode, wins, rating);
  return json({ live: true, day, rating, ...rank, name: up.data.name, onBoard: !!up.data.name && !up.data.hidden, nameError });
}
