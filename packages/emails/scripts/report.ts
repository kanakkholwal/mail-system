import { listByGenre, listTemplates } from '../src/registry.js';

/** Prints the catalogue table used in the README and the studio gallery. */
function main(): void {
  const all = listTemplates();
  const byGenre = listByGenre();

  console.log(`${all.length} templates across ${Object.keys(byGenre).length} genres\n`);

  for (const [genre, metas] of Object.entries(byGenre)) {
    console.log(`${genre} (${metas.length})`);
    for (const meta of metas) {
      const flags = [
        meta.modes.join('+'),
        meta.requiresUnsubscribe ? 'marketing' : '',
        meta.primaryAction ? `cta: ${meta.primaryAction}` : 'no cta',
      ]
        .filter(Boolean)
        .join(' | ');
      console.log(`  ${meta.key.padEnd(24)} ${flags}`);
    }
    console.log();
  }

  const triModal = all.filter((meta) => meta.modes.length === 3);
  const marketing = all.filter((meta) => meta.requiresUnsubscribe);
  const noCta = all.filter((meta) => meta.primaryAction === '');

  console.log(`tri-modal (email + web + document): ${triModal.map((m) => m.key).join(', ')}`);
  console.log(`marketing-class (unsubscribe enforced): ${marketing.map((m) => m.key).join(', ')}`);
  console.log(`deliberately actionless: ${noCta.map((m) => m.key).join(', ')}`);
  console.log(`rendered artifacts: ${all.reduce((sum, meta) => sum + meta.modes.length, 0)}`);
}

main();
