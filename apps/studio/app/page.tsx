import type { Genre } from '@better-mailer/emails';
import { catalogue, genresInUse } from '@/lib/catalogue';
import { TemplateCard } from '@/components/template-card';
import styles from './gallery.module.css';

interface Query {
  genre?: string;
  mode?: string;
}

const MODE_FILTERS = [
  { value: 'document', label: 'Printable' },
  { value: 'web', label: 'Hosted page' },
] as const;

function href(query: Query): string {
  const params = new URLSearchParams();
  if (query.genre) params.set('genre', query.genre);
  if (query.mode) params.set('mode', query.mode);
  const search = params.toString();
  return search ? `/?${search}` : '/';
}

export default async function GalleryPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const all = catalogue();

  const filtered = all.filter(
    (entry) =>
      (!query.genre || entry.genre === query.genre) &&
      (!query.mode || entry.modes.includes(query.mode as 'email' | 'web' | 'document')),
  );

  const genres = genresInUse().filter((genre) => filtered.some((entry) => entry.genre === genre));
  const triModal = all.filter((entry) => entry.modes.length === 3).length;

  return (
    <main>
      <section className={styles.hero}>
        <div className="shell">
          <h1 className={styles.headline}>
            One React tree.
            <br />
            Inbox, web page, printed page.
          </h1>
          <p className={styles.lede}>
            {all.length} transactional and lifecycle templates built with Unlayer Elements. Every payload is
            schema-checked, every marketing send refuses to render without an unsubscribe link, and {triModal} of them
            also come out as A4 documents.
          </p>
          <dl className={styles.stats}>
            <div>
              <dt>Templates</dt>
              <dd className="mono">{all.length}</dd>
            </div>
            <div>
              <dt>Genres</dt>
              <dd className="mono">{genresInUse().length}</dd>
            </div>
            <div>
              <dt>Rendered artifacts</dt>
              <dd className="mono">{all.reduce((sum, entry) => sum + entry.modes.length, 0)}</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className={styles.filterBar}>
        <div className="shell">
          <nav className={styles.filters} aria-label="Filter templates">
            <a
              href={href({ ...(query.mode ? { mode: query.mode } : {}) })}
              className={styles.chip}
              aria-current={query.genre ? undefined : 'true'}
            >
              All
            </a>
            {genresInUse().map((genre: Genre) => (
              <a
                key={genre}
                href={href({ genre, ...(query.mode ? { mode: query.mode } : {}) })}
                className={styles.chip}
                aria-current={query.genre === genre ? 'true' : undefined}
              >
                {genre}
              </a>
            ))}
            <span className={styles.divider} aria-hidden="true" />
            {MODE_FILTERS.map((filter) => (
              <a
                key={filter.value}
                href={href({
                  ...(query.genre ? { genre: query.genre } : {}),
                  ...(query.mode === filter.value ? {} : { mode: filter.value }),
                })}
                className={styles.chip}
                aria-current={query.mode === filter.value ? 'true' : undefined}
              >
                {filter.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="shell">
        {genres.map((genre) => (
          <section key={genre} className={styles.genre}>
            <header className={styles.genreHead}>
              <h2 className={styles.genreTitle}>{genre}</h2>
              <span className="label">{filtered.filter((entry) => entry.genre === genre).length}</span>
            </header>
            <div className={styles.grid}>
              {filtered
                .filter((entry) => entry.genre === genre)
                .map((entry) => (
                  <TemplateCard key={entry.key} entry={entry} />
                ))}
            </div>
          </section>
        ))}

        {filtered.length === 0 && <p className={styles.empty}>No template matches that combination.</p>}
      </div>
    </main>
  );
}
