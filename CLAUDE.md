# MOTEUR PROOF IA — Corentin AI Voice (prospection SaaS)

Ce dépôt est **dédié uniquement** à ce moteur. Ne pas mélanger avec
`listenly-geo/listenlygeo` (MarketForge) ni aucun autre dépôt.

## Ce que fait ce moteur

Script Apps Script lié au Google Sheet "Prospection SaaS Corentin Master"
(ID `1M5bSX3-Iq2Om8UXkOw3rAZUgKrnVrkwFAmnfzZOBHkY`), exécuté sous le compte
Google `partnership.voiceover@corentin-cugnet.fr`. Objectif : 50 e-mails
réels/jour ouvré (8h-19h Paris), relances comprises, sans doublon ni envoi
hors plage.

## Où est le code

- `automation/apps-script/Code.js` — code source complet (nom `Code.js` car
  c'est le nom que `clasp pull` a donné au fichier réel récupéré depuis
  Google ; NE PAS recréer de `Code.gs` séparé, sinon clasp pousserait deux
  fichiers distincts côté Google).
- `automation/apps-script/appsscript.json` — manifeste (scopes, web app).
- `automation/apps-script/.clasp.json` — contient le `scriptId` réel.
- `automation/apps-script/ACTION.txt` — un mot : `dry` / `deploy` / `publish` /
  `bridge`.
- `automation/apps-script/deployment_id.txt` — ID du déploiement web app
  **existant, historique** (celui trouvé le 13/10/2026 via `clasp
  deployments`, avant toute action de cette session). Utilisé uniquement
  par `publish` — ne jamais le confondre avec `bridge_deployment_id.txt`.
- `automation/apps-script/bridge_deployment_id.txt` — ID du déploiement web
  app **dédié au pont watchdog** (créé par l'action `bridge`, séparé du
  déploiement existant pour ne jamais risquer de casser autre chose).
  Vide tant que `bridge` n'a pas encore tourné une première fois.

## Comment déployer (toi, Claude, à partir de maintenant)

1. Modifier `automation/apps-script/Code.js` (ou `appsscript.json`) selon
   la demande d'Etienne.
2. Écrire le mot voulu dans `automation/apps-script/ACTION.txt` :
   - `dry` = ne pousse rien, affiche juste l'état actuel du script en ligne
     (`clasp status` + `clasp deployments`). À utiliser par défaut, et
     toujours en premier après toute modification du manifeste.
   - `deploy` = pousse le code + crée une nouvelle version Apps Script. Le
     web app en ligne ne change PAS encore (pas de risque sur ce qui tourne).
   - `publish` = pousse le code + crée une version + branche le web app
     EXISTANT (`deployment_id.txt`) sur cette version (même URL, toujours).
     Risqué si on ne sait pas à quoi sert ce déploiement existant — à éviter
     sauf demande explicite d'Etienne.
   - `bridge` = pousse le code + crée une version + crée (1ère fois) ou met à
     jour (`bridge_deployment_id.txt`) un déploiement web app **séparé,
     dédié au pont watchdog** — ne touche jamais au déploiement existant.
     C'est l'action à utiliser pour activer/mettre à jour le pont
     doGet/doPost du watchdog.
3. Committer et pousser sur `main`. Le workflow
   `.github/workflows/deploy.yml` se déclenche automatiquement.
4. Lire le résultat dans l'onglet GitHub "Actions" du dépôt (`gh run list`,
   `gh run view <id> --log`) et rapporter le résultat à Etienne en une
   phrase : lecture OK / version créée / publié / erreur (avec le message
   d'erreur exact).

Ne JAMAIS redemander à Etienne de coller le code ou de redéployer à la
main — tout passe par ce dépôt.

## RÈGLE DE SÉCURITÉ IMPORTANTE — avant le tout premier vrai déploiement

**FAIT le 13/10/2026** : l'action `pull` a tourné avec succès (run GitHub
Actions, `clasp pull` authentifié sous `partnership.voiceover@corentin-cugnet.fr`),
a rapatrié le VRAI `appsscript.json` (pas de bloc `webapp`, pas de
`oauthScopes` explicites — différent du manifeste deviné au départ) et le
VRAI code en ligne (`Code.js`, confirmé par diff identique au `CODE_VERSION`
qu'on avait déjà, hors nos ajouts watchdog). Les deux ont été fusionnés en
un seul fichier `Code.js` propre (plus de doublon `Code.gs`/`Code.js`).

**Donc à partir de maintenant** : les futurs `deploy`/`publish` sont sûrs
pour le CODE. Reste un point à trancher avant d'activer le pont web
(doGet/doPost) : `appsscript.json` réel n'a pas de bloc `webapp`, donc il
faudra l'ajouter explicitement (et seulement ça, sans toucher aux scopes)
avant le premier `publish`, et s'attendre à ce que Google demande une
ré-autorisation la première fois qu'un bloc `webapp` est ajouté — à faire
consciemment, pas par surprise.

## Règles de sécurité à ne jamais casser

- `isPresentBanned_` : interdiction absolue de contacter un SaaS qui a déjà
  la voix de Corentin (3 signaux : champ Corentin, Statut prospection,
  onglet "Partenaires actifs").
- `assertSenderAlias_` : vérifie l'alias Gmail avant tout envoi.
- `MASTER_PAUSE` (onglet Réglages) : si TRUE, aucun envoi, quoi qu'il arrive.
- Les déclencheurs doivent tous appartenir au MÊME compte Google
  (`partnership.voiceover@corentin-cugnet.fr`) — ne jamais recréer un
  déclencheur depuis un autre compte.

## Watchdog (déjà dans Code.js depuis le 13/10/2026)

- `activerControleTotal()` (menu Prospection) : installe tous les
  déclencheurs (moteur SaaS, Opportunités, réponse IA, watchdog horaire) et
  génère le secret du pont web (affiché une seule fois dans l'alerte — à
  copier dans le secret GitHub `WEBAPP_SECRET` si on veut l'utiliser).
- `watchdogRun` (toutes les heures) : vérifie que tous les déclencheurs
  existent (les recrée sinon), vérifie que le rythme d'envoi du jour est
  cohérent avec l'heure et la limite, relance un passage si retard. Tout
  est journalisé dans l'onglet masqué "Journal script".
- `doGet`/`doPost` : pont web protégé par le secret `WEBAPP_SECRET`
  (`?secret=...`). `GET ?action=status` renvoie l'état du jour + les 20
  dernières lignes du journal. `POST ?action=processQueue` force un
  passage d'envoi. `POST ?action=watchdog` force une vérification.

## À construire ensuite (demandé par Etienne, pas encore fait)

- Filet de secours GitHub Actions planifié toutes les heures, qui appelle
  le pont web (`doGet ?action=status`) et relance (`doPost
  ?action=processQueue`) si le déclencheur Apps Script est tombé — même
  règles de sécurité, respecte `MASTER_PAUSE`.
- Rapport du soir automatique : envoyés/objectif, relances, réponses,
  anomalies corrigées par le watchdog.

## Compte Google

Propriétaire du script et des déclencheurs : `partnership.voiceover@corentin-cugnet.fr`
(Workspace `corentin-cugnet.fr`). Le secret `.clasprc.json` (connexion
clasp pour ce compte) est stocké dans le secret GitHub `CLASPRC_JSON` de
CE dépôt uniquement — jamais réutilisé ailleurs, jamais redemandé à
Etienne une fois en place.
