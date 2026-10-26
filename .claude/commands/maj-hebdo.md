---
description: Passe hebdomadaire (sondages, périmètre, liens, veille) livrée en pull request
---

Passe hebdomadaire de mise à jour, menée seul, sans interlocuteur. Ne rien publier sur `main` : tout passe par une pull request que l'utilisateur relira. Rester sobre : une ou deux recherches web par candidat pour la veille.

0. **Préparer** : `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`, puis `cd frontend && npm ci`. Créer la branche `maj-hebdo/<date du jour>`.
1. **Sondages** : suivre `.claude/commands/maj-sondages.md`.
2. **Périmètre** (`content/perimetre.json`) : appliquer la règle du champ `regle`. Ajouter les déclarations formelles ou désignations nouvelles, noter les retraits, mettre à jour les sources de sondage de chaque candidature (fenêtre de 60 jours) et `maj`. Ne pas créer ni supprimer de fiche : le signaler dans la pull request.
3. **Liens** : `.venv/bin/python -m tools.check_links`. Remplacer l'URL d'un document qui a seulement changé d'adresse ; signaler les autres. Faux positif connu : `fr.timesofisrael.com` répond 403 aux scripts mais s'ouvre dans un navigateur.
4. **Veille** : pour chaque fiche de `content/candidatures/`, chercher les événements survenus depuis sa date `maj` : programme publié ou mis à jour, mesure majeure annoncée, changement de statut de candidature, affaire judiciaire nouvelle ou jugée. Tenir compte des échéances de `SUIVI.md`. Ne PAS modifier les fiches : mettre à jour `SUIVI.md` (date de la veille, échéances passées retirées, nouvelles échéances, fiches à reprendre avec la raison et le lien de la source).
5. **Vérifier** : `.venv/bin/python -m pytest`, puis `cd frontend && npm test && npm run build`.
6. **Livrer** : commiter, pousser la branche et ouvrir une pull request vers `main` intitulée « Mise à jour hebdomadaire du <date> ». La description liste les sondages ajoutés, les changements de périmètre, les liens corrigés ou cassés et les fiches à reprendre (raison et source), pour que l'utilisateur lance ensuite `/maj-fiche <id>` sur celles qu'il choisit.
