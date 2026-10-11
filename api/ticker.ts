// GET /api/ticker — today's real numbers for the home-page ticker. Cached for 30 seconds at the edge.
import { db, dayKey, json } from "./_lib/board.js";

export async function GET() {
  const sb = db();
  if (!sb) return json({ live: false });
  const { data, error } = await sb.rpc("ticker_stats", { p_day: dayKey() });
  if (error) return json({ live: false }, 200, "no-store");
  return json({ live: true, ...data }, 200, "public, s-maxage=30, stale-while-revalidate=60");
}
