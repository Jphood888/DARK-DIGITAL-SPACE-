/* DDS push sender (Vercel serverless function, no packages needed).
   Apps Script calls this with a shared secret; it encrypts and delivers Web Push messages.
   Environment variables to set in Vercel:  PUSH_SECRET, VAPID_PUBLIC, VAPID_PRIVATE  (and optionally VAPID_SUBJECT) */
const crypto = require('crypto');
const b64u = (b) => Buffer.from(b).toString('base64url');
const unb64u = (s) => Buffer.from(String(s), 'base64url');
const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
const hkdf = (salt, ikm, info, len) => { const prk = hmac(salt, ikm); return hmac(prk, Buffer.concat([info, Buffer.from([1])])).subarray(0, len); };

function vapidJwt(audience, pubB64, privB64, subject) {
  const pub = unb64u(pubB64), key = crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)), d: privB64 }, format: 'jwk' });
  const head = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' })), body = b64u(JSON.stringify({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject }));
  const sig = crypto.sign('sha256', Buffer.from(head + '.' + body), { key, dsaEncoding: 'ieee-p1363' });
  return head + '.' + body + '.' + b64u(sig);
}
/* RFC 8291 (aes128gcm) */
function encrypt(sub, payload, eph) {
  const ua = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const ecdh = eph || crypto.createECDH('prime256v1'); if (!eph) ecdh.generateKeys();
  const asPub = ecdh.getPublicKey(), secret = ecdh.computeSecret(ua);
  const ikm = hkdf(auth, secret, Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub]), 32);
  const salt = crypto.randomBytes(16);
  const cek = hkdf(salt, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(salt, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const ct = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}
async function sendOne(sub, payload, env) {
  const u = new URL(sub.endpoint);
  const jwt = vapidJwt(u.origin, env.VAPID_PUBLIC, env.VAPID_PRIVATE, env.VAPID_SUBJECT || 'mailto:support@darkdigitalspace.com.ng');
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { Authorization: 'vapid t=' + jwt + ', k=' + env.VAPID_PUBLIC, 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high' }, body: encrypt(sub, payload) });
  return r.status;
}
async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const env = process.env, b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (!env.PUSH_SECRET || b.secret !== env.PUSH_SECRET) return res.status(401).json({ ok: false });
  if (!env.VAPID_PUBLIC || !env.VAPID_PRIVATE) return res.status(500).json({ ok: false, error: 'keys missing' });
  const subs = (Array.isArray(b.subs) ? b.subs : []).filter(s => s && /^https:\/\//.test(s.endpoint || '') && s.keys && s.keys.p256dh && s.keys.auth).slice(0, 20);
  const payload = JSON.stringify({ title: String(b.title || 'Dark Digital Space').slice(0, 80), body: String(b.body || '').slice(0, 180), url: String(b.url || '/'), tag: String(b.tag || '') });
  let sent = 0; const gone = [];
  await Promise.all(subs.map(async (s) => { try { const st = await sendOne(s, payload, env); if (st >= 200 && st < 300) sent++; else if (st === 404 || st === 410) gone.push(s.endpoint); } catch (e) {} }));
  return res.status(200).json({ ok: true, sent, gone });
}
module.exports = handler; module.exports._t = { encrypt, vapidJwt, hkdf };
