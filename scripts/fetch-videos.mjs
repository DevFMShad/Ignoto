// Pulls the latest uploads from the channel's public RSS feed into data/videos.js.
// Run: node scripts/fetch-videos.mjs   (GitHub Actions runs it on a schedule)
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CHANNEL_ID = 'UCrXyQ1b88mozEAlPm-I1crA';
const OUT = new URL('../data/videos.js', import.meta.url);

// First match wins; the last one catches everything else. Edit freely to add topics.
export const TOPICS = [
  { id: 'safety', bn: 'নিরাপত্তা ও প্রতারণা', en: 'Safety & Scams', match: /deepfake|scam|সাবধান|প্রতারণা|privacy|security/i },
  { id: 'work', bn: 'কাজ ও ভবিষ্যৎ', en: 'Work & Future', match: /চাকরি|freelanc|job|career|ভবিষ্যৎ|জায়গা/i },
  { id: 'tools', bn: 'AI Tools ব্যবহার', en: 'Tools & How-to', match: /\btools?\b|prompt|how to|কীভাবে ব্যবহার|tutorial/i },
  { id: 'basics', bn: 'AI-এর মূল কথা', en: 'AI Basics', match: /./ },
];

const decode = (s) => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const tag = (xml, name) => decode((xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) || [])[1] || '').trim();

// shortcut: regex parse of YouTube's fixed feed shape, swap for an XML parser if the feed format changes.
export function parseFeed(xml) {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => {
    const title = tag(e, 'title');
    const description = tag(e, 'media:description');
    return {
      id: tag(e, 'yt:videoId'),
      title,
      description,
      published: tag(e, 'published'),
      views: Number((e.match(/views="(\d+)"/) || [])[1] || 0),
      short: /href="https:\/\/www\.youtube\.com\/shorts\//.test(e),
      topic: TOPICS.find((t) => t.match.test(`${title} ${description}`)).id,
    };
  });
}

// The feed only lists the newest 15 uploads, so keep older ones from the previous run.
export function merge(previous, fresh) {
  const byId = new Map(previous.map((v) => [v.id, v]));
  for (const v of fresh) byId.set(v.id, v);
  return [...byId.values()].sort((a, b) => b.published.localeCompare(a.published));
}

async function main() {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`);
  if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
  const fresh = parseFeed(await res.text());
  if (!fresh.length) throw new Error('Feed returned no videos; keeping the existing data.');

  let previous = [];
  try {
    previous = JSON.parse((await readFile(OUT, 'utf8')).replace(/^[^{]*/, '').replace(/;\s*$/, '')).videos;
  } catch { /* first run */ }

  const videos = merge(previous, fresh);
  const topics = TOPICS.map(({ id, bn, en }) => ({ id, bn, en }));
  await writeFile(OUT, `window.IGNOTO = ${JSON.stringify({ updated: new Date().toISOString(), topics, videos }, null, 2)};\n`);
  console.log(`Saved ${videos.length} videos (${fresh.length} from feed).`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e.message); process.exit(1); });
