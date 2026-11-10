// Builds two self-contained HTML files from the production build in /dist:
//  - standalone/AoraMedical_Landing.html : one file, opens offline-ready in any browser
//  - standalone/preview-fragment.html             : same page without the <html>/<head>/<body> wrapper,
//                                                  used for hosted previews that supply their own skeleton
// Run after `npm run build`:  npm run standalone
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('Run `npm run build` first.');

let html = readFileSync(join(dist, 'index.html'), 'utf8');

const mime = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', mp4: 'video/mp4' };
const dataUri = (rel) => {
  const ext = rel.split('.').pop();
  const buf = readFileSync(join(dist, rel));
  return ext === 'svg'
    ? `data:${mime.svg};base64,${buf.toString('base64')}`
    : `data:${mime[ext]};base64,${buf.toString('base64')}`;
};

// Inline the stylesheet and script emitted by Vite.
let css = '';
let js = '';
html = html.replace(/<link rel="stylesheet" crossorigin href="\/(assets\/[^"]+\.css)">\s*/g, (_, f) => { css += readFileSync(join(dist, f), 'utf8'); return ''; });
html = html.replace(/<script type="module" crossorigin src="\/(assets\/[^"]+\.js)"><\/script>\s*/g, (_, f) => { js += readFileSync(join(dist, f), 'utf8'); return ''; });
if (!css || !js) throw new Error('Could not find the built CSS/JS in dist/index.html.');

// Official brand files become data URIs (unchanged bytes).
html = html.replace(/(["(])\/(brand|img|video)\/([\w.-]+\.(?:svg|png|jpg|webp|mp4))/g, (_, q, d, f) => q + dataUri(`${d}/${f}`));
html = html.replace('</head>', () => `<style>${css}</style>\n</head>`);
html = html.replace('</body>', () => `<script type="module">${js}</script>\n</body>`);

mkdirSync(join(root, 'standalone'), { recursive: true });
writeFileSync(join(root, 'standalone', 'AoraMedical_Landing.html'), html);

// Fragment: keep title + styles + body content.
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const keep = [
  head.match(/<title>[\s\S]*?<\/title>/)[0],
  '<meta name="claude:viewport-fit-sides" content="cover">',
  ...head.match(/<link rel="(?:preconnect|stylesheet)"[^>]*>/g),
  head.match(/<style>[\s\S]*?<\/style>/)[0],
].join('\n');
writeFileSync(join(root, 'standalone', 'preview-fragment.html'), `${keep}\n${body}`);
console.log('standalone/ written');
