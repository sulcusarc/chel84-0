import { Block, Page } from "../content";
import { Eyebrow } from "../components/Chrome";

/* Turns email addresses in copy into mailto links. */
function linkify(t: string) {
  const parts = t.split(/([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/);
  return parts.map((p, i) => (i % 2 ? <a key={i} href={"mailto:" + p}>{p}</a> : p));
}

function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p": return <p className="ip-p">{linkify(b.x)}</p>;
    case "ul": return <ul className="ip-ul">{b.x.map((x) => <li key={x}>{linkify(x)}</li>)}</ul>;
    case "formula": return <div className="ip-formula">{b.x.map((x, i) => <div key={i} className={i === 0 && b.x.length > 1 && x === x.toUpperCase() ? "fh" : ""}>{x}</div>)}</div>;
    case "callout": return <div className="ip-callout"><small>{b.h}</small><p>{b.x}</p></div>;
    case "steps": return (
      <ol className="ip-steps">{b.x.map(([h, d], i) => <li key={h}><span className="num blue">{i + 1}</span><div><b>{h}</b><p>{d}</p></div></li>)}</ol>
    );
    case "table": return (
      <div className="ip-table-wrap">
        <table className={"ip-table cols-" + b.head.length}>
          <thead><tr>{b.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{b.rows.map((r, i) => (
            <tr key={i} className={b.hl?.includes(i) ? "hl" : ""}>{r.map((c, j) => <td key={j} className={b.mono?.includes(j) ? "mono" : j === 0 ? "first" : ""}>{c}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    );
  }
}

export function InfoPage({ page, resume }: { page: Page; resume?: () => void }) {
  const jump = (id: string) => (e: React.MouseEvent) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return (
    <div className="info">
      {resume && <button className="resume-bar" onClick={resume}>← BACK TO YOUR DRAFT</button>}
      <nav className="ip-nav" aria-label="On this page">
        <p className="ip-nav-h">[ON THIS PAGE]</p>
        {page.sections.map((s, i) => (
          <a key={s.id} href={"#" + s.id} onClick={jump(s.id)}><span>{String(i + 1).padStart(2, "0")}</span>{s.nav.toUpperCase()}</a>
        ))}
      </nav>
      <article className="ip-content">
        <header className="ip-hero">
          <Eyebrow color={page.tiles ? "blue" : "yellow"}>{page.eyebrow}</Eyebrow>
          <h1>{page.title[0]}<br /><span className={page.tiles ? "blue" : "red"}>{page.title[1]}</span></h1>
          <p className="ip-lede">{page.lede}</p>
          {page.tiles && <div className="ip-tiles">{page.tiles.map(([n, l]) => <div key={l} className="ip-tile"><b>{n}</b><small>{l}</small></div>)}</div>}
        </header>
        {page.sections.map((s, i) => (
          <section key={s.id} id={s.id} className="ip-section">
            <h2><span>{String(i + 1).padStart(2, "0")}</span>{s.title}</h2>
            {s.blocks.map((b, j) => <BlockView key={j} b={b} />)}
          </section>
        ))}
      </article>
    </div>
  );
}
