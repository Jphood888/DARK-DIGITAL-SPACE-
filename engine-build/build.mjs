// Builds the DDS Codelab engine pack into ../engine/v1/
// Run by GitHub Actions (see .github/workflows/build-engine.yml). `--stub` makes fake data for testing.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const STUB = process.argv.includes('--stub');
const OUT = path.resolve(process.argv.find(a => a.startsWith('--out='))?.slice(6) || '../engine/v1');
const CHUNK = 256 * 1024;
const require = createRequire(import.meta.url);

async function build() {
  const parts = [];
  let cm, react, reactDom, babel;
  if (STUB) {
    cm = Buffer.from('window.CM=window.CM||{};window.__stubCM=1;' + '/*' + crypto.randomBytes(300000).toString('hex') + '*/');
    react = Buffer.from('window.React={stub:1};/*' + crypto.randomBytes(10000).toString('hex') + '*/');
    reactDom = Buffer.from('window.ReactDOM={stub:1};/*' + crypto.randomBytes(60000).toString('hex') + '*/');
    babel = Buffer.from('window.Babel={stub:1};/*' + crypto.randomBytes(500000).toString('hex') + '*/');
  } else {
    const esbuild = await import('esbuild');
    const r = await esbuild.build({ entryPoints: ['entry.js'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2019' });
    cm = Buffer.from(r.outputFiles[0].contents);
    react = fs.readFileSync(require.resolve('react/umd/react.production.min.js'));
    reactDom = fs.readFileSync(require.resolve('react-dom/umd/react-dom.production.min.js'));
    babel = fs.readFileSync(require.resolve('@babel/standalone/babel.min.js'));
  }
  // step 1 = editor core, step 2 = preview tools (each is one logical item, loaded in this order)
  parts.push({ id: 'core', step: 1, items: [{ id: 'cm', data: cm }] });
  parts.push({ id: 'tools', step: 2, items: [{ id: 'react', data: react }, { id: 'reactdom', data: reactDom }, { id: 'babel', data: babel }] });

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = { version: 1, chunk: CHUNK, total: 0, parts: [] };
  for (const p of parts) {
    const mp = { id: p.id, step: p.step, items: [] };
    for (const it of p.items) {
      const files = [];
      for (let i = 0, n = 0; i < it.data.length; i += CHUNK, n++) {
        const buf = it.data.subarray(i, i + CHUNK);
        const name = `${it.id}.${String(n).padStart(3, '0')}.bin`;
        fs.writeFileSync(path.join(OUT, name), buf);
        files.push({ f: name, s: buf.length, h: crypto.createHash('sha256').update(buf).digest('hex') });
      }
      const whole = crypto.createHash('sha256').update(it.data).digest('hex');
      mp.items.push({ id: it.id, size: it.data.length, sha256: whole, chunks: files });
      manifest.total += it.data.length;
    }
    manifest.parts.push(mp);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest));
  console.log('Engine built:', manifest.total, 'bytes ->', OUT);
}
build();
