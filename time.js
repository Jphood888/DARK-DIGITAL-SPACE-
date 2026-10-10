// Tells the page the REAL time (from Vercel's server, not the phone).
// The site uses this for the launch countdown and to spot phones with a wrong date/time.
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ now: Date.now() });
};
