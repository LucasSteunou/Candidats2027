import methodologie from "../../METHODOLOGIE.md?raw";
import { fmtDate, perimetre } from "./content.js";
import { Card, PageTitle, ReportLink, STATUT_CANDIDATURE, SourceChips } from "./ui.jsx";

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
  return (
    <section className="page">
      <PageTitle eyebrow="Méthodo" title="Comment l'application est faite" />

      <Card title={`Périmètre au ${fmtDate(perimetre.maj)}`}>
        <p>
          1er tour le {fmtDate(perimetre.scrutin.premier_tour)}, 2nd tour le {fmtDate(perimetre.scrutin.second_tour)}.{" "}
          <SourceChips ids={perimetre.scrutin.sources} registry={registry} />
        </p>
      </Card>

      <Card title={`Candidatures retenues (${perimetre.candidatures.length})`}>
        <ul className="plain-list">
          {perimetre.candidatures.map((c) => (
            <li key={c.id}>
              <strong>{c.nom}</strong> · {STATUT_CANDIDATURE[c.statut]}. {c.precision}{" "}
              <SourceChips ids={[...c.sources_candidature, ...c.sources_sondage]} registry={registry} />
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Testés en sondage, sans fiche">
        <ul className="plain-list">
          {perimetre.testes_sans_fiche.map((t) => (
            <li key={t.nom}>
              <strong>{t.nom}</strong> · {t.raison} <SourceChips ids={t.sources} registry={registry} />
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Cités sans sondage">
        <p>
          {perimetre.cites_sans_sondage.noms.join(", ")}. {perimetre.cites_sans_sondage.precision}{" "}
          <SourceChips ids={perimetre.cites_sans_sondage.sources} registry={registry} />
        </p>
      </Card>

      {/* One card per ## section; the leading intro paragraph gets its own card too. */}
      {methodologie.split(/^(?=## )/m).map((section) => (
        <Card key={section} className="prose">
          <Markdown source={section} />
        </Card>
      ))}
      <ReportLink subject="Méthodologie" />
    </section>
  );
}
