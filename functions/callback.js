const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const page = (title, body, status) =>
  new Response(
    '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
      esc(title) +
      '</title><style>body{margin:0;background:#090d1b;color:#f4f6ff;font:17px/1.7 system-ui,sans-serif}main{max-width:600px;margin:auto;padding:45px 22px}.card{padding:28px;border:1px solid #2b3554;border-radius:24px;background:#151c33}img{width:96px;height:96px;border-radius:50%}a{color:#35e3df}p{color:#aab4cf}</style></head><body><main>' +
      body +
      '</main></body></html>',
    {
      status: status || 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Set-Cookie': 'tg_state=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
        'Cache-Control': 'no-store',
      },
    }
  );

const back = '<p><a href="/">Retour à TikGrowth</a></p>';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const cookie = request.headers.get('Cookie') || '';
    const saved = (cookie.match(/(?:^|; )tg_state=([^;]+)/) || [])[1];

    if (error) {
      return page('Connexion annulée', '<div class="card"><h1>Connexion annulée</h1><p>Aucune donnée n’a été partagée.</p>' + back + '</div>');
    }
    if (!code || !state || !saved || state !== saved) {
      return page('Erreur', '<div class="card"><h1>Connexion impossible</h1><p>La vérification de sécurité a échoué. Veuillez réessayer.</p>' + back + '</div>', 400);
    }
    if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET) {
      return page('Configuration', '<div class="card"><h1>Configuration manquante</h1><p>Les variables du serveur ne sont pas encore définies.</p>' + back + '</div>', 500);
    }

    const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
      body: new URLSearchParams({
        client_key: env.TIKTOK_CLIENT_KEY,
        client_secret: env.TIKTOK_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: url.origin + '/callback/',
      }),
    });
    const token = await tokenRes.json();
    if (!token.access_token) {
      return page('Erreur', '<div class="card"><h1>Connexion refusée</h1><p>TikTok n’a pas validé la connexion. Veuillez réessayer.</p>' + back + '</div>', 502);
    }

    const infoRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,avatar_url,display_name', {
      headers: { Authorization: 'Bearer ' + token.access_token },
    });
    const info = await infoRes.json();
    const user = (info && info.data && info.data.user) || {};
    const avatar = typeof user.avatar_url === 'string' && user.avatar_url.indexOf('https://') === 0
      ? '<p><img src="' + esc(user.avatar_url) + '" alt="Avatar"></p>'
      : '';

    return page(
      'Connecté',
      '<div class="card"><h1>Connexion réussie</h1>' + avatar + '<p>Bonjour <strong>' + esc(user.display_name || 'créateur') + '</strong>, votre compte TikTok est connecté à TikGrowth.</p><p>Aucune donnée n’est enregistrée par TikGrowth à ce stade.</p>' + back + '</div>'
    );
  } catch (e) {
    return page('Erreur', '<div class="card"><h1>Erreur inattendue</h1><p>Veuillez réessayer plus tard.</p>' + back + '</div>', 500);
  }
}
