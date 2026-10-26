"""Content models and the objectivity checks from METHODOLOGIE.md."""

import json
import re
import datetime as dt
from pathlib import Path
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"

Refs = Annotated[list[str], Field(min_length=1)]
PartialDate = Annotated[str, Field(pattern=r"^\d{4}(-\d{2}(-\d{2})?)?$")]


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Source(Model):
    titre: str
    editeur: str
    auteur: str | None = None
    date: dt.date | None = None
    consulte: dt.date
    url: HttpUrl
    type: Literal["officiel", "parti", "presse", "sondage", "think-tank", "justice", "donnees"]

    @field_validator("url")
    @classmethod
    def not_wikipedia(cls, url: HttpUrl) -> HttpUrl:
        if url.host and url.host.endswith("wikipedia.org"):
            raise ValueError("Wikipédia n'est pas une source citable.")
        return url


class Texte(Model):
    texte: str
    citation: str | None = None
    sources: Refs


class Evenement(Model):
    date: PartialDate
    titre: str
    texte: str
    sources: Refs


class ChiffreCle(Model):
    libelle: str
    valeur: str
    date: PartialDate
    sources: Refs


class Point(Model):
    date: dt.date
    valeur: float
    sources: Refs


class Serie(Model):
    titre: str
    unite: str
    points: list[Point] = Field(min_length=1)


class Avis(Model):
    type: Literal["sondage", "organisation", "presse", "personnalite"]
    auteur: str
    texte: str
    citation: str | None = None
    date: PartialDate
    sources: Refs


class Controverse(Model):
    titre: str
    date: PartialDate
    faits: str
    statut_judiciaire: Literal[
        "aucune-procedure",
        "enquete",
        "mise-en-examen",
        "renvoi-tribunal",
        "condamnation-premiere-instance",
        "appel-en-cours",
        "pourvoi-en-cassation",
        "condamnation-definitive",
        "relaxe-ou-non-lieu",
        "classement-sans-suite",
    ]
    reponse: str
    citation: str | None = None
    sources: Annotated[list[str], Field(min_length=2)]


class Chiffrage(Model):
    auteur: str
    montant: float
    unite: str
    precision: str | None = None
    sources: Refs


Origine = Literal["programme-2027", "projet-parti", "declaration", "ancien-programme"]


class Mesure(Model):
    sous_theme: str
    intitule: str
    detail: str
    origine: Origine
    date: PartialDate
    citation: str | None = None
    chiffrages: list[Chiffrage] = []
    sources: Refs


class Reponse(Model):
    valeur: float | str | None = None
    precision: str | None = None
    origine: Origine | None = None
    date: PartialDate | None = None
    sources: list[str] = []
    non_communique: dt.date | None = None

    @model_validator(mode="after")
    def answered_or_dated(self) -> "Reponse":
        if self.non_communique is not None:
            if self.valeur is not None:
                raise ValueError("Une réponse « non communiqué » n'a pas de valeur.")
        elif self.valeur is None or not self.sources or not self.origine or not self.date:
            raise ValueError("Une réponse a une valeur, une origine, une date et au moins une source, ou une date « non_communique ».")
        return self


class ThemeProgramme(Model):
    resume: Texte | None = None
    mesures: list[Mesure] = []
    reponses: dict[str, Reponse]


class Programme(Model):
    etat: Texte
    themes: dict[str, ThemeProgramme]


class Positionnement(Model):
    auto_definition: Texte
    nuance_ministere: Texte


class Parti(Model):
    nom: str
    sigle: str | None = None
    fondation: PartialDate
    positionnement: Positionnement


class Histoire(Model):
    parti: list[Evenement] = Field(min_length=1)
    candidat: list[Evenement] = Field(min_length=1)


class Popularite(Model):
    chiffres_cles: list[ChiffreCle]
    series: list[Serie]


class Fiche(Model):
    id: str
    nom: str
    maj: dt.date
    parti: Parti
    resume: Texte
    histoire: Histoire
    popularite: Popularite
    perception: list[Avis]
    controverses: list[Controverse]
    programme: Programme
    sources: dict[str, Source]


class Question(Model):
    id: str
    intitule: str
    type: Literal["nombre", "choix", "texte"]
    unite: str | None = None
    options: list[str] | None = None
    aide: str | None = None


class SousTheme(Model):
    id: str
    titre: str
    questions: list[Question] = Field(min_length=1)


class Repere(Model):
    id: str
    titre: str
    unite: str
    producteur: str


class Theme(Model):
    id: str
    titre: str
    sous_themes: list[SousTheme] = Field(min_length=1)
    reperes: list[Repere]


class Themes(Model):
    version: int
    note: str
    themes: list[Theme]


class Candidature(Model):
    id: str
    nom: str
    etiquette_sondeurs: str | None
    statut: Literal["declare", "investi", "officiel"]
    precision: str
    sources_candidature: Refs
    sources_sondage: Refs


class SansFiche(Model):
    nom: str
    raison: str
    sources: Refs


class CitesSansSondage(Model):
    noms: list[str]
    precision: str
    sources: Refs


class Scrutin(Model):
    premier_tour: dt.date
    second_tour: dt.date
    sources: Refs


class Perimetre(Model):
    maj: dt.date
    regle: str
    fenetre_sondages_jours: int
    scrutin: Scrutin
    candidatures: list[Candidature]
    testes_sans_fiche: list[SansFiche]
    cites_sans_sondage: CitesSansSondage
    sources: dict[str, Source]


class Hypothese(Model):
    nom: str
    scores: dict[str, float] = Field(min_length=2)


