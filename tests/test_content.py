import copy

import pytest

from tools.content import (
    CONTENT_DIR,
    Perimetre,
    Themes,
    check_fiche,
    check_references,
    check_sondages,
    fiche_paths,
    load_json,
)

THEMES = Themes.model_validate(load_json(CONTENT_DIR / "themes.json"))
PERIMETRE_DOC = load_json(CONTENT_DIR / "perimetre.json")


def test_themes_ids_are_unique() -> None:
    ids = [q.id for t in THEMES.themes for st in t.sous_themes for q in st.questions]
    assert len(ids) == len(set(ids))
    for q in (q for t in THEMES.themes for st in t.sous_themes for q in st.questions):
        assert (q.type == "choix") == bool(q.options), q.id
        assert (q.type == "nombre") == bool(q.unite), q.id


def test_perimetre_is_valid_and_sourced() -> None:
    perimetre = Perimetre.model_validate(PERIMETRE_DOC)
    assert check_references(PERIMETRE_DOC) == []
    noms = [c.nom.split(" ", 1)[1] for c in perimetre.candidatures]
    assert noms == sorted(noms, key=str.casefold), "ordre alphabétique par nom de famille"


def test_sondages_are_consistent() -> None:
    assert check_sondages(load_json(CONTENT_DIR / "sondages.json")) == []


def test_sondages_reject_a_transcription_slip() -> None:
    doc = load_json(CONTENT_DIR / "sondages.json")
    doc["sondages"][0]["hypotheses"][0]["scores"]["le-pen"] += 10
    assert any("total" in e for e in check_sondages(doc))


@pytest.mark.parametrize("path", fiche_paths(), ids=lambda p: p.stem)
def test_fiche_respects_charter(path) -> None:
    doc = load_json(path)
    assert check_fiche(doc, THEMES) == []
    assert doc["id"] == path.stem
    assert doc["id"] in {c["id"] for c in PERIMETRE_DOC["candidatures"]}


SRC = {"titre": "T", "editeur": "E1", "consulte": "2026-10-23", "url": "https://example.org/a", "type": "presse"}


def minimal_fiche() -> dict:
    def texte():
        return {"texte": "Texte.", "sources": ["a"]}

    def evenement():
        return {"date": "2020", "titre": "T", "texte": "Texte.", "sources": ["a"]}

    return copy.deepcopy({
        "id": "test",
        "nom": "Test",
        "maj": "2026-10-23",
        "parti": {"nom": "P", "fondation": "2016", "positionnement": {"auto_definition": texte(), "nuance_ministere": texte()}},
        "resume": texte(),
        "histoire": {"parti": [evenement()], "candidat": [evenement()]},
        "popularite": {"chiffres_cles": [], "series": []},
        "perception": [],
        "controverses": [],
        "programme": {
            "etat": texte(),
            "themes": {
                t.id: {"reponses": {q.id: {"non_communique": "2026-10-23"} for st in t.sous_themes for q in st.questions}}
                for t in THEMES.themes
            },
        },
        "sources": {"a": SRC, "b": {**SRC, "editeur": "E2", "url": "https://example.org/b"}},
    })


def test_minimal_fiche_passes() -> None:
    doc = minimal_fiche()
    doc["resume"]["sources"] = ["a", "b"]
    assert check_fiche(doc, THEMES) == []


def broken(mutate) -> list[str]:
    doc = minimal_fiche()
    doc["resume"]["sources"] = ["a", "b"]
    mutate(doc)
    return check_fiche(doc, THEMES)


def answer(doc, qid, **reponse):
    for theme in doc["programme"]["themes"].values():
        if qid in theme["reponses"]:
            theme["reponses"][qid] = reponse


@pytest.mark.parametrize(
    "mutate",
    [
        pytest.param(lambda d: d["resume"].update(sources=[]), id="texte-sans-source"),
        pytest.param(lambda d: d["resume"].update(sources=["inconnue"]), id="source-inconnue"),
        pytest.param(lambda d: d["sources"].update(c={**SRC, "url": "https://example.org/c"}), id="source-jamais-citee"),
        pytest.param(lambda d: d["sources"]["a"].update(url="https://fr.wikipedia.org/wiki/X"), id="wikipedia"),
        pytest.param(lambda d: d["programme"]["themes"].pop("immigration"), id="theme-manquant"),
        pytest.param(lambda d: d["programme"]["themes"]["economie"]["reponses"].pop("smic"), id="question-manquante"),
        pytest.param(lambda d: answer(d, "smic", valeur="beaucoup", origine="declaration", date="2026", sources=["a"]), id="nombre-attendu"),
        pytest.param(lambda d: answer(d, "nucleaire", valeur="Peut-être", origine="declaration", date="2026", sources=["a"]), id="option-inconnue"),
        pytest.param(lambda d: answer(d, "nucleaire", valeur="Autre", origine="declaration", date="2026", sources=["a"]), id="autre-sans-precision"),
        pytest.param(lambda d: answer(d, "smic", valeur=1600.0, origine="declaration", date="2026"), id="reponse-sans-source"),
        pytest.param(lambda d: answer(d, "smic", valeur=1600.0, date="2026", sources=["a"]), id="reponse-sans-origine"),
        pytest.param(lambda d: d["resume"].update(texte="Une mesure irréaliste."), id="lexique"),
        pytest.param(
            lambda d: d["programme"]["themes"]["economie"].update(
                mesures=[{"sous_theme": "retraites", "intitule": "M", "detail": "D", "date": "2026", "sources": ["a"]}]
            ),
            id="mesure-sans-origine",
        ),
        pytest.param(
            lambda d: d["programme"]["themes"]["economie"].update(
                mesures=[{"sous_theme": "retraites", "intitule": "M", "detail": "D", "origine": "declaration", "date": "2026", "sources": ["a"],
                          "chiffrages": [{"montant": 1.0, "unite": "Md€", "sources": ["a"]}]}]
            ),
            id="chiffrage-sans-auteur",
        ),
        pytest.param(
            lambda d: d["controverses"].append(
                {"titre": "C", "date": "2020", "faits": "F", "statut_judiciaire": "enquete", "reponse": "R", "sources": ["a", "a"]}
            ),
            id="controverse-un-seul-editeur",
        ),
        pytest.param(
            lambda d: d["controverses"].append({"titre": "C", "date": "2020", "faits": "F", "reponse": "R", "sources": ["a", "b"]}),
            id="controverse-sans-statut",
        ),
    ],
)
def test_each_charter_rule_rejects_a_bad_fiche(mutate) -> None:
    assert broken(mutate) != []


def test_quotes_may_contain_evaluative_words() -> None:
    assert broken(lambda d: d["resume"].update(citation="« Un projet irréaliste », selon X.")) == []
