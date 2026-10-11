// GET /api/leaderboard?mode=classic&device=... — today's top named teams, plus this device's own row.
import { db, dayKey, json, validDevice, rankFor, BOARD_MODES } from "./_lib/board.js";

export async function GET(req: Request) {
  const sb = db();
  if (!sb) return json({ live: false });
  const q = new URL(req.url).searchParams;
  const mode = q.get("mode") || "classic";
  if (!BOARD_MODES.includes(mode)) return json({ error: "Unknown mode." }, 400);
  const day = dayKey();

  const top = await sb.rpc("board_top", { p_day: day, p_mode: mode, p_limit: 25 });
  if (top.error) return json({ error: "Couldn't load the board." }, 500);

  let me = null;
  const device = q.get("device");
  if (validDevice(device)) {
    const r = await sb.from("board").select("name, wins, losses, rating, top_pick, lineup, hidden").eq("day", day).eq("mode", mode).eq("device", device).maybeSingle();
    if (r.data && !r.data.hidden) {
      const rank = await rankFor(sb, day, mode, r.data.wins, Number(r.data.rating));
      me = { ...r.data, rating: Number(r.data.rating), ...rank };
    }
  }
  const count = await sb.rpc("board_rank", { p_day: day, p_mode: mode, p_wins: 85, p_rating: 0 });
  const total = count.data ? Number(count.data.total) : 0;
  const rows = (top.data || []).map((r: any) => ({ ...r, rank: Number(r.rank), rating: Number(r.rating) }));
  return json({ live: true, day, total, rows, me });
}
