# Suivi des mises à jour

Tenu à jour par la passe hebdomadaire (`/maj-hebdo`) et par chaque mise à jour de fiche (`/maj-fiche`).

Dernière veille : 2026-10-31 (passe lancée à la main : sites de campagne de chacun des 15 candidats, presse nationale, dossier « Présidentielle 2027 » de LCP ; recherches plus poussées sur les candidats les plus hauts dans les sondages). Les fiches philippe, attal, ruffin, lisnard et le-pen ont été reprises le même jour ; les autres datent des 23-26 octobre.

## Échéances connues

- 2026-11-06 et 07 · melenchon · « L'Avenir en commun », édition 2027 : en librairie le 6 novembre, meeting de présentation le 7 au Bourget ([melenchon2027.fr](https://melenchon2027.fr)). Six chapitres au lieu de quatre, selon [LCP](https://lcp.fr/actualites/presidentielle-le-programme-remanie-de-la-nouvelle-france-de-jean-luc-melenchon-sera).
- 2026-11-17 · le-pen · présentation de sa réforme des retraites ; programme 2027 « en cours de finalisation ». Le site du RN ne l'annonce pas à ce jour.
- 2026-11 (2e quinzaine) · tondelier · présentation du texte qui fixe les deux options soumises aux adhérents des Écologistes ([LCP](https://lcp.fr/actualites/candidature-a-la-presidentielle-pas-de-choix-definitif-des-ecologistes-avant-la-mi)).
- 2026-12-10 → 13 · tondelier · vote des adhérents des Écologistes : candidature propre ou ralliement à un autre candidat de gauche.
- 2027-01-31 · toutes · date limite du décret de convocation si le gouvernement choisissait finalement les 11 et 25 avril au lieu des 18 avril et 2 mai. Retailleau et d'autres demandent de changer les dates ; la porte-parole du gouvernement a répondu le 28 octobre qu'il n'y avait « pas de raison de changer ces dates » ([LCP](https://lcp.fr/actualites/presidentielle-2027-pour-le-gouvernement-il-n-y-a-pas-de-raison-de-changer-les-dates-de)). Si les dates changent, mettre à jour `perimetre.json` (`scrutin`), `METHODOLOGIE.md` et le décompte de l'accueil.
- 2027-03 · toutes · liste officielle du Conseil constitutionnel, qui remplacera le critère du périmètre.
- 2027-04 (au plus tard début) · le-pen · arrêt de la Cour de cassation sur son pourvoi, selon le communiqué de la Cour cité par le [Club des juristes](https://www.leclubdesjuristes.com/?p=16873) (8 juillet 2026) ; calendrier susceptible de changer. La fiche indique le pourvoi mais pas ce délai.

## Fiches à reprendre

Reprises le 2026-10-31 : philippe (témoin assisté du 29 octobre), attal (« grande primaire des démocrates »), ruffin (cahier n° 8, éducation), lisnard (interview du 27 octobre), le-pen (non-pourvoi du parquet général, calendrier de la Cour de cassation).

- dupont-aignan · ses publications des 24 au 30 octobre (RIC, baccalauréat égalitaire et Parcoursup, protection de l'enfance, « trois mesures fortes pour la jeunesse », référendum sur la sortie de l'UE le 30 octobre) répètent des positions déjà dans la fiche, ou ne sont pas détaillées, et ne sont que des publications Facebook et Instagram. Rien à modifier ; lancer `/maj-fiche dupont-aignan` quand debout-la-france.fr publiera son programme.
- le-pen · une audience de la Cour de cassation sur des QPC serait fixée au 16 décembre (24matins, source à recouper, année non précisée) ; non reprise dans la fiche.

Rien de nouveau trouvé, depuis la date de la fiche, pour arthaud, bouamrane, glucksmann (aucun nouveau document de programme ; le 26 octobre, sur TF1, il dit vouloir « supprimer » Parcoursup « pour le remplacer »), polony, retailleau, roussel, tondelier et zemmour.

## Fiches à étoffer

Programme absent ou partiel ; le nombre indique les questions clés renseignées sur 55.

- bouamrane · manifeste général seulement (1/55) ; cinq axes « Protéger, loger, soigner, éduquer et redonner de l'espoir » sans mesure chiffrée.
- polony · candidate depuis le 14/10/2026, aucun programme (6/55) ; priorité à la production française dans la commande publique, « état d'urgence de la production ».
- arthaud · Lutte ouvrière ne publie pas de programme de gouvernement (7/55).
- ruffin · cahiers sans sécurité, immigration, santé, Europe, défense ni diplomatie (19/55) ; l'école et la rémunération des enseignants sont renseignées depuis le cahier n° 8.
- dupont-aignan · discours de rentrée et « 20 mesures » seulement (20/55).
- roussel · pas de programme 2027 ; réponses issues de 2022 et des cahiers du PCF (24/55) ; le site de campagne ne donne que cinq thèmes (« Vivre mieux, heureux, ensemble, longtemps, en paix »).
- zemmour · pas de programme 2027 ; réponses issues de 2022 (29/55) ; le site du parti renvoie à une consultation « Le Programme pour la France » et à budget2027.fr.

## Points à vérifier

- roussel · l'enquête du PNF ouverte en 2022 est affichée « en cours » faute d'issue trouvée.
- sondages · 11 sondages transcrits dans `content/sondages.json`. Quatre ajoutés le 31 octobre : Ifop n° 10284 (25-29 septembre, 10 hypothèses dont des scénarios du Parti socialiste aujourd'hui caducs), Harris n° 10305 (5-8 octobre), OpinionWay n° 10319 (13-14 octobre), Cluster17 n° 10339 (19-22 octobre). Non transcrit : Odoxa n° 10310 (24 septembre-7 octobre, 12 005 personnes), dont la notice ne donne pas les résultats, publiés sur odoxa.fr. Les notices de septembre dont le terrain est antérieur au 22 septembre sortent de la fenêtre de 30 jours.
- perimetre · Jérôme Guedj et Emmanuel Maurel (testés par l'Ifop le 25-29 septembre, battus à la primaire du 11 octobre) rejoignent la liste des testés sans fiche. Dominique de Villepin n'a toujours pas déclaré sa candidature : il a reporté sa décision « au cours des prochaines semaines » et dit avoir dépassé 300 parrainages sur 500 ([LCP](https://lcp.fr/actualites/presidentielle-dominique-de-villepin-annonce-avoir-depasse-la-barre-des-300-signatures), 23 octobre).- liens · vérification du 31 octobre : 286 liens sur 288 répondent, y compris calvados.gouv.fr, qui avait refusé la fois précédente. Les deux échecs sont les faux positifs connus (`fr.timesofisrael.com` et `blog.landot-avocats.net` répondent 403 aux scripts mais s'ouvrent dans un navigateur).
