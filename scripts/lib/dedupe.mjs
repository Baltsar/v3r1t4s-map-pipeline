// Dubblettkontroll mot baslinjen.
//
// Ordningen är medvetet stark till svag: id, domän, org.nr, namn. Ett domänmatch
// är nästan alltid samma organisation även om namnet skiljer. Ett namnmatch kan
// vara två bolag med samma förnamn, så det kräver mer än likhet.

/** Slug: gemener, å/ä/ö viks, allt annat än a-z0-9 blir bindestreck. */
export function slug(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/** Domän utan www, protokoll och sökväg. Tom sträng om URL:en är oanvändbar. */
export function doman(url) {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Org.nr normaliserat till siffror. SE: 10 siffror, NO: 9, DK: 8, FI: 8. */
export function orgNr(v) {
  if (!v) return '';
  return String(v).replace(/\D/g, '');
}

/** Namn normaliserat för jämförelse: bolagsformsord bort, skiljetecken bort. */
export function namnNyckel(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/\b(ab|asa|as|aps|oy|oyj|hf|ehf|kf|ekonomisk forening|gmbh|inc|ltd|plc|group|gruppen)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Trigram för ungefärlig namnjämförelse. */
export function trigram(s) {
  const n = ` ${namnNyckel(s)} `;
  const set = new Set();
  for (let i = 0; i < n.length - 2; i++) set.add(n.slice(i, i + 3));
  return set;
}

/** Jaccard-likhet 0..1 mellan två trigrammängder. */
export function likhet(a, b) {
  const A = a instanceof Set ? a : trigram(a);
  const B = b instanceof Set ? b : trigram(b);
  if (!A.size || !B.size) return 0;
  let snitt = 0;
  for (const x of A) if (B.has(x)) snitt++;
  return snitt / (A.size + B.size - snitt);
}

/**
 * Jämför en kandidat mot baslinjen.
 *
 * Reglerna är ordnade efter bevisvärde, och en av dem är medvetet mjuk:
 *
 *   id        samma slug = samma post. Starkast.
 *   domän     samma webbplats = samma organisation i praktiken.
 *   org.nr    samma juridiska person. Bevisar INTE samma organisatoriska enhet.
 *             Uppsala universitet har ett org.nr och många enheter; ett lärosäte
 *             eller en kommun kan rymma tio poster som alla delar numret.
 *   namn      trigramlikhet. Svagast, kräver människa.
 *
 * Därför: org.nr ensamt ger ambiguous, inte duplicate. Org.nr tillsammans med
 * namnlikhet ger duplicate — då är det samma enhet under samma bolag.
 *
 * @param {{id?:string,name?:string,website?:string,org_number?:string}} kandidat
 * @param {{entries:Array}} baseline
 * @returns {{verdict:'new'|'duplicate'|'ambiguous', matches:Array<{id,kind,detail?}>}}
 */
export function dedupa(kandidat, baseline, { likhetsTroskel = 0.82 } = {}) {
  const poster = baseline?.entries ?? [];
  const matches = [];
  let starkt = false;

  const id = kandidat.id ? slug(kandidat.id) : '';
  const dom = doman(kandidat.website);
  const org = orgNr(kandidat.org_number);
  const namn = kandidat.name ?? '';

  const kandidatTrigram = namn ? trigram(namn) : null;

  for (const p of poster) {
    if (id && p.id && slug(p.id) === id) {
      matches.push({ id: p.id, kind: 'id' });
      starkt = true;
      continue;
    }
    if (dom && p.domain && doman(p.domain) === dom) {
      matches.push({ id: p.id, kind: 'domain', detail: dom });
      starkt = true;
      continue;
    }

    const pOrg = orgNr(p.org_number);
    const namnLikhet = kandidatTrigram && p.name ? likhet(kandidatTrigram, trigram(p.name)) : 0;

    if (org && pOrg && org === pOrg) {
      if (namnLikhet >= likhetsTroskel) {
        matches.push({ id: p.id, kind: 'org_number', detail: `${org}, namnlikhet ${namnLikhet.toFixed(2)}` });
        starkt = true;
      } else {
        // Samma juridiska person, annan enhet. Människa avgör.
        matches.push({
          id: p.id,
          kind: 'org_number',
          detail: `${org} delas med ${p.name ?? p.id}, men namnen liknar inte varandra (${namnLikhet.toFixed(2)})`,
        });
      }
      continue;
    }

    if (kandidatTrigram && p.name && namnLikhet >= likhetsTroskel) {
      matches.push({ id: p.id, kind: 'name', detail: `${namnLikhet.toFixed(2)} likhet` });
    }
  }

  if (starkt) return { verdict: 'duplicate', matches };
  if (matches.length) {
    // Delat org.nr utan namnmatch, eller ett namn som ligger nära. Inte ett
    // dubblettbesked. Människa avgör.
    return { verdict: 'ambiguous', matches };
  }
  return { verdict: 'new', matches: [] };
}
