import { BookOpen, ChartLine, ChevronRight, Scale, Users } from "lucide-react";
import { useEffect, useState } from "react";

import Comparer from "./Comparer.jsx";
import Fiche from "./Fiche.jsx";
import Methodo from "./Methodo.jsx";
import SondagesView from "./Sondages.jsx";
import { candidatePolls, candidatures, fmtDate, fmtPct, perimetre } from "./content.js";
import { Card, PageTitle, STATUT_CANDIDATURE, SourceProvider, go } from "./ui.jsx";

function routeFromHash() {
  return window.location.hash.replace(/^#/, "") || "/";
}

function useRoute() {
  const [route, setRoute] = useState(routeFromHash);
  useEffect(() => {
    const update = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return route;
}

const NAV = [
  ["/", "Candidats", Users],
  ["/comparer", "Comparer", Scale],
  ["/sondages", "Sondages", ChartLine],
  ["/methodo", "Méthodo", BookOpen],
];

function Candidats() {
  const days = Math.ceil((Date.parse(perimetre.scrutin.premier_tour) - Date.now()) / 86_400_000);
  return (
    <section className="page">
      <PageTitle title="Les candidatures">
        <p className="lead">
          1er tour le {fmtDate(perimetre.scrutin.premier_tour)}
          {days > 0 ? ` (J−${days})` : ""}. {candidatures.length} candidatures retenues selon une règle publique (voir
          Méthodo), par ordre alphabétique.
        </p>
      </PageTitle>
      <ul className="register">
        <li className="register-head" aria-hidden="true">
          <span>Candidature</span>
          <span>Sondages, moyenne</span>
        </li>
        {candidatures.map((c) => {
          const latest = candidatePolls(c.id).latest;
          const body = (
            <>
              <span className="cand-main">
                <span className="cand-name">{c.nom}</span>
                <span className="cand-party">{c.fiche?.parti.nom ?? c.etiquette_sondeurs}</span>
                <span className="cand-status">{STATUT_CANDIDATURE[c.statut]}</span>
              </span>
              <span className="cand-figure">
                {latest ? (
                  <>
                    <span className="num">{fmtPct(latest.value)}</span>
                    <span className="visually-hidden">sondages, en moyenne</span>
                  </>
                ) : (
                  <small>Pas de sondage saisi</small>
                )}
              </span>
              {c.fiche ? <ChevronRight size={20} aria-hidden="true" /> : <span className="badge">Fiche en préparation</span>}
            </>
          );
          return (
            <li key={c.id}>
              {c.fiche ? (
                <button type="button" className="cand-row" onClick={() => go(`/c/${c.id}`)}>
                  {body}
                </button>
              ) : (
                <div className="cand-row is-pending">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Page({ route }) {
  const fiche = route.match(/^\/c\/([^/]+)(?:\/([^/]+))?$/);
  if (fiche) {
    const candidature = candidatures.find((c) => c.id === fiche[1]);
    if (candidature?.fiche) return <Fiche candidature={candidature} tab={fiche[2]} />;
    return <Card title="Fiche introuvable">Cette fiche n’existe pas encore.</Card>;
  }
  const compare = route.match(/^\/comparer(?:\/([^/]+))?$/);
  if (compare) return <Comparer themeId={compare[1]} />;
  if (route === "/sondages") return <SondagesView />;
  if (route === "/methodo") return <Methodo />;
  return <Candidats />;
}

export default function App() {
  const route = useRoute();
  useEffect(() => {
    window.scrollTo(0, 0); // braces: an effect must return nothing or a cleanup, never scrollTo's result
  }, [route]);

  return (
    <SourceProvider>
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Aller au contenu
        </a>
        <header className="topbar">
          <p className="app-name">
            Présidentielle <span>2027</span>
          </p>
          <nav className="bottom-nav" aria-label="Navigation principale">
            {NAV.map(([path, label, Icon]) => {
              const active = path === "/" ? route === "/" || route.startsWith("/c/") : route.startsWith(path);
              return (
                <button
                  key={path}
                  type="button"
                  className={`nav-button ${active ? "is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => go(path)}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </header>
        <main id="main" className="main-content" tabIndex="-1">
          <Page route={route} />
        </main>
      </div>
    </SourceProvider>
  );
}
