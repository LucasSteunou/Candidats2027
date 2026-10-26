import { useState } from "react";

import { AnswerValue } from "./Fiche.jsx";
import { candidatures, fmtNumber, themes } from "./content.js";
import { Card, PageTitle, go } from "./ui.jsx";

const WITH_FICHE = candidatures.filter((c) => c.fiche);

/** Numeric answers on one shared axis; the rows below carry every value as text. */
function DotStrip({ question, rows }) {
  const values = rows.map((r) => r.reponse.valeur);
  const lo = Math.min(0, ...values);
  const hi = Math.max(...values);
  const pos = (v) => (hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100);
  return (
    <div className="dotstrip" role="img" aria-label={`${question.intitule} : ${rows.map((r) => `${r.c.nom} ${fmtNumber(r.reponse.valeur)}`).join(", ")}`}>
      <div className="dotstrip-axis">
        {rows.map((r) => (
          <span key={r.c.id} className="dotstrip-dot" style={{ left: `${pos(r.reponse.valeur)}%` }} title={`${r.c.nom} : ${fmtNumber(r.reponse.valeur)}`} />
        ))}
      </div>
      <div className="dotstrip-scale">
        <span>{fmtNumber(lo)}</span>
        <span>
          {fmtNumber(hi)} {question.unite}
        </span>
      </div>
    </div>
  );
}

export default function Comparer({ themeId }) {
  const theme = themes.find((t) => t.id === themeId) ?? themes[0];
  const [selected, setSelected] = useState(() => new Set(WITH_FICHE.map((c) => c.id)));
  const shown = WITH_FICHE.filter((c) => selected.has(c.id));

  function toggle(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  return (
    <section className="page">
      <PageTitle eyebrow="Comparer" title="Les positions, question par question">
        <p className="muted">
          {WITH_FICHE.length} fiche{WITH_FICHE.length > 1 ? "s" : ""} disponible{WITH_FICHE.length > 1 ? "s" : ""} sur{" "}
          {candidatures.length} candidatures. Le comparateur se complète au fil des fiches.
        </p>
      </PageTitle>

      <div className="filter-row" role="group" aria-label="Thème">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`chip-toggle ${t.id === theme.id ? "is-active" : ""}`}
            aria-pressed={t.id === theme.id}
            onClick={() => go(`/comparer/${t.id}`)}
          >
            {t.titre}
          </button>
        ))}
      </div>
      <div className="filter-row" role="group" aria-label="Candidats affichés">
        {WITH_FICHE.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`chip-toggle ${selected.has(c.id) ? "is-active" : ""}`}
            aria-pressed={selected.has(c.id)}
            onClick={() => toggle(c.id)}
          >
            {c.nom}
          </button>
        ))}
      </div>

      {theme.sous_themes.map((st) => (
        <section key={st.id} className="page">
          <h3 className="section-heading">{st.titre}</h3>
          {st.questions.map((q) => {
            const rows = shown.map((c) => ({ c, reponse: c.fiche.programme.themes[theme.id].reponses[q.id] }));
            const numeric = q.type === "nombre" ? rows.filter((r) => typeof r.reponse.valeur === "number") : [];
            return (
              <Card key={q.id} title={q.intitule}>
                {numeric.length > 1 ? <DotStrip question={q} rows={numeric} /> : null}
                <ul className="compare-rows">
                  {rows.map(({ c, reponse }) => (
                    <li key={c.id}>
                      <button type="button" className="text-link compare-name" onClick={() => go(`/c/${c.id}/programme`)}>
                        {c.nom}
                      </button>
                      <AnswerValue question={q} reponse={reponse} registry={c.fiche.sources} />
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </section>
      ))}
    </section>
  );
}
