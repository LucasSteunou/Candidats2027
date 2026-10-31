import { ArrowLeft } from "lucide-react";
import { useEffect, useRef } from "react";

import { CandidateTrend } from "./Sondages.jsx";
import { WINDOW_DAYS, fmtDate, fmtNumber, themes } from "./content.js";
import { Card, ClampText, Fold, OrigineBadge, ReportLink, STATUT_CANDIDATURE, SourceChips, SourceDetails, go } from "./ui.jsx";

const TABS = [
  ["programme", "Programme"],
  ["popularite", "Popularité"],
  ["histoire", "Histoire"],
  ["perception", "Perception"],
  ["controverses", "Controverses"],
  ["sources", "Sources"],
];

const STATUT_JUDICIAIRE = {
  "aucune-procedure": "Aucune poursuite pénale",
  enquete: "Procédure en cours",
  "mise-en-examen": "Mise en examen",
  "renvoi-tribunal": "Renvoi devant un tribunal",
  "condamnation-premiere-instance": "Condamnation en première instance",
  "appel-en-cours": "Appel en cours",
  "pourvoi-en-cassation": "Condamnation en appel, pourvoi en cassation en cours",
  "condamnation-definitive": "Condamnation définitive",
  "relaxe-ou-non-lieu": "Relaxe ou non-lieu",
  "classement-sans-suite": "Classement sans suite",
};

const AVIS_TYPE = { sondage: "Sondage", organisation: "Organisation", presse: "Presse", personnalite: "Personnalité" };

export function answerText(question, reponse) {
  if (reponse.non_communique) return null;
  return question.type === "nombre" && reponse.valeur !== "Autre" ? `${fmtNumber(reponse.valeur)}\u00A0${question.unite}` : String(reponse.valeur);
}

/** One answer to a key question; shared with the comparator. */
export function AnswerValue({ question, reponse, registry }) {
  const text = answerText(question, reponse);
  return (
    <div className="answer">
      {text ? (
        <p className="answer-value">{text}</p>
      ) : (
        <p className="answer-value is-empty">Non communiqué à ce jour (vérifié le {fmtDate(reponse.non_communique)})</p>
      )}
      {reponse.origine ? <OrigineBadge origine={reponse.origine} date={reponse.date} /> : null}
      {reponse.precision ? (
        <ClampText text={reponse.precision} limit={160} after={<SourceChips ids={reponse.sources} registry={registry} />} />
      ) : (
        <SourceChips ids={reponse.sources} registry={registry} />
      )}
    </div>
  );
}

function Texte({ texte, registry }) {
  return (
    <div className="texte">
      <ClampText text={texte.texte} after={<SourceChips ids={texte.sources} registry={registry} />} />
      {texte.citation ? <blockquote>{texte.citation}</blockquote> : null}
    </div>
  );
}

