// Minimal YAML-läsning för ai-kartans organisationsfiler.
//
// Vi behöver fyra fält: id, name.value, website, org_number.value. Att dra in
// ett YAML-bibliotek för det vore en dependency utan nytta — och repot ska
// köra utan npm install. Fälten ligger på fasta ställen i mallen, så vi läser
// dem positionellt och failar högljutt om mallen ändras.

function avcitera(s) {
  let v = s.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (v === 'null' || v === '~' || v === '') return null;
  return v;
}

/**
 * Läser en ai-kartan-post. Returnerar { id, name, website, org_number } med
 * null för fält som saknas. Kastar aldrig — trasiga filer hoppas över av anroparen.
 */
export function lasKartanPost(text) {
  const rader = text.split('\n');
  const ut = { id: null, name: null, website: null, org_number: null, type: null };

  let nuvarandeTopp = null;

  for (const rad of rader) {
    if (!rad.trim() || rad.trim().startsWith('#')) continue;

    // Top-level nyckel: ingen inledande blanksteg och matchar key:
    const topp = /^([a-z_]+):(.*)$/.exec(rad);
    if (topp) {
      nuvarandeTopp = topp[1];
      const rest = topp[2].trim();
      if (nuvarandeTopp === 'id' && rest) ut.id = avcitera(rest);
      if (nuvarandeTopp === 'website' && rest) ut.website = avcitera(rest);
      continue;
    }

    // Nästlad value: inom en känd toppnyckel
    const nest = /^\s+value:(.*)$/.exec(rad);
    if (nest && nuvarandeTopp) {
      const v = avcitera(nest[1]);
      if (nuvarandeTopp === 'name' && ut.name === null) ut.name = v;
      if (nuvarandeTopp === 'org_number' && ut.org_number === null) ut.org_number = v;
      if (nuvarandeTopp === 'type' && ut.type === null) ut.type = v;
    }
  }

  return ut;
}
