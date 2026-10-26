---
description: Ajouter les nouveaux sondages de premier tour publiés par la Commission des sondages
---

Ajoute à `content/sondages.json` les sondages d'intentions de vote au premier tour publiés depuis le dernier terrain enregistré.

1. **Lire** `content/sondages.json` (champ `note`, dictionnaire `noms`, format d'un sondage existant) et `check_sondages` dans `tools/content.py`.
2. **Trouver les nouvelles notices** : https://www.commission-des-sondages.fr/notices/, dossier de l'année en cours, puis les mois récents. Les notices de la présidentielle sont les PDF nommés `<numéro>-pres-<institut>-<date>.pdf`. Ne retenir que les sondages de premier tour dont le terrain se termine après le dernier sondage déjà saisi.
3. **Recopier chaque sondage** depuis le PDF de la notice :
   - `id` : `<institut>-<date de fin de terrain>` ; `institut`, `commanditaires`, `terrain` [début, fin], `echantillon` tel que publié ;
   - toutes les hypothèses testées, sans en privilégier une, avec les scores en % des suffrages exprimés tels que publiés (YouGov : colonne « pondérés ») ;
   - source `cds-<numéro>-<institut>` : titre « Notice n° <numéro> - <Institut> pour <commanditaires> (terrain du … au …) », éditeur « Commission des sondages », date de publication, URL du PDF, type `sondage` ;
   - ajouter à `noms` toute personne testée qui n'y figure pas encore ;
   - un score publié « <1 % » se saisit `"<1"` (texte), jamais 0 ni 0,5 : l'application l'affiche tel quel et le compte pour 0,5 dans les moyennes ; quand une notice a plusieurs colonnes (brut, redressé…), recopier les scores de la ligne « publié » ou de la colonne redressée finale, et ne passer à `"<1"` que si c'est ce qui y figure.
4. **Mettre à jour `maj`**, puis lancer `.venv/bin/python -m pytest`. Le total de chaque hypothèse doit faire 100 ± 3 : un écart signale une erreur de recopie à corriger, jamais à arrondir.
5. **Ne pas toucher aux fiches.** Signaler à la fin : une personne déclarée candidate et testée mais sans fiche, ou un candidat à fiche qui n'a été testé dans aucun sondage depuis 60 jours (règle du périmètre).
