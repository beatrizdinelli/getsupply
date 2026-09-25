import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const publicDir = resolve(root, 'dist/public');
const { pages, siteMeta } = await import(
  pathToFileURL(resolve(root, 'dist/ssr/prerender.js')).href
);
const template = readFileSync(resolve(publicDir, 'index.html'), 'utf8');

if (
  !template.includes(`<title>${siteMeta.title}</title>`) ||
  !template.includes(`<meta name="description" content="${siteMeta.description}" />`)
) {
  throw new Error(
    'index.html e src/lib/site-meta.ts estão diferentes: atualize os dois juntos.',
  );
}

const escape = (value) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function replaceOnce(source, pattern, replacement) {
  if (!pattern.test(source)) {
    throw new Error(`Padrão não encontrado no index.html: ${pattern}`);
  }
  return source.replace(pattern, () => replacement);
}

for (const page of pages) {
  const { title, description } = page.meta;
  let html = template;
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`);
  html = replaceOnce(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escape(description)}" />`);
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escape(title)}" />`);
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escape(description)}" />`);
  html = replaceOnce(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escape(title)}" />`);
  html = replaceOnce(html, /<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escape(description)}" />`);
  html = replaceOnce(html, /<div id="root"><\/div>/, `<div id="root">${page.html()}</div>`);
  writeFileSync(resolve(publicDir, page.file), html);
  console.log(`prerender: ${page.path} -> dist/public/${page.file}`);
}
