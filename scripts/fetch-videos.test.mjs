// Run: node --test scripts/fetch-videos.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed, merge } from './fetch-videos.mjs';

const entry = (id, href, title, published) => `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title>
<link rel="alternate" href="${href}"/><published>${published}</published>
<media:group><media:description>Say &quot;hi&quot; #deepfake</media:description><media:statistics views="42"/></media:group></entry>`;

test('parses shorts, long videos, entities and topics', () => {
  const [s, l] = parseFeed(entry('aaaaaaaaaaa', 'https://www.youtube.com/shorts/aaaaaaaaaaa', 'Short', '2026-10-02') +
    entry('bbbbbbbbbbb', 'https://www.youtube.com/watch?v=bbbbbbbbbbb', 'AI ও চাকরি', '2026-10-01'));
  assert.deepEqual([s.short, l.short], [true, false]);
  assert.equal(s.description, 'Say "hi" #deepfake');
  assert.equal(s.views, 42);
  assert.equal(s.topic, 'safety');
});

test('merge keeps old videos and lets fresh data win', () => {
  const out = merge([{ id: 'old', published: '2025' }, { id: 'x', views: 1, published: '2026' }], [{ id: 'x', views: 9, published: '2026' }]);
  assert.deepEqual(out.map((v) => [v.id, v.views]), [['x', 9], ['old', undefined]]);
});
