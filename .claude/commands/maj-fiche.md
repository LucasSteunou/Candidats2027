---
description: Mettre à jour ou étoffer la fiche d'un candidat
argument-hint: <id du candidat, par ex. le-pen>
---

Mets à jour la fiche `content/candidatures/$ARGUMENTS.json`. Une seule fiche par appel.

1. **Lire** `METHODOLOGIE.md`, `tools/content.py` (schéma et contrôles), `content/themes.json`, la fiche actuelle, la ligne du candidat dans `SUIVI.md` et les signalements le concernant dans `RETOURS.md`.
2. **Chercher ce qui a changé depuis la date `maj` de la fiche** : programme publié ou mis à jour (site du candidat ou du parti d'abord), annonces de campagne, baromètres d'image (Elabe, Odoxa…), changement de statut de candidature, affaires judiciaires. Préférer les documents primaires ; télécharger un document une fois plutôt que multiplier les requêtes ; espacer les requêtes vers les sites de partis, qui bloquent les robots.
3. **Modifier la fiche** :
   - une position plus récente remplace l'ancienne, avec son origine exacte (`programme-2027`, `projet-parti`, `declaration`, `ancien-programme`) et sa date ;
   - sans information nouvelle, une réponse reste « Non communiqué », avec la date du jour ; ne jamais combler un trou par déduction ;
   - chaque affirmation cite une source du registre ; jamais Wikipédia ; une citation entre guillemets figure mot pour mot dans la source ;
   - aucun mot de la liste `LEXIQUE` (`tools/content.py`) hors du champ `citation`, y compris dans `precision` ;
   - une controverse n'entre que si deux médias d'éditeurs différents l'ont rapportée ; donner le statut judiciaire exact et la réponse de la personne ;
   - mettre à jour `maj` et les dates `consulte` ; retirer du registre les sources qui ne sont plus citées.
4. **Vérifier** : `.venv/bin/python -m pytest`, `.venv/bin/python -m tools.check_links content/candidatures/$ARGUMENTS.json`, puis `cd frontend && npm test`.
5. **Tenir le suivi** : mettre à jour la ligne du candidat dans `SUIVI.md` (le retirer de « Fiches à étoffer » si la fiche est complète) et passer à `corrigé` ou `maintenu` les signalements traités dans `RETOURS.md`.
6. **Rendre compte** : ce qui a changé, ce qui reste « Non communiqué », les points incertains. Ne commiter et pousser que si l'utilisateur le demande.
