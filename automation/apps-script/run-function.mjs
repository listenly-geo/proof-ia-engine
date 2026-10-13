// Appelle une fonction du script Apps Script via l'API officielle
// (Apps Script API, scripts.run), authentifié avec les identifiants
// clasp déjà stockés (secret GitHub CLASPRC_JSON). Ne passe jamais par
// un web app public — donc pas concerné par la restriction Workspace
// "Only users in the same domain... may deploy this script."
//
// Usage: node run-function.mjs <nomDeLaFonction>

import fs from 'node:fs';

const fn = process.argv[2];
if (!fn) {
  console.error('Usage: node run-function.mjs <nomDeLaFonction>');
  process.exit(1);
}

const home = process.env.HOME;
const clasprc = JSON.parse(fs.readFileSync(`${home}/.clasprc.json`, 'utf8'));
const scriptId = fs.readFileSync('script_id.txt', 'utf8').trim();

// clasp a changé de format de fichier de creds selon les versions ; on
// essaie les emplacements connus sans jamais logguer les valeurs.
const tok = clasprc.tokens?.default || clasprc.token || clasprc;
const clientId = clasprc.oauth2ClientSettings?.clientId || tok.client_id;
const clientSecret = clasprc.oauth2ClientSettings?.clientSecret || tok.client_secret;
const refreshToken = tok.refresh_token;

if (!refreshToken || !clientId || !clientSecret) {
  console.error('Structure de .clasprc.json inattendue — clés présentes (pas les valeurs) :');
  console.error('top-level:', Object.keys(clasprc));
  console.error('tok:', Object.keys(tok || {}));
  process.exit(1);
}

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }),
});
const tokenJson = await tokenRes.json();

if (!tokenJson.access_token) {
  console.error('Échec du rafraîchissement du token OAuth :', tokenJson.error, tokenJson.error_description || '');
  process.exit(1);
}

const runRes = await fetch(`https://script.googleapis.com/v1/scripts/${scriptId}:run`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${tokenJson.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ function: fn, devMode: true }),
});
const runJson = await runRes.json();

console.log(JSON.stringify(runJson, null, 2));

if (runJson.error) {
  process.exit(1);
}
