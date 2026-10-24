// Run: node --test scripts/build-pages.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { videoPage, sitemap, SITE } from './build-pages.mjs';

const evil = { id: 'aaaaaaaaaaa', title: '<script>alert(1)</script> "AI"', description: 'line one\nline </script> two', published: '2026-10-23T19:00:00+00:00', views: 5, short: false, topic: 'basics' };
const other = { id: 'bbbbbbbbbbb', title: 'Other', description: '', published: '2026-10-22T19:00:00+00:00', views: 1, short: true, topic: 'basics' };
const data = { videos: [evil, other], topics: [{ id: 'basics', bn: 'মূল কথা', en: 'Basics' }], updated: '2026-10-24T00:00:00Z' };

test('video page escapes feed text everywhere', () => {
  const html = videoPage(evil, data);
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('line </script>'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt; &quot;AI&quot;'));
  assert.ok(html.includes(`<link rel="canonical" href="${SITE}v/aaaaaaaaaaa/">`));
  assert.ok(html.includes('href="../bbbbbbbbbbb/"'));
});

test('sitemap lists home and every video', () => {
  const xml = sitemap(data);
  assert.equal((xml.match(/<url>/g) || []).length, 3);
  assert.ok(xml.includes(`<loc>${SITE}v/bbbbbbbbbbb/</loc><lastmod>2026-10-22</lastmod>`));
});
