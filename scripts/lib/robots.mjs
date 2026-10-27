// robots.txt. Samma tolkning som ai-infra:s kandidatvakt och fetch-page:
// läs User-agent: *-blocket, en Disallow som börjar på vår sökväg gäller oss.
// En robots.txt som inte går att hämta tolkas konservativt som tillåten, men
// det noteras så rapporten kan säga det.
//
// Vi hämtar aldrig en sida vi inte får läsa. Det är inte artighet, det är
// metoden: en källa vi inte får citera är ingen källa.

import { hamta } from './http.mjs';

const cache = new Map();

async function robotsFor(origin) {
  if (cache.has(origin)) return cache.get(origin);

  const res = await hamta(new URL('/robots.txt', origin).href);
  const disallow = [];
  const allow = [];
  let reachable = false;

  if (res.ok && res.body) {
    reachable = true;
    let aktiv = false;
    for (const rad of res.body.split('\n')) {
      const line = rad.split('#')[0].trim();
      if (!line) continue;
      const [rawKey, ...rest] = line.split(':');
      const key = rawKey.trim().toLowerCase();
      const val = rest.join(':').trim();

      if (key === 'user-agent') {
        aktiv = val === '*';
        continue;
      }
      if (!aktiv) continue;
      if (key === 'disallow' && val) disallow.push(val);
      if (key === 'allow' && val) allow.push(val);
    }
  }

  // Ren specifikation: en längre Allow vinner över en kortare Disallow.
  const val = { disallow, allow, reachable };
  cache.set(origin, val);
  return val;
}

/** Längsta matchande regel vinner; Allow vinner vid lika längd. */
function langstaMatch(regler, pathname) {
  let bäst = null;
  for (const r of regler) {
    if (r === '/') {
      if (!bäst || bäst.length < 1) bäst = '/';
      continue;
    }
    if (pathname.startsWith(r) && (!bäst || r.length > bäst.length)) bäst = r;
  }
  return bäst;
}

/**
 * @returns {Promise<{allowed:boolean, reachable:boolean, reason:string}>}
 */
export async function farViHamta(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return { allowed: false, reachable: false, reason: 'ogiltig URL' };
  }

  const robots = await robotsFor(u.origin);
  const pathname = u.pathname + u.search;

  if (!robots.reachable) {
    return { allowed: true, reachable: false, reason: 'robots.txt gick inte att hämta — tillåtet enligt konservativ tolkning, noterat' };
  }

  const d = langstaMatch(robots.disallow, pathname);
  const a = langstaMatch(robots.allow, pathname);

  if (d && (!a || a.length <= d.length)) {
    return { allowed: false, reachable: true, reason: `robots.txt tillåter inte ${d}` };
  }
  return { allowed: true, reachable: true, reason: a ? `robots.txt tillåter ${a}` : 'robots.txt tillåter' };
}

/** Hämtar bara om robots tillåter. Returnerar alltid ett resultat med orsak. */
export async function hamtaRespektfullt(url, opts = {}) {
  const robots = await farViHamta(url);
  if (!robots.allowed) {
    return { ok: false, status: 0, body: '', url, robots, error: robots.reason };
  }
  const res = await hamta(url, opts);
  return { ...res, robots };
}
