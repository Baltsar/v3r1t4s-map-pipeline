// Hämtar JSON ur ett privat GitHub-repo med den inloggade gh-sessionen.
//
// Varför inte bara en token i miljön: repot ska kunna köras av den som redan
// är inloggad, utan att någon lägger en nyckel i en fil. gh äger
// autentiseringen, vi lånar den bara för läsning.
//
// Saknas gh eller är sessionen utgången returneras null. Anroparen ansvarar för
// att säga att dubblettkontrollen blev svagare — aldrig att låtsas att den kördes.

import { execFileSync } from 'node:child_process';

export function ghFinns() {
  try {
    execFileSync('gh', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} repo "agare/namn"
 * @param {string} path sökväg i repot
 * @returns {object|null}
 */
export function hamtaPrivatJson(repo, path) {
  try {
    const ut = execFileSync(
      'gh',
      ['api', '-H', 'Accept: application/vnd.github.raw', `repos/${repo}/contents/${path}`],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return JSON.parse(ut);
  } catch (err) {
    return null;
  }
}
