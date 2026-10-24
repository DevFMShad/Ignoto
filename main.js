const { videos = [], topics = [] } = window.IGNOTO || {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Builds elements with textContent so feed titles can never inject HTML.
function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids.filter(Boolean));
  return n;
}
const pad = (n) => String(n).padStart(2, '0');
const bnDate = (iso) => new Date(iso).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });
const watchUrl = (v) => (v.short ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`);
// Each video has its own static page, built by scripts/build-pages.mjs.
const pageUrl = (v) => `v/${v.id}/`;
const topicName = (id) => topics.find((t) => t.id === id)?.bn || '';
// Catalogue number: oldest upload is LOG 001.
const logNo = (v) => `LOG ${String(videos.length - videos.indexOf(v)).padStart(3, '0')}`;

// Thumbnail that swaps itself for a privacy-friendly embed on click.
function player(v, extra) {
  const img = el('img', { src: `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`, alt: '', loading: 'lazy', decoding: 'async' });
  img.onerror = () => { img.onerror = null; img.src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`; };
  const btn = el('button', { className: 'player', type: 'button', ariaLabel: `Play: ${v.title}` }, img, el('span', { className: 'player__play' }), extra);
  btn.addEventListener('click', () => {
    btn.classList.add('playing');
    btn.append(el('iframe', {
      src: `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1`,
      title: v.title, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowFullscreen: true,
    }));
  }, { once: true });
  return btn;
}

/* ---------- contact: address assembled here so it isn't sitting in the HTML for scrapers ---------- */
const mail = ['fuademrite+ignoto', 'gmail.com'].join('@');
$$('[data-mail]').forEach((a) => (a.href = `mailto:${mail}?subject=${encodeURIComponent('Collaboration with Ignoto')}`));

if (reduced) $('.orbit__portal')?.pause();

/* ---------- stats ---------- */
const shorts = videos.filter((v) => v.short);
const longs = videos.filter((v) => !v.short);
const counts = { all: videos.length, long: longs.length, short: shorts.length };
$$('[data-count]').forEach((n) => (n.textContent = pad(counts[n.dataset.count])));
if (videos[0]) $('[data-last-signal]').textContent = `Last signal ${new Date(videos[0].published).toLocaleDateString('en-GB').replace(/\//g, '.')}`;
$('[data-year]').textContent = new Date().getFullYear();

/* ---------- latest ---------- */
const featured = longs[0] || videos[0];
if (featured) {
  const box = $('[data-feature]');
  $('.feature__player', box).replaceWith(el('div', { className: 'feature__player' }, player(featured)));
  $('.feature__body', box).append(
    el('div', { className: 'feature__meta mono' }, el('span', { className: 'tag', textContent: topicName(featured.topic) }), el('span', { textContent: bnDate(featured.published) })),
    el('a', { href: pageUrl(featured) }, el('h3', { textContent: featured.title })),
    el('p', { textContent: featured.description.split('\n')[0].slice(0, 220) }),
    el('a', { className: 'btn btn--ghost', href: watchUrl(featured), target: '_blank', rel: 'noopener', textContent: 'YouTube-এ দেখুন ↗' }),
  );
}

/* ---------- shorts ---------- */
const rail = $('[data-shorts]');
shorts.forEach((v) => rail.append(el('div', { className: 'short' },
  player(v, el('span', { className: 'short__title', textContent: v.title })),
  el('a', { className: 'mono', href: pageUrl(v), textContent: `${logNo(v)} · ${topicName(v.topic)} →` }),
)));
if (!shorts.length) $('#shorts').hidden = true;
$$('[data-rail]').forEach((b) => b.addEventListener('click', () => rail.scrollBy({ left: rail.clientWidth * 0.8 * b.dataset.rail, behavior: 'smooth' })));

/* ---------- library ---------- */
const topicBox = $('[data-topics]');
const catalogue = $('[data-catalogue]');
const tabs = [{ id: 'all', bn: 'সব ভিডিও', en: 'Everything' }, ...topics].map((t, i) => {
  const n = t.id === 'all' ? videos.length : videos.filter((v) => v.topic === t.id).length;
  const b = el('button', { className: 'topic', type: 'button', role: 'tab' },
    el('span', { className: 'topic__top mono' }, el('span', { textContent: `${pad(i)} — ${pad(n)} videos` }), el('span', { className: 'topic__arrow', textContent: '→' })),
    el('h3', {}, t.bn, el('small', { textContent: t.en })),
  );
  b.addEventListener('click', () => showTopic(t.id));
  b.dataset.id = t.id;
  topicBox.append(b);
  return b;
});

function showTopic(id) {
  tabs.forEach((b) => b.setAttribute('aria-selected', b.dataset.id === id));
  const list = id === 'all' ? videos : videos.filter((v) => v.topic === id);
  catalogue.replaceChildren(...list.map((v, i) => {
    const card = el('article', { className: `log${v.short ? ' log--short' : ''}` },
      player(v),
      el('div', { className: 'log__meta mono' }, el('b', { textContent: logNo(v) }), el('span', { textContent: v.short ? 'Short' : 'Long-form' })),
      el('a', { href: pageUrl(v) }, el('h3', { textContent: v.title })),
      el('span', { className: 'mono small', textContent: `${topicName(v.topic)} · ${bnDate(v.published)}` }),
    );
    card.style.animationDelay = `${i * 60}ms`;
    return card;
  }));
  if (!list.length) catalogue.append(el('p', { className: 'empty', textContent: 'এই বিষয়ে ভিডিও আসছে শীঘ্রই।' }));
}
showTopic('all');

/* ---------- manifesto: words light up as you scroll ---------- */
const words = $('[data-words]');
words.innerHTML = words.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span> `).join('');
const ws = $$('.w', words);
function paintWords() {
  const r = words.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
  ws.forEach((w, i) => w.classList.toggle('on', reduced || i < p * ws.length));
}

/* ---------- dock + active section ---------- */
const dock = $('.dock');
const dockLinks = $$('.dock a[href^="#"]');
function onScroll() {
  paintWords();
  dock.classList.toggle('show', scrollY > innerHeight * 0.6);
  let current = '';
  dockLinks.forEach((a) => { if ($(a.hash).getBoundingClientRect().top < innerHeight * 0.5) current = a.hash; });
  dockLinks.forEach((a) => a.classList.toggle('active', a.hash === current));
}
addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
onScroll();

/* ---------- reveal on view ---------- */
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.15 });
$$('.reveal').forEach((n) => io.observe(n));

/* ---------- orbit tilts toward the cursor ---------- */
const orbit = $('.hero .orbit');
if (!reduced && matchMedia('(pointer: fine)').matches) {
  $('.hero').addEventListener('pointermove', (e) => {
    orbit.style.setProperty('--ry', `${(e.clientX / innerWidth - 0.5) * 18}deg`);
    orbit.style.setProperty('--rx', `${(e.clientY / innerHeight - 0.5) * -18}deg`);
  });
}
