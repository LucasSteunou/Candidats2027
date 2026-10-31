import { ChevronDown, ExternalLink, X } from "lucide-react";
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

export function Card({ title, level: Heading = "h2", children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {title ? <Heading className="card-title">{title}</Heading> : null}
      {children}
    </section>
  );
}

/** A disclosure row ruled above and below; `level` makes its title a real heading for screen-reader navigation. */
export function Fold({ title, note, open, level: Heading = "strong", className = "", children }) {
  return (
    <details className={`theme ${className}`} open={open}>
      <summary>
        <span>
          <Heading className="fold-title">{title}</Heading>
          {note ? <small>{note}</small> : null}
        </span>
        <ChevronDown size={20} aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}

const WIDE = "(min-width: 60rem)";

/** True from 60rem, where a line holds about twice the characters of a phone line. */
function useWide() {
  const query = typeof window.matchMedia === "function" ? window.matchMedia(WIDE) : null;
  const [wide, setWide] = useState(() => query?.matches ?? false);
  useEffect(() => {
    if (!query) return undefined;
    const update = () => setWide(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [query]);
  return wide;
}

/** Keeps a figure on the same line as its unit: « 19,58 % », « 9 Md€ ». */
export const withUnits = (text) => text.replace(/(\d) (?=%|€|Md€|M€)/g, "$1\u202F");

/** Cuts a paragraph at the last word before `limit` characters (twice that from 60rem), never inside « », with « Lire la suite ». */
export function cutText(text, limit) {
  if (text.length <= limit * 1.4) return null; // hiding less than about two lines is not worth a tap
  let head = text.slice(0, text.lastIndexOf(" ", limit));
  const quote = head.lastIndexOf("«");
  if (quote > head.lastIndexOf("»")) head = head.slice(0, quote);
  return `${head.trimEnd()}…`;
}

export function ClampText({ text, limit = 240, after = null }) {
  const [open, setOpen] = useState(false);
  const cut = cutText(text, useWide() ? limit * 2 : limit);
  return (
    <>
      <p className="clamp">{withUnits(cut && !open ? cut : text)}</p>
      {cut || after ? (
        <p className="clamp-foot">
          {cut ? (
            <button type="button" className="text-link more" aria-expanded={open} onClick={() => setOpen(!open)}>
              {open ? "Réduire" : "Lire la suite"}
            </button>
          ) : null}
          {after}
        </p>
      ) : null}
    </>
  );
}

export function PageTitle({ title, children }) {
  return (
    <header className="page-title">
      <h1>{title}</h1>
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
  "think-tank": "Organisme d’études",
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
  const meta = [source.editeur, source.auteur, source.date ? fmtDate(source.date) : null].filter(Boolean).join(", ");
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
          <h2 id="sheet-title">Source {number}</h2>
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
