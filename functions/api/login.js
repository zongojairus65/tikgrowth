export async function onRequestGet({ request, env }) {
  if (!env.TIKTOK_CLIENT_KEY) {
    return new Response('Configuration manquante : TIKTOK_CLIENT_KEY', { status: 500 });
  }
  const origin = new URL(request.url).origin;
  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_key: env.TIKTOK_CLIENT_KEY,
    scope: 'user.info.basic',
    response_type: 'code',
    redirect_uri: origin + '/callback/',
    state: state,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: 'https://www.tiktok.com/v2/auth/authorize/?' + params.toString(),
      'Set-Cookie': 'tg_state=' + state + '; Path=/; Max-Age=600; HttpOnly; Secure; SameSite=Lax',
      'Cache-Control': 'no-store',
    },
  });
}
