// 29/10/2026 — Correctif AUTONOME (pilote de prospection, mandat Etienne du
// 19-20/10/2026), fichier AJOUTÉ au projet Apps Script en complément de
// Code.js, pour lever automatiquement une pause "quota Gmail atteint" posée
// à tort par une erreur de LECTURE Gmail (detectReplies_, etc.) plutôt que
// par un vrai échec d'envoi.
//
// 02/11/2026 — DÉSACTIVÉ (correctif autonome, même mandat) : cause du
// blocage total des envois constaté ce matin (09h03-10h23, 0 envoi malgré
// plusieurs passages, "premier mail ❌ Wondershare Virbo : Trop d'appels
// pour ce service aujourd'hui : gmail." répété à l'identique, Journal
// script).
//
// CE QUI A CHANGÉ DEPUIS LE 29/10 (et rend ce correctif obsolète puis
// nuisible) : le 30/10 (commit 70540ce), gererErreurQuotaGmail_ dans
// Code.js a été corrigé pour distinguer un vrai échec d'ENVOI d'une simple
// erreur de LECTURE par le SITE D'APPEL (GmailApp.sendEmail / thread.replyAll
// => envoiReel=true) et non plus par le mot dans le message d'erreur. Depuis
// ce correctif, la pause "quota Gmail atteint" (COOLDOWN_REASON) n'est PLUS
// JAMAIS posée par une simple lecture (voir Code.js ~ligne 2522 :
// lectureSeule => return, aucune pause) : elle ne peut plus provenir que
// d'un vrai échec d'envoi. Le correctif ci-dessous, lui, levait CETTE pause
// dès que MailApp.getRemainingDailyQuota() restait > 20 — ce qui est
// TOUJOURS vrai ici, puisque le quota qui bloque réellement (appels Gmail
// par jour, "Service invoked too many times") est distinct du quota
// d'ENVOI (MailApp) : aucun mail n'étant réellement envoyé, MailApp reste
// à 100/100 même quand Gmail refuse tout appel. Résultat observé ce matin
// (Journal script) : la pause posée à 09h04 (120 min) et à 10h03 (600 min)
// a été effacée par ce correctif 5-9 minutes plus tard (09h09, 10h09) à
// chaque fois, avant même de ralentir un seul passage — d'où la boucle
// (échec → pause → auto-heal l'efface → nouvel essai immédiat → échec...)
// et 0 envoi malgré ~10 tentatives entre 09h03 et 10h23.
//
// Autrement dit : la condition qui justifiait ce correctif (une pause
// "quota Gmail atteint" peut encore provenir à tort d'une lecture) n'existe
// plus dans le code actuel. Toute pause "quota Gmail atteint" aujourd'hui
// est donc légitime (vrai échec d'envoi) et doit être respectée jusqu'à son
// terme — c'est exactement la règle (a) du mandat : "Quota Gmail atteint
// aujourd'hui : ne rien monter ; le lendemain, reprendre au niveau des
// envois réussis la veille." Ce fichier est conservé (historique, traçable
// dans git) mais neutralisé : il ne touche plus à aucune propriété.
function autoHealCooldownGmail_() {
  return; // Désactivé le 02/11/2026 — voir commentaire ci-dessus.
}

try {
  autoHealCooldownGmail_();
} catch (globalError) {
  // Ce correctif ne doit jamais interrompre l'exécution normale du script.
}
