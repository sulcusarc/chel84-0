import { jerseyColors } from "../lib/game";

const BODY = "M36 4L14 10L2 58L16 62L24 30V84H72V30L80 62L94 58L82 10L60 4C52 10.6667 44 10.6667 36 4Z";

/* Long-sleeve hockey sweater: body in the team's first color, hem and arm stripes, collar and number in the second. */
export function Jersey({ fr, number, size = 96, className = "" }: { fr: string; number: number | null; size?: number; className?: string }) {
  const c = jerseyColors(fr);
  return (
    <svg className={"jersey " + className} width={size} height={(size * 86) / 96} viewBox="0 0 96 86" aria-hidden="true">
      <path d={BODY} fill={c.body} stroke={c.trim} strokeWidth="2" strokeLinejoin="round" />
      <path d="M24 70H72V76H24V70Z" fill={c.trim} />
      <path d="M5.4 44.6L18.2 53L17.4 56.2L4.2 49.4L5.4 44.6Z" fill={c.trim} />
      <path d="M90.6 44.6L77.8 53L78.6 56.2L91.8 49.4L90.6 44.6Z" fill={c.trim} />
      <path d="M36 4C44 10.6667 52 10.6667 60 4" stroke={c.trim} strokeWidth="3" strokeLinecap="round" fill="none" />
      {number != null && (
        <text x="48" y="37" textAnchor="middle" dominantBaseline="central" fontFamily="'Squada One', 'Archivo Black', sans-serif" fontSize={String(number).length > 1 ? 30 : 32} fill={c.num}>
          {number}
        </text>
      )}
    </svg>
  );
}

export function EmptyJersey({ label, size = 96, className = "" }: { label: string; size?: number; className?: string }) {
  return (
    <svg className={"jersey empty " + className} width={size} height={(size * 86) / 96} viewBox="0 0 96 86" aria-hidden="true">
      <path d={BODY} fill="none" stroke="var(--faint-jersey)" strokeWidth="2" strokeLinejoin="round" strokeDasharray="5 4" />
      <text x="48" y="42" textAnchor="middle" dominantBaseline="central" fontFamily="var(--font-mono)" fontSize="13" fill="var(--faint-jersey)">{label}</text>
    </svg>
  );
}
