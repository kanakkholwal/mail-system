import type { RenderMode } from '@better-mailer/emails';
import { designJson, entryFor } from '@/lib/catalogue';

const MODES = new Set<RenderMode>(['email', 'web', 'document']);

/** Design JSON is what opens the template inside the Unlayer visual builder. */
export async function GET(request: Request, context: { params: Promise<{ key: string }> }): Promise<Response> {
  const { key } = await context.params;
  const entry = entryFor(key);
  if (!entry) return new Response('Unknown template', { status: 404 });

  const requested = new URL(request.url).searchParams.get('mode') as RenderMode | null;
  const mode = requested && MODES.has(requested) && entry.meta.modes.includes(requested) ? requested : 'email';

  return Response.json(designJson(key, entry.sample, mode), {
    headers: { 'content-disposition': `attachment; filename="${key}.${mode}.design.json"` },
  });
}
