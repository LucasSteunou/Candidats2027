import { useState } from "react";

import {
  WINDOW_DAYS,
  candidatePolls,
  candidatures,
  fmtDate,
  fmtNumber,
  fmtPct,
  fmtTimestamp,
  lastName,
  latestPollDate,
  pollDomain,
  scoreValue,
  sondages,
} from "./content.js";
import { Card, PageTitle, SourceChips, go } from "./ui.jsx";

const W = 320;
const H = 140;
const M = { top: 10, right: 46, bottom: 22, left: 26 };
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

const ROWS = candidatures.map((c) => ({ c, ...candidatePolls(c.id) }));
const Y_MAX = Math.ceil(Math.max(...ROWS.flatMap((r) => r.points.flatMap((p) => p.scores))) / 10) * 10;

function monthTicks([start, end]) {
  const ticks = [];
  const d = new Date(start);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  for (; d.getTime() <= end; d.setUTCMonth(d.getUTCMonth() + 1)) ticks.push(d.getTime());
  return ticks;
}

/** Small time chart: one dot per poll (its scores span a vertical bar), the rolling average as a line. */
export function TrendChart({ points, line, yMax, xDomain, label, describe }) {
  const [active, setActive] = useState(null);
  const x = (d) => M.left + ((d - xDomain[0]) / (xDomain[1] - xDomain[0])) * (W - M.left - M.right);
  const y = (v) => H - M.bottom - (v / yMax) * (H - M.top - M.bottom);

  // Any touch or drag on the chart selects the poll nearest in time (then in height, for polls ending the same day),
  // so a fingertip never has to land on a dot.
  const pick = (e) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    const px = ((e.clientX - box.left) * W) / box.width;
    const py = ((e.clientY - box.top) * H) / box.height;
    const distance = (p) => Math.abs(x(p.date) - px) * 100 + Math.abs(y(p.value) - py);
    setActive(points.reduce((best, p) => (distance(p) < distance(best) ? p : best)));
  };
  const step = yMax > 20 ? 10 : 5;
  const yTicks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step);
  const last = line.at(-1);
  const path = line.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join("");

  return (
    <figure className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onPointerDown={pick} onPointerMove={pick}>
        {yTicks.map((t) => (
          <g key={t}>
            <line className="grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
            <text className="tick" x={M.left - 6} y={y(t)} dy="0.32em" textAnchor="end">
              {t}
            </text>
          </g>
        ))}
        {monthTicks(xDomain).map((t) => (
          <text key={t} className="tick" x={x(t)} y={H - 6} textAnchor="middle">
            {MONTHS[new Date(t).getUTCMonth()]}
          </text>
        ))}
        {active ? <line className="crosshair" x1={x(active.date)} x2={x(active.date)} y1={M.top} y2={H - M.bottom} /> : null}
        {line.length > 1 ? <path className="trend-line" d={path} /> : null}
        {points.map((p, pi) => (
          <line
            key={`range-${pi}`}
            className="trend-range"
            x1={x(p.date)}
            x2={x(p.date)}
            y1={y(Math.min(...p.scores))}
            y2={y(Math.max(...p.scores))}
          />
        ))}
        {points.map((p, pi) => (
          <circle
            key={`${pi}-${p.date}`}
            className={p === active ? "trend-dot is-active" : "trend-dot"}
            cx={x(p.date)}
            cy={y(p.value)}
            r={p === active ? 5 : 3}
            tabIndex="0"
            aria-label={describe(p)}
            onFocus={() => setActive(p)}
          />
        ))}
        {last ? (
          <>
            <circle className="trend-end" cx={x(last.date)} cy={y(last.value)} r="4" />
            <text className="end-label" x={x(last.date) + 8} y={y(last.value)} dy="0.32em">
              {fmtPct(last.value)}
            </text>
          </>
        ) : null}
      </svg>
      <figcaption className="readout" aria-live="polite">
        {active ? describe(active) : "Touchez ou faites glisser le doigt sur la courbe pour le détail d'un sondage."}
      </figcaption>
    </figure>
  );
}

function describePoll(line) {
  return ({ poll, date, scores, raw }) => {
    const avg = line.find((p) => p.date === date);
    const sorted = [...raw].sort((a, b) => scoreValue(a) - scoreValue(b));
    const lo = sorted[0];
    const hi = sorted.at(-1);
    const range = lo === hi ? fmtPct(lo) : `${fmtNumber(lo)} à ${fmtPct(hi)}`;
    const hyp = `${scores.length} hypothèse${scores.length > 1 ? "s" : ""}`;
    return `${poll.institut}, terrain du ${fmtDate(poll.terrain[0])} au ${fmtDate(poll.terrain[1])} : ${range} (${hyp}). Moyenne ${WINDOW_DAYS} jours : ${fmtPct(avg.value)}.`;
  };
}

export function CandidateTrend({ id }) {
  const row = ROWS.find((r) => r.c.id === id);
  if (!row?.points.length) return <p className="muted">Pas de sondage saisi pour ce candidat.</p>;
  return (
    <TrendChart
      points={row.points}
      line={row.line}
      yMax={Y_MAX}
      xDomain={pollDomain}
      label={`Intentions de vote pour ${row.c.nom}, moyenne actuelle ${fmtPct(row.line.at(-1).value)}`}
      describe={describePoll(row.line)}
    />
  );
}

