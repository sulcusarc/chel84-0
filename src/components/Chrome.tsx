import { ReactNode, useEffect, useRef, useState } from "react";
import { applyTheme, Theme, usePref, unlockAudio, playHorn } from "../lib/prefs";

const MenuIcon = () => (
  <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="2" /></svg>
);
const Chevron = () => (
  <svg width="8" height="12" viewBox="0 0 8 12" aria-hidden="true"><path d="M1.5 1l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
);

export function Logo({ onClick }: { onClick: () => void }) {
  return (
    <a href="/" className="logo-link" aria-label="Chel 84-0 home" onClick={(e) => { e.preventDefault(); onClick(); }}>
      <img src="/assets/logo.svg" alt="Chel 84-0" className="hdr-logo" />
    </a>
  );
}

export function MenuButton({ go }: { go: (path: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="menu-wrap" ref={wrap}>
      <button className={"menu-btn" + (open ? " on" : "")} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        <MenuIcon /><span>MENU</span>
      </button>
      {open && <MenuPanel go={(p) => { setOpen(false); go(p); }} />}
    </div>
  );
}

export function Header({ title, go }: { title: ReactNode; go: (path: string) => void }) {
  return (
    <header className="hdr">
      <Logo onClick={() => go("/")} />
      <div className="hdr-title">{title}</div>
      <MenuButton go={go} />
    </header>
  );
}

function MenuPanel({ go }: { go: (p: string) => void }) {
  const [theme, setTheme] = usePref("theme", "system");
  const [sound, setSound] = usePref("sound", "off");
  const pickTheme = (t: Theme) => { setTheme(t); applyTheme(t); };
  return (
    <div className="menu-panel" role="menu">
      <p className="menu-label">APPEARANCE</p>
      <div className="seg" role="radiogroup" aria-label="Appearance">
        {(["light", "dark", "system"] as Theme[]).map((t) => (
          <button key={t} role="radio" aria-checked={theme === t} className={theme === t ? "on" : ""} onClick={() => pickTheme(t)}>
            {t === "light" ? "☀︎" : t === "dark" ? "☾" : "▭"}<span>{t.toUpperCase()}</span>
          </button>
        ))}
      </div>
      <div className="menu-sound">
        <div><p className="menu-label">SOUND</p><span>Goal horn when you win</span></div>
        <button className={"toggle" + (sound === "on" ? " on" : "")} role="switch" aria-checked={sound === "on"} onClick={() => { const next = sound === "on" ? "off" : "on"; setSound(next); if (next === "on") { unlockAudio(); playHorn(); } }}>
          <span className="toggle-text">{sound === "on" ? "ON" : "OFF"}</span><span className="track"><span className="knob" /></span>
        </button>
      </div>
      <nav className="menu-links">
        {[["GAME MODES", "/"], ["LEADERBOARD", "/leaderboard"], ["HOW TO PLAY", "/how-it-works"], ["ABOUT", "/about"]].map(([l, p]) => (
          <button key={p} role="menuitem" onClick={() => go(p)}><span>{l}</span><Chevron /></button>
        ))}
      </nav>
    </div>
  );
}

export function Modal({ children, onClose, className = "", label }: { children: ReactNode; onClose: () => void; className?: string; label: string }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal " + className} role="dialog" aria-modal="true" aria-label={label}>{children}</div>
    </div>
  );
}

export function LeaveWarning({ pick, onStay, onLeave }: { pick: number; onStay: () => void; onLeave: () => void }) {
  return (
    <Modal onClose={onStay} className="leave" label="Leave this draft?">
      <span className="accent-bar" />
      <h2>LEAVE THIS DRAFT?</h2>
      <p>You’re on pick {pick} of 6. If you leave now, this draft is gone and your re-rolls reset. There’s no going back to it.</p>
      <div className="modal-btns">
        <button className="btn primary" onClick={onStay} autoFocus>KEEP DRAFTING</button>
        <button className="btn danger" onClick={onLeave}>LEAVE DRAFT</button>
      </div>
    </Modal>
  );
}

export function CapIntro({ onStart, onClose }: { onStart: (hide: boolean) => void; onClose: () => void }) {
  const [hide, setHide] = useState(false);
  const steps = [
    ["GET YOUR OPPONENT", "You’re dealt one of the ten winningest teams ever, at random. Their record, scaled to 84 games, is the number to beat.", "blue"],
    ["DRAFT UNDER THE CAP", "Every player has a price. Stars cost big, and your six can’t go over $28M.", "blue"],
    ["STUCK? FREE SPIN", "If nobody on a roster fits your budget, you get a free re-spin. It doesn’t use a re-roll.", "blue"],
    ["WIN THE CUP", "Play 84 games. Win more than they did and the Cap Cup is yours.", "red"]
  ];
  return (
    <Modal onClose={onClose} className="cap-intro" label="How Cap Cup works">
      <span className="grabber" aria-hidden="true" />
      <div className="intro-top">
        <p className="eyebrow"><span className="chip red" />[HOW CAP CUP WORKS]</p>
        <button className="close" aria-label="Close" onClick={onClose}>✕</button>
      </div>
      <h2>CAP CUP</h2>
      <p className="intro-lede">Take on one of the ten winningest regular seasons in NHL history, with a salary cap on your six.</p>
      <ol className="steps">
        {steps.map(([t, d, c], i) => (
          <li key={t}><span className={"num " + c}>{i + 1}</span><div><b>{t}</b><p>{d}</p></div></li>
        ))}
      </ol>
      <p className="intro-note">Re-rolls, bonuses and ratings work the same as Classic.</p>
      <div className="intro-foot">
        <label className="check"><input type="checkbox" checked={hide} onChange={(e) => setHide(e.target.checked)} /><span>Don’t show this again</span></label>
        <button className="btn primary" onClick={() => onStart(hide)} autoFocus>LET’S GO</button>
      </div>
    </Modal>
  );
}

export function BonusChip({ label, type }: { label: string; type: string }) {
  return <span className={"bonus-chip " + type}>{label}</span>;
}

export function Eyebrow({ color, children, rule }: { color: "yellow" | "blue" | "red"; children: ReactNode; rule?: boolean }) {
  return <p className="eyebrow"><span className={"chip " + color} aria-hidden="true" />{children}{rule && <span className="rule" aria-hidden="true" />}</p>;
}
