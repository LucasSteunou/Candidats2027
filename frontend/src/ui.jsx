import { ExternalLink, X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { fmtDate } from "./content.js";

// Error reports land in RETOURS.md; the link stays hidden until an address is set.
const REPORT_EMAIL = "lulu.steun@gmail.com";

export function go(path) {
  window.location.hash = path;
}

export function ReportLink({ subject }) {
  if (!REPORT_EMAIL) return null;
  const body = `Rubrique : ${subject}\nCe qui me semble inexact :\nSource proposée (si possible) :\n`;
  return (
    <a className="report-link" href={`mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(`Erreur : ${subject}`)}&body=${encodeURIComponent(body)}`}>
      Signaler une erreur
    </a>
  );
}

export function Card({ title, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </section>
  );
}

export function PageTitle({ eyebrow, title, children }) {
  return (
    <header className="page-title">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {children}
    </header>
  );
}

const ORIGINE = {
  "programme-2027": "Programme 2027",
  "projet-parti": "Projet du parti",
  declaration: "Déclaration",
  "ancien-programme": "Ancien programme",
};

export function OrigineBadge({ origine, date }) {
  return (
    <span className={`badge badge-${origine}`}>
      {ORIGINE[origine]} · {fmtDate(date)}
    </span>
  );
}

export const STATUT_CANDIDATURE = {
  declare: "Candidature déclarée",
  investi: "Désigné·e par son parti",
  officiel: "Candidature officielle",
};

const SOURCE_TYPE = {
  officiel: "Source officielle",
  parti: "Document du parti ou du candidat",
  presse: "Presse",
  sondage: "Sondage",
  "think-tank": "Organisme d'études",
  justice: "Décision de justice",
  donnees: "Données",
};

const SourceContext = createContext(() => {});

/** Holds the single source sheet; any SourceChips below it can open it. */
export function SourceProvider({ children }) {
  const [open, setOpen] = useState(null);
  return (
    <SourceContext.Provider value={setOpen}>
      {children}
      {open ? <SourceSheet {...open} onClose={() => setOpen(null)} /> : null}
    </SourceContext.Provider>
  );
}

export function SourceChips({ ids, registry }) {
  const openSource = useContext(SourceContext);
  const order = Object.keys(registry);
  if (!ids?.length) return null;
  return (
    <span className="chips">
      {ids.map((id) => {
        const source = registry[id];
        const number = order.indexOf(id) + 1;
        return (
          <button
            key={id}
            type="button"
            className="chip-source"
            aria-label={`Source ${number} : ${source.titre}`}
            onClick={() => openSource({ source, number })}
          >
            {number}
          </button>
        );
      })}
    </span>
  );
}

export function SourceDetails({ source }) {
  const meta = [source.editeur, source.auteur, source.date ? fmtDate(source.date) : null].filter(Boolean).join(" · ");
  return (
    <>
      <p className="source-meta">{SOURCE_TYPE[source.type]}</p>
      <p className="source-title">{source.titre}</p>
      <p className="source-meta">{meta}</p>
      <p className="source-meta">Consulté le {fmtDate(source.consulte)}</p>
    </>
  );
}

function SourceSheet({ source, number, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-head">
          <h3 id="sheet-title">Source {number}</h3>
          <button ref={closeRef} type="button" className="icon-button" aria-label="Fermer" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <SourceDetails source={source} />
        <a className="primary-link" href={source.url} target="_blank" rel="noreferrer">
          Ouvrir la source <ExternalLink size={16} aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
