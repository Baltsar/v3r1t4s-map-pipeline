// Test av validatorn. Kör: node --test scripts/lib/
//
// Testet finns för att portvakten ska vara billig att lita på. En validator som
// släpper igenom en bekräftad egen påstående-rad gör hela databasen till
// marknadscopy med extra steg.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { valideraKandidat } from './validate.mjs';
import { fact } from './fact.mjs';
import { dedupa, doman, orgNr, likhet } from './dedupe.mjs';

const KALLA = { source_url: 'https://example.se', source_type: 'own_site', verified_at: '2026-10-26' };
const REGISTER = { source_url: 'https://allabolag.se/5560000000', source_type: 'third_party', verified_at: '2026-10-26' };

function bas(over = {}) {
  return {
    id: 'exempelbolag',
    name: fact('Exempelbolaget', 'claimed', KALLA),
    website: 'https://example.se',
    layer: fact('inference_api', 'claimed', KALLA),
    layer_proposal: false,
    sources: [{ url: 'https://example.se', source_type: 'own_site', fetched_at: '2026-10-26' }],
    dedupe: { checked_against: ['ai-infra', 'ai-kartan'], matches: [], verdict: 'new' },
    discovered_at: '2026-10-26',
    batch: 'runs/2026-10-26/batch-01.json',
    ...over,
  };
}

test('en ärlig post validerar', () => {
  const r = valideraKandidat(bas());
  assert.equal(r.ok, true, r.errors.join('; '));
});

test('confirmed på egen sida avvisas', () => {
  const r = valideraKandidat(bas({ name: fact('X', 'confirmed', KALLA) }));
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /egen sida ger högst claimed/);
});

test('confirmed utan källa avvisas', () => {
  const r = valideraKandidat(bas({ name: { value: 'X', status: 'confirmed', verified_at: '2026-10-26' } }));
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /kräver source_url/);
});

test('confirmed mot register tillåts', () => {
  const r = valideraKandidat(bas({ org_number: fact('556000-0000', 'confirmed', REGISTER) }));
  assert.equal(r.ok, true, r.errors.join('; '));
});

test('suveränitet får inte bli confirmed ur egen sida', () => {
  const r = valideraKandidat(
    bas({ sovereignty: { zero_retention: { value: true, status: 'confirmed', ...KALLA } } }),
  );
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /suveränitetspåstående/);
});

test('suveränitet får bli confirmed ur register', () => {
  const r = valideraKandidat(
    bas({ sovereignty: { country_hq: { value: 'Sverige', status: 'confirmed', ...REGISTER } } }),
  );
  assert.equal(r.ok, true, r.errors.join('; '));
});

test('numeriskt värde utan URL avvisas', () => {
  const r = valideraKandidat(bas({ name: { value: 42, status: 'claimed' } }));
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /numeriskt värde kräver source_url/);
});

test('unknown med värde avvisas', () => {
  const r = valideraKandidat(bas({ name: { value: 'X', status: 'unknown' } }));
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /unknown kräver value: null/);
});

test('nytt lager utan layer_proposal avvisas', () => {
  const r = valideraKandidat(bas({ layer: fact('mcp_server', 'claimed', KALLA), layer_proposal: false }));
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /kräver layer_proposal/);
});

test('nytt lager med layer_proposal tillåts', () => {
  const r = valideraKandidat(bas({ layer: fact('mcp_server', 'claimed', KALLA), layer_proposal: true }));
  assert.equal(r.ok, true, r.errors.join('; '));
});

test('död källa avvisas', () => {
  const r = valideraKandidat(
    bas({ sources: [{ url: 'https://example.se', source_type: 'own_site', fetched_at: '2026-10-26', http_status: 403 }] }),
  );
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /döda källor/);
});

test('robots-blockerad källa avvisas', () => {
  const r = valideraKandidat(
    bas({ sources: [{ url: 'https://example.se', source_type: 'own_site', fetched_at: '2026-10-26', robots_allowed: false }] }),
  );
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /robots/);
});

test('new med matches avvisas', () => {
  const r = valideraKandidat(
    bas({ dedupe: { checked_against: ['ai-infra'], matches: [{ id: 'x', kind: 'domain' }], verdict: 'new' } }),
  );
  assert.equal(r.ok, false);
});

test('fact kastar på confirmed utan källa', () => {
  assert.throws(() => fact('X', 'confirmed', { source_url: 'https://x.se' }), /confirmed kräver/);
});

// ── dedupe ────────────────────────────────────────────────────────────────
const baseline = {
  entries: [
    { id: 'berget-ai', name: 'Berget AI', domain: 'berget.ai', org_number: '5595047522' },
    { id: 'aixia', name: 'Aixia', domain: 'aixia.se', org_number: '5568782295' },
  ],
};

test('domänmatch är dubblett', () => {
  const d = dedupa({ id: 'nytt-id', name: 'Annat namn', website: 'https://www.berget.ai' }, baseline);
  assert.equal(d.verdict, 'duplicate');
  assert.equal(d.matches[0].id, 'berget-ai');
});

test('org.nr med bindestreck matchar', () => {
  const d = dedupa({ id: 'x', name: 'Aixia', org_number: '556878-2295' }, baseline);
  assert.equal(d.verdict, 'duplicate');
});

test('delat org.nr utan namnlikhet är osäkert, inte dubblett', () => {
  // Ett lärosäte har ett org.nr men många enheter. Uppsala universitet är
  // exemplet som avslöjade regeln: UPPMAX och en forskningssatsning delar nummer.
  const medDelat = {
    entries: [{ id: 'ai-for-research-uu', name: 'AI for Research, Uppsala universitet', domain: 'uu.se', org_number: '2021002932' }],
  };
  const d = dedupa({ id: 'uppmax', name: 'UPPMAX', website: 'https://www.uppmax.uu.se/', org_number: '202100-2932' }, medDelat);
  assert.equal(d.verdict, 'ambiguous');
  assert.equal(d.matches[0].kind, 'org_number');
});

test('delat org.nr med namnlikhet är dubblett', () => {
  const medDelat = {
    entries: [{ id: 'berget-ai', name: 'Berget AI', domain: 'annat.se', org_number: '5595047522' }],
  };
  const d = dedupa({ id: 'berget', name: 'Berget AI', org_number: '559504-7522' }, medDelat);
  assert.equal(d.verdict, 'duplicate');
});

test('okänd aktör är new', () => {
  const d = dedupa({ id: 'helt-nytt', name: 'Helt Nytt Bolag', website: 'https://heltnytt.se' }, baseline);
  assert.equal(d.verdict, 'new');
});

test('domän normaliseras', () => {
  assert.equal(doman('https://www.Exempel.se/sida'), 'exempel.se');
  assert.equal(doman('exempel.se'), 'exempel.se');
  assert.equal(doman(null), '');
});

test('org.nr normaliseras', () => {
  assert.equal(orgNr('559504-7522'), '5595047522');
  assert.equal(orgNr(null), '');
});

test('likhet skiljer bolagsformsord', () => {
  assert.ok(likhet('Berget AI AB', 'Berget AI') > 0.8);
  assert.ok(likhet('Berget AI', 'Aixia') < 0.3);
});
