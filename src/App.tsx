import { useCallback, useEffect, useState } from "react";
import { CORE, SLUG_MODE, MODE_SLUG, ModeKey, SHORT, dayKey } from "./lib/game";
import { navigate, usePath, setPref } from "./lib/prefs";
import { useSession, newSession, endSession, midDraft, bump, Session } from "./lib/session";
import { Header, LeaveWarning } from "./components/Chrome";
import { Home } from "./screens/Home";
import { DraftScreen } from "./screens/Draft";
import { SimScreen } from "./screens/Sim";
import { ResultsScreen, VerdictScreen } from "./screens/Results";
import { Leaderboard, topPick } from "./screens/Leaderboard";
import { InfoPage } from "./screens/InfoPage";
import { HOW, ABOUT } from "./content";
import { postSeason } from "./lib/live";

const FREE_PATHS = ["/how-it-works", "/about", "/leaderboard"];   // visiting these keeps your draft

export default function App() {
  const path = usePath();
  const s = useSession();
  const [pending, setPending] = useState<string | null>(null);

  /* Navigation with the leave-draft warning: only mid-draft, only when the trip would end the draft. */
  const go = useCallback((p: string) => {
    if (midDraft() && !FREE_PATHS.includes(p)) { setPending(p); return; }
    if (!FREE_PATHS.includes(p)) endSession();   // a mode card or Game modes always starts fresh
    navigate(p);
  }, []);

  useEffect(() => {
    const titles: Record<string, string> = { "/": "Chel 84-0", "/leaderboard": "Leaderboard · Chel 84-0", "/how-it-works": "How it works · Chel 84-0", "/about": "About · Chel 84-0" };
    document.title = titles[path] || "Play · Chel 84-0";
  }, [path]);

  const warning = pending && s ? (
    <LeaveWarning
      pick={Object.keys(s.d.picks).length + 1}
      onStay={() => setPending(null)}
      onLeave={() => { const p = pending; setPending(null); endSession(); navigate(p); }}
    />
  ) : null;

  const resume = s && (s.phase === "draft" || s.phase === "ready") && Object.keys(s.d.picks).length
    ? () => navigate("/play/" + MODE_SLUG[s.mode]) : undefined;

  let page: JSX.Element;
  if (path.startsWith("/play/")) {
    const mode = SLUG_MODE[path.split("/")[2]];
    page = mode ? <Play mode={mode} go={go} /> : <NotFound go={go} />;
  } else if (path === "/") {
    page = <Home go={go} />;
  } else if (path === "/leaderboard") {
    page = <><Header title="LEADERBOARD" go={go} /><Leaderboard go={go} /></>;
  } else if (path === "/how-it-works") {
    page = <><Header title="HOW IT WORKS" go={go} /><InfoPage page={HOW} resume={resume} /></>;
  } else if (path === "/about") {
    page = <><Header title="ABOUT" go={go} /><InfoPage page={ABOUT} resume={resume} /></>;
  } else {
    page = <NotFound go={go} />;
  }
  return <>{page}{warning}</>;
}

function NotFound({ go }: { go: (p: string) => void }) {
  return (
    <>
      <Header title="OFFSIDE" go={go} />
      <div className="not-found"><h1>THAT PAGE WAS WAVED OFF.</h1><button className="btn primary" onClick={() => go("/")}>BACK TO GAME MODES</button></div>
    </>
  );
}

function Dots({ n }: { n: number }) {
  return <span className="dots" aria-hidden="true">{[0, 1, 2, 3, 4, 5].map((i) => <i key={i} className={i < n - 1 ? "done" : i === n - 1 ? "cur" : ""} />)}</span>;
}

function Play({ mode, go }: { mode: ModeKey; go: (p: string) => void }) {
  const s = useSession();
  const [simTitle, setSimTitle] = useState("SEASON");
  useEffect(() => { if (!s || s.mode !== mode) newSession(mode); }, [s, mode]);
  if (!s || s.mode !== mode) return null;

  const picks = Object.keys(s.d.picks).length;
  let title: JSX.Element | string;
  if (s.phase === "draft") title = <span className="pick-count">PICK {Math.min(picks + 1, 6)} OF 6 <Dots n={picks + 1} /></span>;
  else if (s.phase === "ready") title = <span className="pick-count">SIX DRAFTED <Dots n={7} /></span>;
  else if (s.phase === "sim") title = simTitle;
  else title = mode === "cap" ? "CAP CUP · FINAL" : "SEASON COMPLETE";

  const startSeason = () => {
    s.rating = CORE.lineupRating(s.d.picks);
    s.season = CORE.simulateSeason(s.rating, s.rng);
    s.phase = "sim";
    bump();
    window.scrollTo(0, 0);
  };
  const finish = () => finishSeason(s);

  return (
    <div className={"play mode-" + mode}>
      <Header title={title} go={go} />
      {(s.phase === "draft" || s.phase === "ready") && <DraftScreen key={s.id} s={s} onStartSeason={startSeason} />}
      {s.phase === "sim" && <SimScreen key={"sim" + s.id} s={s} onDone={finish} setTitle={setSimTitle} />}
      {s.phase === "done" && mode !== "cap" && (
        <ResultsScreen s={s} again={() => { newSession(mode); window.scrollTo(0, 0); }} home={() => go("/")} board={() => go("/leaderboard")} />
      )}
      {s.phase === "done" && mode === "cap" && (
        <VerdictScreen s={s} newOpp={() => { newSession("cap", true); window.scrollTo(0, 0); }} home={() => go("/")} />
      )}
    </div>
  );
}

function finishSeason(s: Session) {
  if (s.phase !== "sim" || !s.season) return;
  s.phase = "done";
  if (s.mode === "cap" && s.opp) {
    const o = s.opp;
    s.history.push({ opp: o.season + " " + (o.fr ? SHORT[o.fr] : o.team.split(" ").slice(-1)[0]), wins: s.season.wins, need: o.need, won: s.season.wins >= o.need });
  } else {
    setPref("latest." + s.mode, JSON.stringify({ day: dayKey(), wins: s.season.wins, losses: s.season.losses, rating: s.rating, top: topPick(s.d.picks) }));
  }
  s.post = postSeason(s.mode, s.season.wins, s.d.picks, s.opp ? s.opp.id : undefined);
  bump();
  window.scrollTo(0, 0);
}
