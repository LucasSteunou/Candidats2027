import { useState } from "react";

import { AnswerValue } from "./Fiche.jsx";
import { candidatures, fmtNumber, themes } from "./content.js";
import { Card, Fold, PageTitle, go } from "./ui.jsx";

const WITH_FICHE = candidatures.filter((c) => c.fiche);

/** Numeric answers on one shared axis; the rows below carry every value as text. A touch names the nearest dot(s). */
function DotStrip({ question, rows }) {
  const [active, setActive] = useState(null);
  const values = rows.map((r) => r.reponse.valeur);
  const lo = Math.min(0, ...values);
  const hi = Math.max(...values);
  const pos = (v) => (hi === lo ? 50 : ((v - lo) / (hi - lo)) * 100);

  const pick = (e) => {
    const box = e.currentTarget.firstChild.getBoundingClientRect();
    if (!box.width) return;
    const at = ((e.clientX - box.left) / box.width) * 100;
    setActive(values.reduce((best, v) => (Math.abs(pos(v) - at) < Math.abs(pos(best) - at) ? v : best)));
  };
  const named = rows.filter((r) => r.reponse.valeur === active).map((r) => r.c.nom);

  return (
    <div className="dotstrip" role="img" aria-label={`${question.intitule} : ${rows.map((r) => `${r.c.nom} ${fmtNumber(r.reponse.valeur)}`).join(", ")}`} onPointerDown={pick} onPointerMove={pick}>
      <div className="dotstrip-axis">
        {rows.map((r) => (
          <span key={r.c.id} className={`dotstrip-dot ${r.reponse.valeur === active ? "is-active" : ""}`} style={{ left: `${pos(r.reponse.valeur)}%` }} />
        ))}
      </div>
      <div className="dotstrip-scale">
        <span>{fmtNumber(lo)}</span>
        <span>
          {fmtNumber(hi)} {question.unite}
        </span>
      </div>
      <p className="dotstrip-readout" aria-hidden="true">
        {named.length ? `${named.join(", ")} : ${fmtNumber(active)} ${question.unite}` : ""}
      </p>
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
      <PageTitle title="Les positions, question par question">
        <p className="lead">
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
      <Fold title="Candidats affichés" note={`${shown.length} sur ${WITH_FICHE.length}`} className="filter-fold">
        <div className="filter-wrap" role="group" aria-label="Candidats affichés">
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
      </Fold>

      <div className="fold-list">
        {theme.sous_themes.map((st) => (
          <Fold key={st.id} title={st.titre} level="h2" note={`${st.questions.length} question${st.questions.length > 1 ? "s" : ""}`}>
            <div className="sous-theme">
              {st.questions.map((q) => {
                const rows = shown.map((c) => ({ c, reponse: c.fiche.programme.themes[theme.id].reponses[q.id] }));
                const numeric = q.type === "nombre" ? rows.filter((r) => typeof r.reponse.valeur === "number") : [];
                return (
                  <Card key={q.id} title={q.intitule} level="h3" className="question-card">
                    {numeric.length > 1 ? <DotStrip question={q} rows={numeric} /> : null}
                    <ul className="compare-rows">
                      {rows.map(({ c, reponse }) => (
                        <li key={c.id} className={reponse.non_communique && !reponse.precision ? "is-empty" : undefined}>
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
            </div>
          </Fold>
        ))}
      </div>
    </section>
  );
}
