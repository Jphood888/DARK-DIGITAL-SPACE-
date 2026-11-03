// DDS CodeLab links on the real DDS domain:
//   https://darkdigitalspace.com.ng/codelab/preview/<project>/<deploymentId>   (48-hour view-only test link)
//   https://darkdigitalspace.com.ng/codelab/p/<project>/<projectId>            (a published project)
const CODELAB = process.env.CODELAB_URL || 'https://script.google.com/macros/s/AKfycbxZimQ346-UlaHp6DHVB_cGtFvT5Cm44VujBTk3t5HPAV-zMMHRuOL-7WaN_hrb53Vd/exec';

const page = (title, msg) => '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title +
  '</title><body style="margin:0;font-family:system-ui,sans-serif;background:#05070a;color:#cfd8e6;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px"><div><h2 style="color:#2f8fff;margin:0 0 8px">' + title + '</h2><p style="margin:0">' + msg + '</p><p style="margin-top:18px"><a style="color:#6db1ff" href="https://darkdigitalspace.com.ng/">darkdigitalspace.com.ng</a></p></div>';

const PROTECT = 'This project\'s code is protected by the terms and conditions of the DDS community. Published projects can be run, but their code cannot be shown.';

// Tools that only download a page (curl, scripts, scrapers, "view source" fetchers) never get the code.
// Real browsers and the DDS app always say they are opening a page (document) or a frame (iframe).
const isTool = (req) => {
  const dest = String(req.headers['sec-fetch-dest'] || '').toLowerCase();
  const ua = String(req.headers['user-agent'] || '');
  if (dest) return !(dest === 'document' || dest === 'iframe');
  return !/Mozilla\//i.test(ua) || /curl|wget|python|node-fetch|axios|go-http|java|okhttp|httpie|scrapy|bot|spider|crawler|headless|google-apps-script|urlfetch/i.test(ua);
};

module.exports = async (req, res) => {
  const kind = String(req.query.k || '');
  const id = String(req.query.id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80);
  const action = kind === 'preview' ? 'previewRaw' : kind === 'p' ? 'siteRaw' : '';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // The page is made by a member. "sandbox" gives it its own empty origin so it can never read darkdigitalspace.com.ng data.
  res.setHeader('Content-Security-Policy', 'sandbox allow-scripts allow-forms allow-popups allow-modals allow-pointer-lock');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Vary', 'Sec-Fetch-Dest, User-Agent');
  if (isTool(req)) { res.statusCode = 200; res.setHeader('Cache-Control', 'no-store'); return res.end(page('Protected project', PROTECT)); }
  if (!action || !id) { res.statusCode = 404; return res.end(page('Not found', 'This link is not valid.')); }
  try {
    const q = action === 'previewRaw' ? 't=' : 'id=';
    const r = await fetch(CODELAB + '?action=' + action + '&' + q + encodeURIComponent(id), { redirect: 'follow' });
    const d = await r.json();
    if (!d.success) { res.statusCode = 404; res.setHeader('Cache-Control', 'no-store'); return res.end(page('Link unavailable', d.message || 'Not found')); }
    res.setHeader('Cache-Control', kind === 'preview' ? 'no-store' : 's-maxage=60, stale-while-revalidate=300');
    res.statusCode = 200;
    res.end(d.html);
  } catch (e) {
    res.statusCode = 502; res.setHeader('Cache-Control', 'no-store');
    res.end(page('Please try again', 'The project could not be loaded right now.'));
  }
};
