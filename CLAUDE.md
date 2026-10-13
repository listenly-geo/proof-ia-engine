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

- `automation/apps-script/Code.gs` — code source complet.
- `automation/apps-script/appsscript.json` — manifeste (scopes, web app).
- `automation/apps-script/.clasp.json` — contient le `scriptId` réel.
- `automation/apps-script/ACTION.txt` — un mot : `dry` / `deploy` / `publish`.
- `automation/apps-script/deployment_id.txt` — ID du déploiement web app
  existant (nécessaire uniquement pour `publish`).

## Comment déployer (toi, Claude, à partir de maintenant)

1. Modifier `automation/apps-script/Code.gs` (ou `appsscript.json`) selon
   la demande d'Etienne.
2. Écrire le mot voulu dans `automation/apps-script/ACTION.txt` :
   - `dry` = ne pousse rien, affiche juste l'état actuel du script en ligne
     (`clasp status` + `clasp deployments`). À utiliser par défaut, et
     toujours en premier après toute modification du manifeste.
   - `deploy` = pousse le code + crée une nouvelle version Apps Script. Le
     web app en ligne ne change PAS encore (pas de risque sur ce qui tourne).
   - `publish` = pousse le code + crée une version + branche le web app sur
     cette version (même URL, toujours — nécessite `deployment_id.txt`).
3. Committer et pousser sur `main`. Le workflow
   `.github/workflows/deploy.yml` se déclenche automatiquement.
4. Lire le résultat dans l'onglet GitHub "Actions" du dépôt (`gh run list`,
   `gh run view <id> --log`) et rapporter le résultat à Etienne en une
   phrase : lecture OK / version créée / publié / erreur (avec le message
   d'erreur exact).

Ne JAMAIS redemander à Etienne de coller le code ou de redéployer à la
main — tout passe par ce dépôt.

## RÈGLE DE SÉCURITÉ IMPORTANTE — avant le tout premier vrai déploiement

`automation/apps-script/appsscript.json` dans ce dépôt a été écrit par
Claude par déduction (scopes probables), PAS récupéré du script réel.
Si on pousse ce fichier tel quel et qu'il diffère du manifeste réellement
en ligne, Google peut exiger une **ré-autorisation complète** du script —
ce qui recrée exactement le bug "mauvais compte propriétaire des
déclencheurs" déjà rencontré le 13/10/2026.

**Donc, avant la toute première action `deploy` ou `publish` :**
1. Etienne (ou Claude via le poste relié) doit faire un `clasp pull` (ou
   `clasp clone <scriptId>`) authentifié avec
   `partnership.voiceover@corentin-cugnet.fr`, pour récupérer le VRAI
   `appsscript.json` et le VRAI code actuellement en ligne.
2. Remplacer les fichiers de ce dépôt par ce résultat réel (pas l'inverse).
3. Seulement après ça, les futurs `deploy`/`publish` automatiques sont sûrs.

Tant que cette étape n'a pas été faite, n'utiliser que `dry`.

## Règles de sécurité à ne jamais casser

- `isPresentBanned_` : interdiction absolue de contacter un SaaS qui a déjà
  la voix de Corentin (3 signaux : champ Corentin, Statut prospection,
  onglet "Partenaires actifs").
- `assertSenderAlias_` : vérifie l'alias Gmail avant tout envoi.
- `MASTER_PAUSE` (onglet Réglages) : si TRUE, aucun envoi, quoi qu'il arrive.
- Les déclencheurs doivent tous appartenir au MÊME compte Google
  (`partnership.voiceover@corentin-cugnet.fr`) — ne jamais recréer un
  déclencheur depuis un autre compte.

## Watchdog (déjà dans Code.gs depuis le 13/10/2026)

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