function AverageBars() {
  const ranked = ROWS.filter((r) => r.latest).sort((a, b) => b.latest.value - a.latest.value);
  const absent = ROWS.filter((r) => !r.latest);
  const max = ranked[0]?.latest.value ?? 1;
  return (
    <>
      <ol className="bars">
        {ranked.map(({ c, latest }) => (
          <li key={c.id}>
            <span className="bar-name">
              {c.fiche ? (
                <button type="button" className="text-link" onClick={() => go(`/c/${c.id}/popularite`)}>
                  {c.nom}
                </button>
              ) : (
                c.nom
              )}
              <small> · {latest.n} sondage{latest.n > 1 ? "s" : ""}</small>
            </span>
            <span className="bar-track">
              <span className="bar" style={{ width: `${(latest.value / max) * 100}%` }} />
              <span className="bar-value">{fmtPct(latest.value)}</span>
            </span>
          </li>
        ))}
      </ol>
      {absent.length ? (
        <p className="muted">Non testés dans les sondages saisis sur la période : {absent.map((r) => r.c.nom).join(", ")}.</p>
      ) : null}
    </>
  );
}

function PollTable({ poll }) {
  const ids = [...new Set(poll.hypotheses.flatMap((h) => Object.keys(h.scores)))].sort((a, b) =>
    lastName(sondages.noms[a]).localeCompare(lastName(sondages.noms[b]), "fr"),
  );
  return (
    <div className="table-scroll">
      <table className="poll-table">
        <thead>
          <tr>
            <th scope="col">Candidat</th>
            {poll.hypotheses.map((h, i) => (
              <th key={h.nom} scope="col" title={h.nom}>
                H{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => (
            <tr key={id}>
              <th scope="row">{sondages.noms[id]}</th>
              {poll.hypotheses.map((h) => (
                <td key={h.nom}>{h.scores[id] === undefined ? "–" : fmtNumber(h.scores[id])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PollLegend({ poll }) {
  // « Hypothèse 3 » or « Hypothèse unique » says nothing the column header does not already say.
  const described = poll.hypotheses.flatMap((h, i) =>
    /^Hypothèse (\d+|unique)$/.test(h.nom) ? [] : [{ n: i + 1, nom: h.nom.replace(/^Hypothèse /, "") }],
  );
  if (!described.length) return null;
  return (
    <ul className="legend">
      {described.map(({ n, nom }) => (
        <li key={n}>
          <b>H{n}</b> {nom}
        </li>
      ))}
    </ul>
  );
}

export default function SondagesView() {
  const polls = [...sondages.sondages].sort((a, b) => b.terrain[1].localeCompare(a.terrain[1]));
  return (
    <section className="page">
      <PageTitle eyebrow="Sondages" title="Intentions de vote au 1er tour">
        <p>
          Moyenne sur {WINDOW_DAYS} jours au {fmtTimestamp(latestPollDate)}, calculée de la même façon pour tous : chaque
          sondage compte une fois (moyenne de ses hypothèses, c'est-à-dire des scénarios de candidats, où le candidat est
          testé). Un sondage n'est pas une prévision ; la marge d'erreur va d'environ 1 à 3 points.
        </p>
        <p className="muted">{polls.length} sondages saisis à ce jour. {sondages.note}</p>
      </PageTitle>

      <Card title={`Moyenne sur ${WINDOW_DAYS} jours`}>
        <AverageBars />
      </Card>

      <Card title="Évolution par candidat">
        <p className="muted">
          Point : un sondage (moyenne de ses hypothèses) ; le trait va de son score le plus bas au plus haut. Ligne : moyenne
          sur {WINDOW_DAYS} jours. Même échelle pour tous.
        </p>
        <div className="multiples">
          {ROWS.filter((r) => r.points.length).map(({ c }) => (
            <div key={c.id} className="multiple">
              <h4>{c.nom}</h4>
              <CandidateTrend id={c.id} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Détail des sondages">
        <div className="how-to">
          <h4>Comment lire les tableaux</h4>
          <p>
            Un institut ne teste pas une seule liste de candidats : il soumet aux sondés plusieurs scénarios, que la
            Commission des sondages appelle des <strong>hypothèses</strong>. Elles diffèrent par les candidats en lice, par
            exemple un seul candidat du centre plutôt que deux.
          </p>
          <ul>
            <li>Chaque <strong>colonne</strong> (H1, H2…) est un scénario ; chaque <strong>ligne</strong> est un candidat.</li>
            <li>Le chiffre est le pourcentage des suffrages exprimés dans ce scénario. Une colonne fait environ 100 %.</li>
            <li>Un « – » signifie que le candidat n'est pas dans ce scénario. Il n'a pas été testé, ce n'est pas un 0.</li>
            <li>Tous les scénarios sont affichés, sans en privilégier un. Le tableau défile horizontalement.</li>
          </ul>
        </div>
        <div className="poll-list">
          {polls.map((poll) => (
            <article key={poll.id} className="poll">
              <h4>
                {poll.institut} pour {poll.commanditaires.join(" et ")}
              </h4>
              <p className="muted">
                Terrain du {fmtDate(poll.terrain[0])} au {fmtDate(poll.terrain[1])} · {poll.echantillon}{" "}
                <SourceChips ids={poll.sources} registry={sondages.sources} />
              </p>
              <PollTable poll={poll} />
              <PollLegend poll={poll} />
            </article>
          ))}
        </div>
      </Card>
    </section>
  );
}
