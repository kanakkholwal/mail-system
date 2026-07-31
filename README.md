# better-mailer

Twenty-one transactional email templates built with [Unlayer Elements](https://unlayer.com/), plus a studio for reviewing them. One React tree per template renders three ways: email HTML, a hosted web page, and a print-ready A4 document.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is here

```
packages/emails/     the template catalogue, design kit and render pipeline
apps/studio/         Next.js gallery and payload workbench
```

There is no mail-sending service. `renderTemplate()` returns HTML and a text/plain
part; handing those to a provider is the caller's job, and deliberately out of scope.

## Quick start

```bash
bun install
bun run dev          # studio on http://localhost:3000
```

No environment variables. Nothing to configure.

Other scripts:

```bash
bun run verify       # build packages, typecheck, test
bun run render       # write every template to packages/emails/dist-preview
bun run build        # production build of the studio
```

## The design system

Three families, chosen by what a message *is* rather than by which product sent it.

| Family | Genres | Composition |
| --- | --- | --- |
| **Record** | auth, security | Ink masthead with a classification stamp, one act set large and left, provenance kept as a log, severity carried at the top edge |
| **Ledger** | billing | Document masthead, the figure as the subject of the page, statement-style sections |
| **Editorial** | activation, engagement, collaboration, commerce | Kicker, hero headline, pull quotes and stat rows |

Foundations live in [`packages/emails/src/kit/tokens.ts`](packages/emails/src/kit/tokens.ts):
a five-step neutral ramp (each step a measured contrast ratio, not an alias), warm
paper grounds, and a single signal accent that is only ever a fill — it is 1.3:1 as
text on white, so body links are ink and underlined instead.

### Constraints the kit encodes

- **600px**, the widest an email renders before the Outlook reading pane clips it.
- **No custom properties, no `oklch`, no `@font-face`.** Outlook drops the first two; every client strips the third. Tokens resolve to sRGB hex once.
- **No border-radius on structural blocks.** Outlook ignores it, and a rounded card inside a band leaves the fill showing around it.
- **Tone is a keyline, never an icon.** Icon fonts and SVG both fail in Outlook, and an image would be blocked.
- **Dark mode is a designed second half, not an inversion.** Ink slabs opt out of the flip entirely.

## Rendering

```ts
import { getTemplate, renderTemplate } from '@better-mailer/emails';

const template = getTemplate('magic_link');
const { html, text, subject, design } = renderTemplate(template, payload, {
  mode: 'email',   // 'email' | 'web' | 'document'
  theme: 'auto',   // 'auto' | 'light' | 'dark'
});
```

`theme: 'auto'` emits the `prefers-color-scheme` block, which is what an inbox
gets. `light` and `dark` pin the render — an iframe inherits the colour scheme from
the OS, so forcing it at render time is the only way to review the half your machine
is not currently set to. The studio's Auto/Light/Dark control does exactly this.

`design` is Unlayer Design JSON, so any template opens in the visual builder.

Rendering refuses rather than guesses: an invalid payload throws
`TemplateValidationError` with per-field issues, and an unsupported mode or a
marketing template missing `legal.unsubscribeUrl` throws `RenderRuleError`.

## The catalogue

| Genre | Templates |
| --- | --- |
| auth | welcome & verify, reset password, magic link, one-time passcode |
| security | new device sign-in, password changed |
| billing | invoice issued, payment receipt, payment failed, subscription cancelled, card expiring |
| activation | trial ending, usage limit |
| engagement | winback, referral invite, weekly digest |
| collaboration | team invite, mention notification |
| commerce | order confirmed, shipping update, abandoned cart |

Invoices, receipts and order confirmations also render as A4 documents.

## Adding a template

Create `packages/emails/src/templates/<name>/` with a `schema.ts` and an `index.tsx`:

```tsx
export default defineTemplate<MyProps>({
  meta: { key: 'my_template', name: '…', genre: 'auth', description: '…',
          modes: ['email'], primaryAction: 'Do the thing', requiresUnsubscribe: false },
  schema: myTemplateSchema,
  sample: { ...demoBase, /* a realistic payload */ },
  subject: (props) => `…`,
  build: (props, ctx) => [...recordMasthead(ctx, { stamp: '…' }), /* rows */ ...footer(ctx)],
});
```

Register it in [`registry.ts`](packages/emails/src/registry.ts). The key is the stable
public identifier and never changes; `name` can.

Every template is then covered automatically by the suite in `packages/emails/tests/`
— 640 assertions across alt text, contrast, preheader length, plain-text parts,
single-CTA discipline and Gmail's clip threshold.

## Licence

MIT
