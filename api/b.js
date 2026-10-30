// DDS backend link:  https://YOUR-DDS-DOMAIN/b/<DEPLOYMENT_ID>/<anything>?<query>
// Forwards the request to the person's own Google Apps Script web app and returns its answer with CORS on,
// so a frontend can call a clean DDS address while testing its backend. Only script.google.com is ever contacted.
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const id = String((req.query && req.query.id) || '');
  if (!/^AKfycb[\w-]{20,220}$/.test(id)) return res.status(400).json({ success: false, message: 'Bad deployment id. Use the id from your Apps Script deployment (it starts with AKfycb).' });
  const target = new URL('https://script.google.com/macros/s/' + id + '/exec');
  const path = req.query && req.query.path ? [].concat(req.query.path).join('/') : '';
  for (const [k, v] of Object.entries(req.query || {})) if (k !== 'id' && k !== 'path') target.searchParams.set(k, [].concat(v)[0]);
  if (path) target.searchParams.set('path', '/' + path);
  if (!['GET', 'POST', 'HEAD'].includes(req.method)) target.searchParams.set('_method', req.method);
  let body;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (body.length > 400000) return res.status(413).json({ success: false, message: 'Request too big (max 400 KB)' });
  }
  try {
    const t0 = Date.now();
    const r = await fetch(target.toString(), { method: body === undefined ? 'GET' : 'POST', headers: body === undefined ? {} : { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow' });
    const text = await r.text();
    res.setHeader('X-DDS-Ms', String(Date.now() - t0));
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json');
    return res.status(r.status).send(text);
  } catch (e) {
    return res.status(502).json({ success: false, message: 'Could not reach that backend: ' + String(e.message || e).slice(0, 120) });
  }
};