class Sondage(Model):
    id: str
    institut: str
    commanditaires: list[str]
    terrain: Annotated[list[dt.date], Field(min_length=2, max_length=2)]
    echantillon: str
    hypotheses: list[Hypothese] = Field(min_length=1)
    sources: Refs


class Sondages(Model):
    maj: dt.date
    note: str
    noms: dict[str, str]
    sondages: list[Sondage]
    sources: dict[str, Source]


REF_KEYS = {"sources", "sources_candidature", "sources_sondage"}
# Evaluative words allowed only inside a quoted, attributed `citation` (or a party's own words / the ministry's label).
LEXIQUE = re.compile(
    r"\b(irréalistes?|démagogi(?:que|ques|e)|démagogues?|populistes?|populisme|courageu(?:x|se|ses)"
    r"|ambitieu(?:x|se|ses)|dangereu(?:x|se|ses)|scandaleu(?:x|se|ses)|utopiques?|absurdes?|laxistes?"
    r"|laxisme|brillante?s?|extrêmes?|extrémistes?|radica(?:l|le|les|ux)|sectaires?|simplistes?"
    r"|farfelue?s?|fantaisistes?|irresponsables?|audacieu(?:x|se|ses)|inquiétante?s?)\b",
    re.IGNORECASE,
)
LEXIQUE_EXEMPT = {"citation", "auto_definition", "nuance_ministere"}


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def walk(node, key=None):
    """Yield (key, value) for every value in a JSON tree."""
    if isinstance(node, dict):
        for k, v in node.items():
            yield k, v
            yield from walk(v, k)
    elif isinstance(node, list):
        for v in node:
            yield key, v
            yield from walk(v, key)


def check_references(doc: dict) -> list[str]:
    """Every cited source id exists in the document's registry, and every registered source is cited."""
    registry = set(doc.get("sources", {}))
    body = {k: v for k, v in doc.items() if k != "sources"}
    cited = {v for k, v in walk(body) if k in REF_KEYS and isinstance(v, str)}
    errors = [f"source inconnue : {ref}" for ref in sorted(cited - registry)]
    errors += [f"source jamais citée : {ref}" for ref in sorted(registry - cited)]
    return errors


def check_lexique(doc: dict) -> list[str]:
    def strings(node, key=None):
        if key in LEXIQUE_EXEMPT:
            return
        if isinstance(node, str):
            yield node
        elif isinstance(node, dict):
            for k, v in node.items():
                yield from strings(v, k)
        elif isinstance(node, list):
            for v in node:
                yield from strings(v, key)

    body = {k: v for k, v in doc.items() if k != "sources"}
    return [f"mot jugeant hors citation : « {m.group(0)} » dans « {s[:80]} »" for s in strings(body) for m in LEXIQUE.finditer(s)]


def check_fiche(doc: dict, themes: Themes) -> list[str]:
    """Charter checks that the schema alone cannot express."""
    try:
        fiche = Fiche.model_validate(doc)
    except ValueError as error:
        return [str(error)]
    errors = check_references(doc) + check_lexique(doc)

    expected = {t.id: t for t in themes.themes}
    if set(fiche.programme.themes) != set(expected):
        errors.append(f"thèmes attendus {sorted(expected)}, trouvés {sorted(fiche.programme.themes)}")
    for theme_id, prog in fiche.programme.themes.items():
        theme = expected.get(theme_id)
        if not theme:
            continue
        questions = {q.id: q for st in theme.sous_themes for q in st.questions}
        missing, extra = set(questions) - set(prog.reponses), set(prog.reponses) - set(questions)
        errors += [f"{theme_id} : question sans réponse {q}" for q in sorted(missing)]
        errors += [f"{theme_id} : question inconnue {q}" for q in sorted(extra)]
        sous_themes = {st.id for st in theme.sous_themes}
        errors += [f"{theme_id} : sous-thème inconnu {m.sous_theme}" for m in prog.mesures if m.sous_theme not in sous_themes]
        for qid, rep in prog.reponses.items():
            q = questions.get(qid)
            if not q or rep.valeur is None:
                continue
            if q.type == "nombre" and not isinstance(rep.valeur, float) and rep.valeur != "Autre":
                errors.append(f"{qid} : nombre attendu, trouvé {rep.valeur!r}")
            if q.type == "choix" and rep.valeur not in (q.options or []) + ["Autre"]:
                errors.append(f"{qid} : « {rep.valeur} » n'est pas une option")
            if rep.valeur == "Autre" and not rep.precision:
                errors.append(f"{qid} : « Autre » demande une précision")

    for c in fiche.controverses:
        if len({fiche.sources[s].editeur for s in c.sources if s in fiche.sources}) < 2:
            errors.append(f"controverse « {c.titre} » : il faut deux éditeurs différents")
    return errors


def check_sondages(doc: dict) -> list[str]:
    """Polls: known names, consistent dates, and hypotheses summing to ~100 % (catches transcription slips)."""
    try:
        data = Sondages.model_validate(doc)
    except ValueError as error:
        return [str(error)]
    errors = check_references(doc)
    for sondage in data.sondages:
        if sondage.terrain[0] > sondage.terrain[1]:
            errors.append(f"{sondage.id} : terrain inversé")
        for hyp in sondage.hypotheses:
            errors += [f"{sondage.id} / {hyp.nom} : nom inconnu {k}" for k in hyp.scores if k not in data.noms]
            total = sum(hyp.scores.values())
            if not 97 <= total <= 103:
                errors.append(f"{sondage.id} / {hyp.nom} : total {total} % (attendu 100 ± 3)")
    return errors


def fiche_paths() -> list[Path]:
    return sorted((CONTENT_DIR / "candidatures").glob("*.json"))
