import { useEffect, useState } from "react";
import { MenuButton } from "../components/Chrome";
import { hms, secondsToMidnightET } from "../lib/game";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p>BUILT BY DANIEL HASSELL</p>
        <p>SEASON STATS FROM THE NHL STATS SERVICE</p>
        <p>PLAYER RATINGS AND GSAA CALCULATED BY DANIEL HASSELL</p>
        <p>GSAA = SAVES − (SHOTS AGAINST × THAT SEASON’S LEAGUE SAVE %), PER 82 GAMES</p>
        <p>INSPIRED BY <a href="https://82-0.com/" target="_blank" rel="noreferrer">82-0</a></p>
        <p>NOT AFFILIATED WITH THE NHL</p>
      </div>
    </footer>
  );
}

function Ticker() {
  const [t, setT] = useState(secondsToMidnightET());
  useEffect(() => { const i = setInterval(() => setT(secondsToMidnightET()), 1000); return () => clearInterval(i); }, []);
  const items: { label: string; value: string; tone?: string }[] = [
    { label: "SEASONS", value: "55" },
    { label: "ROSTERS", value: "173" },
    { label: "PLAYERS", value: "3,441" },
    { label: "84-0 SEASONS ALL TIME", value: "0", tone: "gold" },
    { label: "MODES", value: "CLASSIC · ICE-IQ · CAP CUP" },
    { label: "BOARD RESETS IN", value: hms(t) }
  ];
  return (
    <section className="ticker" aria-label="Today">
      <div className="ticker-tag"><span className="ticker-dot" aria-hidden="true" />TODAY</div>
      <div className="ticker-window">
        <div className="ticker-track">
          {[0, 1].map((copy) => items.map((it) => (
            <span key={copy + it.label} className="ticker-item" aria-hidden={copy ? true : undefined}>
              <span className="label">{it.label}</span><span className={"value " + (it.tone || "")}>{it.value}</span>
            </span>
          )))}
        </div>
      </div>
    </section>
  );
}

export function Home({ go }: { go: (p: string) => void }) {
  const link = (p: string) => (e: React.MouseEvent) => { e.preventDefault(); go(p); };
  return (
    <div className="home">
      <div className="boards" aria-hidden="true" />
      <header className="masthead">
        <a href="/" aria-label="Chel 84-0 home" onClick={link("/")}><img className="logo" src="/assets/logo.svg" alt="Chel 84-0" /></a>
        <div className="home-menu"><MenuButton go={go} /></div>
      </header>
      <Ticker />
      <main className="main">
        <section className="hero" aria-labelledby="heroTitle">
          <p className="eyebrow"><span className="chip yellow" aria-hidden="true" />[A STARTING-LINEUP SIMULATOR]</p>
          <h1 id="heroTitle">SPIN. DRAFT.<br />CHASE <span className="red">84-0.</span></h1>
          <p className="lede">From 20-year-old phenoms to your dad’s childhood hero, anything is fair game. Draft six. Simulate 84. Go undefeated, or spend the offseason explaining to the boys how you lost with Gretzky on your team.</p>
          <div className="actions">
            <a className="btn btn-primary" href="/leaderboard" onClick={link("/leaderboard")}>LEADERBOARD</a>
            <a className="btn btn-outline" href="/how-it-works" onClick={link("/how-it-works")}>HOW IT WORKS</a>
          </div>
        </section>
        <section className="modes" aria-labelledby="modesTitle">
          <p className="eyebrow" id="modesTitle"><span className="chip blue" aria-hidden="true" />[GAME MODES]<span className="rule" aria-hidden="true" /></p>
          <div className="cards">
            <a className="card" href="/play/classic" onClick={link("/play/classic")}><img src="/assets/card-classic.png" alt="Classic: full stat transparency" /></a>
            <a className="card" href="/play/ice-iq" onClick={link("/play/ice-iq")}><img src="/assets/card-iceiq.png" alt="ICE-IQ: no ratings and no hints" /></a>
            <a className="card" href="/play/cap-cup" onClick={link("/play/cap-cup")}><img src="/assets/card-capcup.png" alt="Cap Cup: face off against history" /></a>
          </div>
          <p className="pick-hint">[PICK A MODE TO GET STARTED]</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
