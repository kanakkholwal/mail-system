import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { listTemplates } from '@better-mailer/emails';
import { entryFor, render } from '@/lib/catalogue';
import { Workbench } from '@/components/workbench';

export function generateStaticParams(): { key: string }[] {
  return listTemplates().map((meta) => ({ key: meta.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const entry = entryFor(key);
  if (!entry) return { title: 'Unknown template' };
  return { title: `${entry.meta.name} · better-mailer`, description: entry.meta.description };
}

export default async function TemplatePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const entry = entryFor(key);
  if (!entry) notFound();

  const mode = entry.meta.modes[0] ?? 'email';
  const initial = render(key, entry.sample, mode);

  return <Workbench meta={entry.meta} schema={entry.schema} sample={entry.sample} initial={initial} />;
}
