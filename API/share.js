// Serves your normal site for shared drop links, but with the right preview card
// (title + image) in the page <head> so WhatsApp / Facebook / X / Telegram can show it.
//
// IMPORTANT: this does NOT look the drop up. Link previews are fetched by robots, and
// opening a drop counts a view — so previews are generic and never reveal what's inside.

const SITE = 'https://darkdigitalspace.com.ng';

const esc = (v) => String(v || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  const { who = 'anon', id = '', token = '' } = req.query || {};
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'darkdigitalspace.com.ng';

  let html = '';
  try {
    const r = await fetch('https://' + host + '/');   // your normal index.html
    html = await r.text();
  } catch (e) { /* fall through */ }

  if (!html) { res.statusCode = 302; res.setHeader('Location', '/'); return res.end(); }

  const url = SITE + '/' + encodeURIComponent(who) + '/postID/' + encodeURIComponent(id) + (token ? '/' + encodeURIComponent(token) : '');
  const title = 'Dead Drop \u2014 someone dropped something for you \u{1F440}';
  const desc = "An anonymous Dead Drop on Dark Digital Space. It self-destructs after enough views or 24 hours \u2014 open it before it's gone.";
  const img = SITE + '/og-dead-drop.png';

  const og = `<!--OG_START-->
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex,nofollow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Dark Digital Space">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${img}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#05070a">
<!--OG_END-->`;

  html = html.replace(/<!--OG_START-->[\s\S]*?<!--OG_END-->/, og);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(200).send(html);
};
