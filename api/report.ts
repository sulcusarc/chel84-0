// POST /api/report — report a display name. Body: { device, mode, rid } (rid comes from /api/leaderboard).
// Saved for Daniel to review in Supabase (reports table). Hiding it for the reporter happens in their browser.
import { db, dayKey, json, validDevice, BOARD_MODES } from "./_lib/board.js";
import { createHash } from "node:crypto";

export async function POST(req: Request) {
  const sb = db();
  if (!sb) return json({ live: false });
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  if (!validDevice(b.device) || !BOARD_MODES.includes(b.mode) || typeof b.rid !== "string") return json({ error: "Bad request." }, 400);
  const day = dayKey();
  const rows = await sb.from("board").select("device, name").eq("day", day).eq("mode", b.mode).not("name", "is", null);
  const hit = (rows.data || []).find((r: any) => createHash("md5").update(r.device + ":" + day).digest("hex") === b.rid);
  if (!hit) return json({ error: "That team isn't on today's board." }, 404);
  const { error } = await sb.from("reports").insert({ day, mode: b.mode, reported_device: hit.device, reported_name: hit.name, reporter_device: b.device });
  if (error) return json({ error: "Couldn't send the report." }, 500);
  return json({ live: true, ok: true });
}
