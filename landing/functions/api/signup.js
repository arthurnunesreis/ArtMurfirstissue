// Cloudflare Pages Function: POST /api/signup
// Stores a demand vote (who + city + kind of show + email + role) in the D1 database bound as DB.

const ROLES = new Set(['fan', 'performer', 'organizer', 'sponsor', 'provider']);
const FORMATS = new Set(['concert', 'orchestral', 'theatre', 'other']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function clean(value, max) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ error: 'Send the form as JSON.' }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (data.website) return json({ ok: true });

  const artist = clean(data.artist, 80);
  const city = clean(data.city, 80);
  const email = clean(data.email, 200).toLowerCase();
  const role = ROLES.has(data.role) ? data.role : 'fan';
  const format = FORMATS.has(data.format) ? data.format : 'concert';

  if (!artist) return json({ error: 'Add who or what you want to see.' }, 422);
  if (!city) return json({ error: 'Add the city you want them to play in.' }, 422);
  if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid email address so we can reach you.' }, 422);

  const country = request.cf?.country ?? null; // two-letter code from Cloudflare, for rough demand mapping
  const ipHash = await hash(request.headers.get('CF-Connecting-IP') ?? '');

  // Simple abuse limit: max 20 votes per IP per day.
  const { n } = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM signups WHERE ip_hash = ? AND created_at > datetime('now', '-1 day')"
  ).bind(ipHash).first();
  if (n >= 20) return json({ error: 'Too many votes from this connection today. Try again tomorrow.' }, 429);

  // One vote per email per show+city; repeat submits refresh the role and format.
  await env.DB.prepare(
    `INSERT INTO signups (email, artist, artist_key, city, city_key, format, role, country, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (email, artist_key, city_key) DO UPDATE SET role = excluded.role, format = excluded.format`
  ).bind(email, artist, artist.toLowerCase(), city, city.toLowerCase(), format, role, country, ipHash).run();

  return json({ ok: true });
}

export function onRequest() {
  return json({ error: 'Use POST.' }, 405);
}

async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
