// Small per-device preferences. Every read and write is guarded: storage can be missing or blocked.
import { useEffect, useState } from "react";

export function getPref(key: string, fallback: string): string {
  try { return localStorage.getItem("chel84." + key) ?? fallback; } catch { return fallback; }
}
export function setPref(key: string, value: string) {
  try { localStorage.setItem("chel84." + key, value); } catch { /* ignore */ }
}

export type Theme = "light" | "dark" | "system";
export function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
}

/* Shared preference state so the menu and anything else stay in sync. */
const listeners = new Set<() => void>();
export function usePref(key: string, fallback: string): [string, (v: string) => void] {
  const [v, setV] = useState(() => getPref(key, fallback));
  useEffect(() => {
    const fn = () => setV(getPref(key, fallback));
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, [key, fallback]);
  return [v, (nv: string) => { setPref(key, nv); listeners.forEach((f) => f()); }];
}

export const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Goal horn, made with Web Audio so there is no file to load. Only plays when Sound is on.
   Browsers (iPhone Safari especially) only allow sound from an audio context that was started during a tap or click.
   The win screen appears after a timer, not a tap, so we start one shared context on the player's taps
   (turning Sound on, Play 84 games, Skip, any button) and the horn plays through that unlocked context later. */
let audio: AudioContext | null = null;
function getAudio(): AudioContext | null {
  try {
    if (!audio) {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
    }
    return audio;
  } catch { return null; }
}
export function unlockAudio() {
  if (getPref("sound", "off") !== "on") return;
  const ctx = getAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  try {   // a silent blip finishes the unlock on older iPhones
    const b = ctx.createBuffer(1, 1, 22050), src = ctx.createBufferSource();
    src.buffer = b; src.connect(ctx.destination); src.start(0);
  } catch { /* ignore */ }
}
if (typeof window !== "undefined") {
  for (const ev of ["pointerdown", "keydown", "touchend"]) window.addEventListener(ev, unlockAudio, { passive: true });
}

export function playHorn() {
  if (getPref("sound", "off") !== "on") return;
  const ctx = getAudio();
  if (!ctx) return;
  const go = () => {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.3, now + 0.08);
    master.gain.setValueAtTime(0.3, now + 1.9);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    master.connect(ctx.destination);
    for (const f of [116, 147, 175]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(f, now);
      const g = ctx.createGain(); g.gain.value = 0.33;
      o.connect(g); g.connect(master);
      o.start(now); o.stop(now + 2.5);
    }
  };
  try {
    if (ctx.state === "suspended") ctx.resume().then(go).catch(() => {}); else go();
  } catch { /* no audio */ }
}

/* Tiny router: plain paths, history API. */
const navListeners = new Set<() => void>();
export function navigate(path: string) {
  if (path === location.pathname) return;
  history.pushState({}, "", path);
  window.scrollTo(0, 0);
  navListeners.forEach((f) => f());
}
export function usePath() {
  const [p, setP] = useState(location.pathname);
  useEffect(() => {
    const fn = () => setP(location.pathname);
    navListeners.add(fn);
    window.addEventListener("popstate", fn);
    return () => { navListeners.delete(fn); window.removeEventListener("popstate", fn); };
  }, []);
  return p;
}
