// The ONLY door to the APK. Before launch time it answers "not yet" no matter what the
// phone's clock says, because the time is read here on the server.
//   /api/apk?check=1  -> {ok:true} when the download may start
//   /api/apk          -> sends the person to the APK file
// Owner preview before launch: set APK_PREVIEW_KEY in Vercel, then use  /api/apk?key=THAT_KEY
//
// For the lock to be real, the APK file itself must not be guessable (see the notes):
// give it a secret name and list that name in the APK_FILES setting (comma separated).

const LAUNCH = Date.parse(process.env.LAUNCH_ISO || '2026-11-05T00:00:00+01:00');
const FILES = (process.env.APK_FILES || 'dds-codelab-v6.apk,dds-codelab-v6_112641.apk')
  .split(',').map((s) => s.trim().replace(/^\/+/, '')).filter(Boolean);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = req.query || {};
  const key = process.env.APK_PREVIEW_KEY;
  const preview = !!key && q.key === key;

  if (Date.now() < LAUNCH && !preview) {
    res.status(403).json({ ok: false, live: false });
    return;
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'darkdigitalspace.com.ng';
  for (const name of FILES) {
    try {
      const r = await fetch('https://' + host + '/' + encodeURI(name), { method: 'HEAD' });
      if (r.ok) {
        if (q.check) { res.status(200).json({ ok: true, live: true }); return; }
        res.setHeader('Location', '/' + encodeURI(name));
        res.status(302).end();
        return;
      }
    } catch (e) { /* try the next name */ }
  }
  res.status(404).json({ ok: false, live: true, missing: true });
};
