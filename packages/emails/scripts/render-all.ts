import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { registry } from '../src/registry.js';
import { renderTemplate } from '../src/render.js';
import type { RenderMode } from '../src/kit/tokens.js';

const OUT = join(process.cwd(), 'dist-preview');

/** Writes every template in every mode it supports, plus text and design JSON. */
function main(): void {
  mkdirSync(OUT, { recursive: true });
  const index: { key: string; mode: RenderMode; subject: string; bytes: number }[] = [];

  for (const [key, template] of Object.entries(registry)) {
    for (const mode of template.meta.modes) {
      const result = renderTemplate(template, template.sample, { mode });
      const stem = join(OUT, `${key}.${mode}`);
      writeFileSync(`${stem}.html`, result.html, 'utf8');
      if (mode === 'email') {
        writeFileSync(`${stem}.txt`, result.text, 'utf8');
        writeFileSync(`${stem}.design.json`, JSON.stringify(result.design, null, 2), 'utf8');
      }
      index.push({ key, mode, subject: result.subject, bytes: result.html.length });
    }
  }

  writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2), 'utf8');
  for (const row of index) {
    console.log(`${row.key.padEnd(24)} ${row.mode.padEnd(9)} ${String(row.bytes).padStart(7)}B  ${row.subject}`);
  }
  console.log(`\n${index.length} files written to ${OUT}`);
}

main();
