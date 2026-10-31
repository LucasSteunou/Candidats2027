import methodologie from "../../METHODOLOGIE.md?raw";
import { fmtDate, perimetre } from "./content.js";
import { Card, Fold, PageTitle, ReportLink, STATUT_CANDIDATURE, SourceChips } from "./ui.jsx";

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function inline(text) {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

/** Renders the small Markdown subset METHODOLOGIE.md uses: ## headings, paragraphs, flat lists, bold, code, links. */
function Markdown({ source }) {
  const blocks = [];
  let list = null;
  for (const line of source.split("\n")) {
    const item = line.match(/^(\d+\.|-) (.*)/);
    if (item) {
      list ??= { ordered: item[1] !== "-", items: [] };
      list.items.push(item[2]);
      continue;
    }
    if (list) blocks.push(list);
    list = null;
    if (line.startsWith("## ")) blocks.push({ heading: line.slice(3) });
    else if (line.trim() && !line.startsWith("# ")) blocks.push({ text: line });
  }
  if (list) blocks.push(list);

  return blocks.map((b, i) => {
    if (b.heading) return <h3 key={i}>{b.heading}</h3>;
    if (b.text) return <p key={i}>{inline(b.text)}</p>;
    const List = b.ordered ? "ol" : "ul";
    return (
      <List key={i}>
        {b.items.map((item, j) => (
          <li key={j}>{inline(item)}</li>
        ))}
      </List>
    );
  });
}

export default function Methodo() {
  const registry = perimetre.sources;
  const [intro, ...sections] = methodologie.split(/^(?=## )/m);
  return (
    <section className="page">
      <PageTitle title="Comment l’application est faite">
        <div className="prose">
          <Markdown source={intro} />
        </div>
      </PageTitle>

      <Card title={`Périmètre au ${fmtDate(perimetre.maj)}`}>
        <p>
          1er tour le {fmtDate(perimetre.scrutin.premier_tour)}, 2nd tour le {fmtDate(perimetre.scrutin.second_tour)}.{" "}
          <SourceChips ids={perimetre.scrutin.sources} registry={registry} />
        </p>
        <div className="fold-list">
          <Fold title="Candidatures retenues" level="h3" note={`${perimetre.candidatures.length} candidatures`}>
            <ul className="plain-list fold-body">
              {perimetre.candidatures.map((c) => (
                <li key={c.id}>
                  <strong>{c.nom}</strong>
                  <span>
                    {STATUT_CANDIDATURE[c.statut]}. {c.precision}{" "}
                    <SourceChips ids={[...c.sources_candidature, ...c.sources_sondage]} registry={registry} />
                  </span>
                </li>
              ))}
            </ul>
          </Fold>

          <Fold title="Testés en sondage, sans fiche" level="h3" note={`${perimetre.testes_sans_fiche.length} personnes`}>
            <ul className="plain-list fold-body">
              {perimetre.testes_sans_fiche.map((t) => (
                <li key={t.nom}>
                  <strong>{t.nom}</strong>
                  <span>
                    {t.raison} <SourceChips ids={t.sources} registry={registry} />
                  </span>
                </li>
              ))}
            </ul>
          </Fold>

          <Fold title="Cités sans sondage" level="h3" note={`${perimetre.cites_sans_sondage.noms.length} personnes`}>
            <p className="fold-body">
              {perimetre.cites_sans_sondage.noms.join(", ")}. {perimetre.cites_sans_sondage.precision}{" "}
              <SourceChips ids={perimetre.cites_sans_sondage.sources} registry={registry} />
            </p>
          </Fold>
        </div>
      </Card>

      <div className="fold-list">
        {/* One fold per ## section of METHODOLOGIE.md, its heading as the fold's title. */}
        {sections.map((section) => {
          const [heading, ...body] = section.split("\n");
          return (
            <Fold key={heading} title={heading.slice(3)} level="h2">
              <div className="prose fold-body">
                <Markdown source={body.join("\n")} />
              </div>
            </Fold>
          );
        })}
      </div>
      <ReportLink subject="Méthodologie" />
    </section>
  );
}
