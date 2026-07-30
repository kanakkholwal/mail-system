import type { RenderMode } from '@better-mailer/emails';
import { entryFor, render } from '@/lib/catalogue';

const MODES = new Set<RenderMode>(['email', 'web', 'document']);

/** Serves each gallery thumbnail on demand, so 21 previews cost nothing until scrolled to. */
export async function GET(request: Request, context: { params: Promise<{ key: string }> }): Promise<Response> {
  const { key } = await context.params;
  const entry = entryFor(key);
  if (!entry) return new Response('Unknown template', { status: 404 });

  const requested = new URL(request.url).searchParams.get('mode') as RenderMode | null;
  const mode = requested && MODES.has(requested) ? requested : 'email';
  if (!entry.meta.modes.includes(mode)) return new Response('Mode not supported', { status: 400 });

  const result = render(key, entry.sample, mode);
  if (!result.ok) return new Response(result.message ?? 'Render failed', { status: 500 });

  return new Response(result.html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'x-content-type-options': 'nosniff',
      'cache-control': 'public, max-age=300',
    },
  });
}