function Programme({ fiche }) {
  const registry = fiche.sources;
  return (
    <>
      <Card title="État du programme">
        <Texte texte={fiche.programme.etat} registry={registry} />
      </Card>
      <div className="fold-list">
        {themes.map((theme) => {
          const prog = { mesures: [], ...fiche.programme.themes[theme.id] };
          const questions = theme.sous_themes.flatMap((st) => st.questions);
          const answered = questions.filter((q) => !prog.reponses[q.id].non_communique).length;
          return (
            <Fold
              key={theme.id}
              title={theme.titre}
              note={`${answered}/${questions.length} questions renseignées, ${prog.mesures.length} mesure${prog.mesures.length > 1 ? "s" : ""}`}
            >
              {prog.resume ? <Texte texte={prog.resume} registry={registry} /> : null}
              {theme.sous_themes.map((st) => (
                <section key={st.id} className="sous-theme">
                  <h3>{st.titre}</h3>
                  {prog.mesures
                    .filter((m) => m.sous_theme === st.id)
                    .map((m) => (
                      <article key={m.intitule} className="mesure">
                        <OrigineBadge origine={m.origine} date={m.date} />
                        <h4>{m.intitule}</h4>
                        <ClampText text={m.detail} after={<SourceChips ids={m.sources} registry={registry} />} />
                        {m.citation ? <blockquote>{m.citation}</blockquote> : null}
                        {(m.chiffrages ?? []).map((ch) => (
                          <p key={`${ch.auteur}-${ch.unite}`} className="chiffrage">
                            <strong>
                              {fmtNumber(ch.montant)} {ch.unite}
                            </strong>{" "}
                            selon {ch.auteur}
                            {ch.precision ? ` (${ch.precision})` : ""} <SourceChips ids={ch.sources} registry={registry} />
                          </p>
                        ))}
                      </article>
                    ))}
                  <dl className="questions">
                    {st.questions.map((q) => (
                      <div key={q.id} className="question">
                        <dt>
                          <span className="question-index">
                            {questions.indexOf(q) + 1}/{questions.length}
                          </span>
                          {q.intitule}
                        </dt>
                        <dd>
                          <AnswerValue question={q} reponse={prog.reponses[q.id]} registry={registry} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </Fold>
          );
        })}
      </div>
    </>
  );
}

function Popularite({ fiche }) {
  const { chiffres_cles: chiffres, series } = fiche.popularite;
  return (
    <>
      <div className="stat-grid">
        {chiffres.map((c) => (
          <div key={c.libelle} className="stat">
            <p className="stat-value">{c.valeur}</p>
            <p className="stat-label">{c.libelle}</p>
            <p className="muted">
              {fmtDate(c.date)} <SourceChips ids={c.sources} registry={fiche.sources} />
            </p>
          </div>
        ))}
      </div>
      <Card title="Intentions de vote au 1er tour">
        <p className="muted">
          Point : un sondage (moyenne de ses hypothèses) ; le trait va de son score le plus bas au plus haut. Ligne : moyenne
          sur {WINDOW_DAYS} jours.{" "}
          <button type="button" className="text-link" onClick={() => go("/sondages")}>
            Tous les sondages
          </button>
        </p>
        <CandidateTrend id={fiche.id} />
      </Card>
      {series.map((s) => (
        <Card key={s.titre} title={s.titre}>
          <ul className="plain-list">
            {s.points.map((p) => (
              <li key={p.date}>
                {fmtDate(p.date)} : {fmtNumber(p.valeur)} {s.unite} <SourceChips ids={p.sources} registry={fiche.sources} />
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </>
  );
}

function Timeline({ title, events, registry }) {
  return (
    <Card title={title}>
      <ol className="timeline">
        {events.map((e) => (
          <li key={`${e.date}-${e.titre}`}>
            <p className="timeline-date">{fmtDate(e.date)}</p>
            <p className="timeline-title">{e.titre}</p>
            <ClampText text={e.texte} limit={200} after={<SourceChips ids={e.sources} registry={registry} />} />
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Histoire({ fiche }) {
  const { parti } = fiche;
  return (
    <>
      <Card title="Positionnement">
        <p className="label">Comment le parti se définit</p>
        <Texte texte={parti.positionnement.auto_definition} registry={fiche.sources} />
        <p className="label">Classement par le ministère de l’Intérieur</p>
        <Texte texte={parti.positionnement.nuance_ministere} registry={fiche.sources} />
      </Card>
      <Timeline title={`Le parti : ${parti.nom}`} events={fiche.histoire.parti} registry={fiche.sources} />
      <Timeline title={`Le candidat : ${fiche.nom}`} events={fiche.histoire.candidat} registry={fiche.sources} />
    </>
  );
}

function Perception({ fiche }) {
  if (!fiche.perception.length) return <Card>Aucun élément recensé à ce jour.</Card>;
  return fiche.perception.map((a) => (
    <Card key={`${a.auteur}-${a.date}`} className="item">
      <h2 className="item-title">{a.auteur}</h2>
      <p className="meta">
        {AVIS_TYPE[a.type]}, {fmtDate(a.date)}
      </p>
      <ClampText text={a.texte} after={<SourceChips ids={a.sources} registry={fiche.sources} />} />
      {a.citation ? <blockquote>{a.citation}</blockquote> : null}
    </Card>
  ));
}

function Controverses({ fiche }) {
  return (
    <>
      <p className="muted">
        Même règle pour tous : une affaire figure ici si au moins deux médias d’éditeurs différents l’ont rapportée. La
        présomption d’innocence s’applique tant qu’il n’y a pas de condamnation définitive.
      </p>
      {fiche.controverses.length ? null : <Card>Aucune controverse retenue à ce jour.</Card>}
      {fiche.controverses.map((c) => (
        <Card key={c.titre} className="item">
          <h2 className="item-title">{c.titre}</h2>
          <p className="meta">{fmtDate(c.date)}</p>
          <span className="badge">{STATUT_JUDICIAIRE[c.statut_judiciaire]}</span>
          <ClampText text={c.faits} after={<SourceChips ids={c.sources} registry={fiche.sources} />} />
          <p className="label">Réponse</p>
          <ClampText text={c.reponse} limit={200} />
          {c.citation ? <blockquote>{c.citation}</blockquote> : null}
        </Card>
      ))}
    </>
  );
}

function Sources({ fiche }) {
  return (
    <Card title={`${Object.keys(fiche.sources).length} sources`}>
      <ol className="source-list">
        {Object.entries(fiche.sources).map(([id, s]) => (
          <li key={id}>
            <SourceDetails source={s} />
            <a href={s.url} target="_blank" rel="noreferrer">
              Ouvrir
            </a>
          </li>
        ))}
      </ol>
    </Card>
  );
}

const PANELS = { programme: Programme, popularite: Popularite, histoire: Histoire, perception: Perception, controverses: Controverses, sources: Sources };

export default function Fiche({ candidature, tab }) {
  const fiche = candidature.fiche;
  const active = PANELS[tab] ? tab : "programme";
  const Panel = PANELS[active];
  const tabsRef = useRef(null);
  // On a phone the tab row scrolls sideways: bring the open tab into view, without moving the page.
  useEffect(() => {
    const row = tabsRef.current;
    const current = row?.querySelector("[aria-current]");
    if (current) row.scrollLeft = current.offsetLeft - (row.clientWidth - current.offsetWidth) / 2;
  }, [active]);
  return (
    <article className="page">
      <button className="back-button" type="button" onClick={() => go("/")}>
        <ArrowLeft size={18} aria-hidden="true" />
        Candidats
      </button>
      <header className="fiche-head">
        <h1>{fiche.nom}</h1>
        <p className="fiche-party">
          {fiche.parti.nom}
          {fiche.parti.sigle ? ` (${fiche.parti.sigle})` : ""}
        </p>
        <p className="meta">
          {STATUT_CANDIDATURE[candidature.statut]}. Fiche mise à jour le {fmtDate(fiche.maj)}.
        </p>
        <Texte texte={fiche.resume} registry={fiche.sources} />
      </header>
      <nav ref={tabsRef} className="tabs" aria-label="Rubriques de la fiche">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={id === active ? "is-active" : ""}
            aria-current={id === active ? "page" : undefined}
            onClick={() => go(`/c/${fiche.id}/${id}`)}
          >
            {label}
          </button>
        ))}
      </nav>
      <Panel fiche={fiche} />
      <ReportLink subject={`${fiche.nom}, ${TABS.find(([id]) => id === active)[1]}`} />
    </article>
  );
}
