// Fact-hjälpare. En Fact är värde + status + källa + datum. Inget annat.
//
// Regeln som gör databasen värd något: egen sida ger högst "claimed".
// confirmed kräver en källa som inte är organisationen själv.

import { lasConfig } from './paths.mjs';

const KONFIG = lasConfig('sources.json');

export const STATUS = ['confirmed', 'claimed', 'planned', 'unknown', 'not_applicable'];

export const KALLTYPER = Object.keys(KONFIG.source_can_confirm);

export function kanBekrafta(sourceType) {
  return KONFIG.source_can_confirm[sourceType] === true;
}

/** Bygg en Fact. Kastar om statusen är confirmed utan att källan får bekräfta. */
export function fact(value, status, opts = {}) {
  const { source_url = null, source_type = null, note = null, verified_at = null, verified_by = 'agent' } = opts;

  const f = { value: value ?? null, status };

  if (source_url) f.source_url = source_url;
  if (source_type) f.source_type = source_type;
  if (note) f.note = note;
  if (verified_at) f.verified_at = verified_at;
  f.verified_by = verified_by;

  if (status === 'confirmed' && (!source_url || !verified_at || !source_type)) {
    throw new Error(`confirmed kräver source_url, source_type och verified_at (fick ${JSON.stringify({ source_url, source_type, verified_at })})`);
  }
  return f;
}

/** Fact som alltid är ok eftersom vi inte vet något. */
export function okand(note = null) {
  const f = { value: null, status: 'unknown', verified_by: 'agent' };
  if (note) f.note = note;
  return f;
}

/** Fact ur en nyfunnet källa: status bestäms av källtypen, inte av vad vi hoppas. */
export function urKalla(value, source_type, source_url, verified_at, opts = {}) {
  const status = kanBekrafta(source_type) ? 'confirmed' : 'claimed';
  return fact(value, status, { source_url, source_type, verified_at, note: opts.note ?? null, verified_by: opts.verified_by ?? 'agent' });
}

/**
 * Suveränitetspåståenden får aldrig bli confirmed ur marknadscopy.
 * Enda vägen till confirmed är ett dokument (DPA/villkor) som källtyp own_docs
 * eller en regulator — och även då krävs att påståendet står ordagrant i källan.
 */
export function suveranitetsFact(value, source_type, source_url, verified_at, opts = {}) {
  const tillatenBekraftelse = source_type === 'regulator' || source_type === 'third_party' || source_type === 'company_register';
  const status = tillatenBekraftelse && opts.ordagrant ? 'confirmed' : value === null ? 'unknown' : 'claimed';
  return fact(value, status, {
    source_url,
    source_type,
    verified_at,
    note: tillatenBekraftelse && !opts.ordagrant ? `${opts.note ?? ''} (påståendet ej ordagrant i källan — claimed)`.trim() : (opts.note ?? null),
    verified_by: opts.verified_by ?? 'agent',
  });
}

/** true om texten innehåller ett tal som inte är källbelagt — används av validatorn. */
export function arTal(v) {
  return typeof v === 'number' && Number.isFinite(v);
}
