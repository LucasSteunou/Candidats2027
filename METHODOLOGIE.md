# Méthodologie

Cette application présente les candidatures à l'élection présidentielle des 18 avril et 2 mai 2027. Elle sert à comparer les candidats sur une base identique et vérifiable. Elle ne recommande aucun vote et ne note aucun programme.

## Qui a une fiche

Une candidature a sa fiche si deux conditions sont réunies :

1. la personne a formellement déclaré sa candidature, ou a été désignée par son parti (une simple intention, du type « je serai candidat le moment venu », ne suffit pas) ;
2. elle a été testée dans au moins un sondage de premier tour réalisé dans les 60 derniers jours, dont la notice est publiée par la [Commission des sondages](https://www.commission-des-sondages.fr/).

Les personnes testées par les sondeurs mais non candidates (pas formellement déclarées, ou battues à une primaire) n'ont pas de fiche. Elles sont listées avec la raison et la source dans `content/perimetre.json`.

Le périmètre est revu chaque semaine. Quand le Conseil constitutionnel publiera la liste officielle (mars 2027), elle remplacera ce critère.

## Une grille identique pour tous

Chaque fiche a les mêmes rubriques : **Programme, Popularité, Histoire, Perception, Controverses, Sources**.

Le programme suit pour tous la même liste de thèmes et de questions clés (`content/themes.json`). Quand un candidat ne s'est pas exprimé sur un point, la fiche l'indique : « Non communiqué à ce jour », avec la date de vérification. Un point n'est jamais omis.

## Règles de rédaction

- **Tout est sourcé.** Chaque texte, mesure, chiffre et point de graphique renvoie à au moins une source consultable. Wikipédia sert à trouver des pistes, jamais de source citée.
- **L'origine de chaque mesure est affichée** : programme 2027 publié, projet du parti (document programmatique du parti, distinct du programme du candidat), déclaration (interview, meeting, communiqué) ou ancien programme (2022, législatives 2024), avec sa date. Avant 2027, beaucoup de programmes ne sont pas publiés, et ce badge évite de présenter une ancienne proposition comme actuelle.
- **Les chiffrages sont attribués.** Le coût annoncé par le candidat est affiché à côté des estimations d'organismes extérieurs (Institut Montaigne, IPP, OFCE, iFRAP, Terra Nova, Fondapol…), chacune avec son auteur. On cherche des organismes d'orientations différentes.
- **Le vocabulaire est descriptif.** Les adjectifs qui jugent (« irréaliste », « courageux », « dangereux »…) n'apparaissent que dans des citations entre guillemets, attribuées à leur auteur.
- **Le positionnement politique est attribué.** On donne la façon dont le parti se définit lui-même et la nuance attribuée par le ministère de l'Intérieur. L'application ne choisit pas d'étiquette.
- **L'ordre est alphabétique** (nom de famille) partout, y compris dans le comparateur.

## Controverses

Le même seuil s'applique à tous : une affaire est mentionnée si au moins deux médias d'éditeurs différents l'ont rapportée. Pour chaque affaire, la fiche donne :

- les faits ;
- le statut judiciaire exact (aucune poursuite pénale, enquête, mise en examen, renvoi devant un tribunal, condamnation en première instance, appel en cours, condamnation en appel avec pourvoi en cassation en cours, condamnation définitive, relaxe ou non-lieu) ;
- la réponse de la personne concernée, ou « pas de réponse publique trouvée ».

La présomption d'innocence est rappelée tant qu'il n'y a pas de condamnation définitive.

## Sondages

- Les données viennent des notices publiées par la Commission des sondages et des publications des instituts.
- Tous les scénarios testés sont affichés, sans en privilégier un.
- La moyenne est calculée de la même façon pour tous : sur 30 jours glissants, chaque sondage compte une fois, avec pour valeur la moyenne des hypothèses où le candidat est testé. Un sondage qui teste six hypothèses ne pèse donc pas six fois plus qu'un autre.
- Sur la page Sondages, le classement suit la moyenne ; partout ailleurs, l'ordre reste alphabétique.
- Un sondage mesure un rapport de force à un moment donné. Ce n'est pas une prévision. La marge d'erreur va d'environ 1 à 3 points selon la taille de l'échantillon et le score.

## Sources privilégiées

- **Programmes** : sites et documents officiels des candidats et des partis.
- **Résultats électoraux** : ministère de l'Intérieur, data.gouv.fr.
- **Données de référence** : INSEE, Cour des comptes, Conseil d'orientation des retraites, Banque de France, DREES, SSMSI, RTE, Agreste.
- **Chiffrages** : organismes indépendants d'orientations variées.
- **Faits et controverses** : AFP, presse nationale de lignes éditoriales différentes, décisions de justice, cellules de vérification (AFP Factuel, Les Décodeurs, CheckNews…).

## Contrôles automatiques

Un programme de tests vérifie le contenu avant chaque publication. La publication est bloquée si :

- une information n'a pas de source, ou cite une source qui n'existe pas ;
- une fiche ne couvre pas tous les thèmes et toutes les questions clés ;
- une mesure n'indique pas son origine, ou un chiffrage n'indique pas son auteur ;
- un mot du lexique jugeant apparaît hors d'une citation ;
- une controverse a moins de deux sources d'éditeurs différents, pas de statut judiciaire ou pas de réponse.

Un rapport d'équilibre compare aussi les fiches entre elles : longueur de chaque rubrique, nombre de mesures, de sources et de controverses. Il permet de repérer une fiche traitée plus longuement ou plus durement qu'une autre.

## Mises à jour

Le contenu est mis à jour chaque semaine : nouveaux sondages, annonces de programme, changements de candidature. Chaque mise à jour est relue avant publication. Le journal des modifications est consultable dans l'application.

## Limites

- **Rédaction assistée par IA.** Les fiches sont rédigées avec l'aide d'une IA (Claude, d'Anthropic) à partir des sources citées, puis relues par un humain. Des erreurs restent possibles : les sources font foi, et tout signalement est bienvenu.
- **Programmes incomplets.** Avant 2027, la plupart des candidats n'ont pas publié de programme complet.
- **Choix éditoriaux.** Le choix des thèmes et des questions clés est un choix éditorial. Il est public (`content/themes.json`) et identique pour tous.

## Signaler une erreur

Le bouton « Signaler une erreur » de chaque rubrique ouvre un mail pré-rempli. Chaque retour est consigné dans `RETOURS.md`, avec la suite qui lui a été donnée, et ce fichier est versionné avec le reste du projet.
