// POST /api/name — set or change this device's display name. Body: { device, name }.
// Renames today's rows in every mode, so the player appears on the board right away.
import { db, dayKey, json, validDevice, nameProblem, cleanName } from "./_lib/board.js";

export async function POST(req: Request) {
  const sb = db();
  if (!sb) return json({ live: false });
  let b: any;
  try { b = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  if (!validDevice(b.device) || typeof b.name !== "string") return json({ error: "Bad request." }, 400);
  const name = cleanName(b.name);
  const problem = nameProblem(name);
  if (problem) return json({ error: problem }, 422);
  const { error } = await sb.from("board").update({ name }).eq("day", dayKey()).eq("device", b.device);
  if (error) return json({ error: "Couldn't save the name." }, 500);
  return json({ live: true, name });
}
