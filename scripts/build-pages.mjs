// Generates a static, Google-readable page per video (v/<id>/index.html) and sitemap.xml from data/videos.js.
// Run after fetch-videos.mjs: node scripts/build-pages.mjs
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Change this if the site moves to a custom domain.
export const SITE = 'https://devfmshad.github.io/Ignoto/';
const ROOT = new URL('../', import.meta.url);

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// JSON-LD lives inside <script>, so "<" must never appear raw.
const jsonLd = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const thumb = (id, size = 'hqdefault') => `https://i.ytimg.com/vi/${id}/${size}.jpg`;
const watchUrl = (v) => (v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`);
const bnDate = (iso) => new Date(iso).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
const SUB = 'https://www.youtube.com/@fms_ignoto?sub_confirmation=1';

export function videoPage(v, { videos, topics }) {
  const topic = topics.find((t) => t.id === v.topic) || { bn: '', en: '' };
  const log = `LOG ${String(videos.length - videos.indexOf(v)).padStart(3, '0')}`;
  const url = `${SITE}v/${v.id}/`;
  const summary = (v.description || v.title).replace(/\s+/g, ' ').slice(0, 155);
  const related = [...videos.filter((o) => o !== v && o.topic === v.topic), ...videos.filter((o) => o !== v && o.topic !== v.topic)].slice(0, 3);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description || v.title,
    thumbnailUrl: [thumb(v.id, 'maxresdefault'), thumb(v.id)],
    uploadDate: v.published,
    embedUrl: `https://www.youtube.com/embed/${v.id}`,
    url,
    inLanguage: 'bn',
    interactionStatistic: { '@type': 'InteractionCounter', interactionType: { '@type': 'WatchAction' }, userInteractionCount: v.views },
    publisher: { '@type': 'Organization', name: 'Ignoto', url: SITE, logo: { '@type': 'ImageObject', url: `${SITE}assets/orb.png` } },
  };

  return `<!doctype html>
<html lang="bn">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(v.title)} | Ignoto</title>
  <meta name="description" content="${esc(summary)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#06070a">
  <meta property="og:type" content="video.other">
  <meta property="og:title" content="${esc(v.title)}">
  <meta property="og:description" content="${esc(summary)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${thumb(v.id)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="../../assets/orb.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wdth,wght@75..125,200..800&family=Martian+Mono:wdth,wght@75..112.5,300..500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../../styles.css">
  <script type="application/ld+json">${jsonLd(schema)}</script>
</head>
<body>
  <header class="top">
    <a class="wordmark" href="../../" aria-label="Ignoto home">Ign<img class="o-img" src="../../assets/orb.png" alt="" width="150" height="150">to</a>
    <a class="btn btn--ghost btn--sm" href="${SUB}" target="_blank" rel="noopener">Subscribe</a>
  </header>

  <main class="vp">
    <a class="mono vp__back" href="../../#library">← লাইব্রেরি</a>
    <p class="mono vp__meta"><b>${log}</b><span class="tag">${esc(topic.bn)}</span><span>${bnDate(v.published)}</span><span>${v.short ? 'Short' : 'Long-form'}</span></p>
    <h1 class="vp__title">${esc(v.title)}</h1>
    <div class="vp__player${v.short ? ' vp__player--short' : ''}">
      <iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0&amp;modestbranding=1" title="${esc(v.title)}" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
    </div>
    <div class="vp__body">
      <div class="vp__desc">${(v.description || '').split(/\n+/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('\n') || `<p>${esc(v.title)}</p>`}</div>
      <aside class="vp__aside">
        <a class="btn btn--ember" href="${watchUrl(v)}" target="_blank" rel="noopener">YouTube-এ দেখুন ↗</a>
        <a class="btn btn--ghost" href="${SUB}" target="_blank" rel="noopener">Subscribe করুন</a>
      </aside>
    </div>
${related.length ? `
    <section class="vp__related">
      <p class="mono label">[ আরও দেখুন ]</p>
      <div class="catalogue">
${related.map((o) => `        <a class="log" href="../${o.id}/">
          <span class="player"><img src="${thumb(o.id)}" alt="" loading="lazy"><span class="player__play"></span></span>
          <span class="log__meta mono"><b>LOG ${String(videos.length - videos.indexOf(o)).padStart(3, '0')}</b><span>${o.short ? 'Short' : 'Long-form'}</span></span>
          <h3>${esc(o.title)}</h3>
        </a>`).join('\n')}
      </div>
    </section>` : ''}
  </main>

  <footer class="foot">
    <div class="foot__row mono">
      <span>© ${new Date().getFullYear()} Ignoto</span>
      <nav aria-label="Footer"><a href="../../#latest">Videos</a><a href="../../#library">Library</a><a href="../../#collab">Collab</a><a href="https://www.youtube.com/@fms_ignoto" target="_blank" rel="noopener">YouTube ↗</a></nav>
    </div>
  </footer>
  <div class="grain" aria-hidden="true"></div>
</body>
</html>
`;
}

export function sitemap({ videos, updated }) {
  const urls = [[SITE, updated], ...videos.map((v) => [`${SITE}v/${v.id}/`, v.published])];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc, mod]) => `  <url><loc>${loc}</loc><lastmod>${mod.slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>
`;
}

async function main() {
  const data = JSON.parse((await readFile(new URL('data/videos.js', ROOT), 'utf8')).replace(/^[^{]*/, '').replace(/;\s*$/, ''));
  await rm(new URL('v/', ROOT), { recursive: true, force: true });
  for (const v of data.videos) {
    const dir = new URL(`v/${v.id}/`, ROOT);
    await mkdir(dir, { recursive: true });
    await writeFile(new URL('index.html', dir), videoPage(v, data));
  }
  await writeFile(new URL('sitemap.xml', ROOT), sitemap(data));
  console.log(`Built ${data.videos.length} video pages and sitemap.xml.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
