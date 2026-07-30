import { z } from 'zod';
import { render } from '@/lib/catalogue';

const requestSchema = z.object({
  key: z.string().min(1),
  mode: z.enum(['email', 'web', 'document']).default('email'),
  payload: z.unknown(),
});

export async function POST(request: Request): Promise<Response> {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Expected { key, mode, payload }.' }, { status: 400 });
  }

  const { key, mode, payload } = parsed.data;
  return Response.json(render(key, payload, mode), { headers: { 'cache-control': 'no-store' } });
}
