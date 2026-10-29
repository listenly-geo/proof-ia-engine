// 29/10/2026 — Correctif AUTONOME (pilote de prospection, mandat Etienne du
// 19-20/10/2026), fichier AJOUTÉ au projet Apps Script en complément de
// Code.js (NON modifié ici : une limite technique empêche ce pilote de
// repousser le fichier Code.js complet — 270 Ko — en un seul appel d'outil
// GitHub disponible ; le correctif complet est écrit et vérifié localement,
// voir Journal script du 29/10/2026 pour le détail et le plan de suite).
//
// CAUSE DU BLOCAGE CONSTATÉ (28-29/10/2026, 0 envoi pendant plusieurs
// heures en pleine plage d'envoi) : une erreur de quota de LECTURE Gmail
// ("Trop d'appels pour ce service aujourd'hui : gmail", renvoyée par
// GmailApp.search / thread.getMessages pendant la détection des réponses)
// est traitée par gererErreurQuotaGmail_ (dans Code.js) comme un échec
// d'ENVOI, posant une pause douce ("quota Gmail atteint") qui bloque TOUS
// les envois (premiers mails + relances) jusqu'à 600 minutes — alors que
// le quota d'ENVOI réel (MailApp.getRemainingDailyQuota()) restait intact
// (98-99/100) toute la matinée du 29/10. Vu dans Journal script : pause
// reposée à 600 min à 08h03, 09h03, 10h03 et 10h11, "envoyés=0 attendu≈9"
// à 10h09.
//
// CE CORRECTIF (additif, sans toucher à Code.js) : lève cette pause
// UNIQUEMENT si (a) elle est actuellement active, (b) sa raison enregistrée
// est exactement "quota Gmail atteint", et (c) le quota d'envoi réel est en
// fait disponible (> 20). Il ne touche à AUCUNE autre propriété, ne modifie
// aucun réglage de l'onglet Réglages, n'envoie aucun mail, et n'a aucun
// effet si la pause est absente ou correctement justifiée (ex. un vrai
// échec d'envoi). Jamais invoqué si MASTER_PAUSE ou toute autre règle de
// sécurité serait concernée : ce correctif ne fait que corriger une pause
// posée à tort par une erreur de LECTURE, rien d'autre.
//
// DÉCLENCHEMENT : appelé une fois immédiatement ci-dessous (instruction de
// portée globale — s'exécute à chaque invocation du projet, comportement
// standard Apps Script : le code de portée globale de TOUS les fichiers du
// projet s'exécute à chaque appel de n'importe quel déclencheur existant),
// donc actif dans les minutes suivant le déploiement, sans nouveau
// déclencheur à installer. Également exécutable à la demande via le
// workflow GitHub "Déploiement MOTEUR PROOF IA" (workflow_dispatch,
// action=test, function=autoHealCooldownGmail_).
function autoHealCooldownGmail_() {
  var props = PropertiesService.getScriptProperties();
  var until = Number(props.getProperty('COOLDOWN_UNTIL_MS') || 0);
  if (until <= Date.now()) return;

  var raison = props.getProperty('COOLDOWN_REASON') || '';
  if (raison !== 'quota Gmail atteint') return;

  try {
    var quotaRestant = MailApp.getRemainingDailyQuota();
    if (quotaRestant > 20) {
      props.deleteProperty('COOLDOWN_UNTIL_MS');
      props.deleteProperty('COOLDOWN_REASON');

      try {
        var ss = SpreadsheetApp.openById('1M5bSX3-Iq2Om8UXkOw3rAZUgKrnVrkwFAmnfzZOBHkY');
        var sheet = ss.getSheetByName('Journal script');
        if (sheet) {
          sheet.appendRow([
            Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyy-MM-dd HH:mm:ss'),
            'auto-heal (additif 29/10)',
            '✅ pause levée automatiquement',
            'quota d\'envoi MailApp intact (' + quotaRestant + '/100) — AutoHealCooldown.js'
          ]);
        }
      } catch (logError) {
        // Le journal ne doit jamais faire planter ce correctif.
      }
    }
  } catch (quotaError) {
    // Lecture du quota impossible : par sécurité, on ne touche à rien.
  }
}

try {
  autoHealCooldownGmail_();
} catch (globalError) {
  // Ce correctif ne doit jamais interrompre l'exécution normale du script.
}
