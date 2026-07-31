import { describe, expect, it } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { Column, ColumnLayouts, Document, Email, Page, Row, renderToHtml, renderToJson } from '@unlayer/react-elements';
import { AmountBlock, Callout, CodeToken, DataList, LineItems, Meter, StatusBadge } from '../src/kit/tools/index.js';
import { palette, type RenderMode } from '../src/kit/tokens.js';

const MODES: RenderMode[] = ['email', 'web', 'document'];
const ROOTS = { email: Email, web: Page, document: Document } as const;

/**
 * The root wrapper is what sets the mode, so it has to be swapped per mode.
 * Passing `{ mode }` to renderToHtml cannot override a locked <Email>.
 */
function renderTool(item: ReactElement, mode: RenderMode): string {
  const tree = createElement(
    ROOTS[mode],
    { contentWidth: '600px' },
    <Row key="r" layout={ColumnLayouts.OneColumn} padding="0px">
      <Column padding="0px">{item}</Column>
    </Row>,
  );
  return renderToHtml(tree);
}

describe('Meter', () => {
  // The tool's default `color` is an empty string. A `??` fallback accepts it and
  // emits `background-color:` with no value, so the fill silently vanishes.
  it.each(MODES)('%s: renders a visible fill rather than an empty colour', (mode) => {
    const html = renderTool(<Meter percent={84} label="Build minutes" value="8,450 of 10,000" />, mode);
    expect(html).toMatch(/background-color:\s*#[0-9A-Fa-f]{6}/);
    expect(html).not.toMatch(/background-color:\s*[;"']/);
  });

  it.each(MODES)('%s: warning tone above 75 percent', (mode) => {
    expect(renderTool(<Meter percent={84} />, mode)).toContain(palette.warning);
  });

  it.each(MODES)('%s: danger tone at or above 90 percent', (mode) => {
    expect(renderTool(<Meter percent={95} />, mode)).toContain(palette.danger);
  });

  // A bar that is coloured at 20% teaches the reader that colour means nothing.
  it.each(MODES)('%s: stays neutral below the first threshold', (mode) => {
    const html = renderTool(<Meter percent={20} />, mode);
    expect(html).toContain(palette.fillNeutralStrong);
    expect(html).not.toContain(palette.warning);
    expect(html).not.toContain(palette.danger);
  });

  it.each(MODES)('%s: escalates to warning at 75 and danger at 90', (mode) => {
    expect(renderTool(<Meter percent={80} />, mode)).toContain(palette.warning);
    expect(renderTool(<Meter percent={95} />, mode)).toContain(palette.danger);
  });

  it.each(MODES)('%s: honours an explicit colour override', (mode) => {
    expect(renderTool(<Meter percent={50} color="#123456" />, mode)).toContain('#123456');
  });

  it.each(MODES)('%s: clamps a percentage above 100', (mode) => {
    // A bare width regex also catches Elements' own -webkit-text-size-adjust:100%.
    const html = renderTool(<Meter percent={480} />, mode);
    expect(html).not.toContain('480%');
    expect(renderTool(<Meter percent={480} />, mode)).toBe(renderTool(<Meter percent={100} />, mode));
  });

  it('email build uses table cells, since Outlook ignores percentage widths on divs', () => {
    expect(renderTool(<Meter percent={60} />, 'email')).toMatch(/<td[^>]+width="60%"/);
  });

  it('web build exposes progressbar semantics', () => {
    const html = renderTool(<Meter percent={60} />, 'web');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="60"');
  });
});

describe('StatusBadge', () => {
  // Text takes the AA step; the saturated hue stays on the fill and the border.
  it.each(MODES)('%s: uppercases the label and applies the tone', (mode) => {
    const html = renderTool(<StatusBadge tone="danger" text="Payment failed" />, mode);
    expect(html).toContain('PAYMENT FAILED');
    expect(html).toContain(palette.dangerText);
    expect(html).toContain(palette.dangerTint);
  });

  it('email build is a one-cell table so Outlook degrades to a rectangle', () => {
    expect(renderTool(<StatusBadge tone="info" text="New" />, 'email')).toMatch(/<table[^>]+role="presentation"/);
  });

  it.each(MODES)('%s: falls back to neutral for an unknown tone', (mode) => {
    expect(renderTool(<StatusBadge tone="nonsense" text="X" />, mode)).toContain(palette.canvas);
  });
});

describe('CodeToken', () => {
  it.each(MODES)('%s: keeps every character of the grouped code', (mode) => {
    const html = renderTool(<CodeToken code="481902" groupSize={3} />, mode);
    expect(html).toContain('481');
    expect(html).toContain('902');
  });

  // Document mode joins groups with spaces on purpose, so the real invariant is
  // that incoming whitespace is normalised away rather than absent from output.
  it.each(MODES)('%s: normalises whitespace in the supplied code', (mode) => {
    const spaced = renderTool(<CodeToken code="48 19 02" groupSize={2} />, mode);
    const clean = renderTool(<CodeToken code="481902" groupSize={2} />, mode);
    expect(spaced).toBe(clean);
  });
});

describe('DataList', () => {
  it.each(MODES)('%s: emits the rows and escapes hostile values', (mode) => {
    const html = renderTool(
      <DataList rows={[{ key: 'IP', value: '1.2.3.4', mono: true }, { key: 'X', value: '<script>alert(1)</script>' }]} />,
      mode,
    );
    expect(html).toContain('1.2.3.4');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
  });

  it.each(MODES)('%s: renders no table for an empty list', (mode) => {
    expect(renderTool(<DataList rows={[]} />, mode)).not.toContain('role="table"');
  });
});

describe('LineItems', () => {
  const rows = [{ description: 'Retainer', quantity: '1', rate: '£100.00', amount: '£100.00' }];
  const totals = [{ label: 'Total', value: '£100.00', emphasis: true }];

  it.each(MODES)('%s: renders the header, the row and the total', (mode) => {
    const html = renderTool(<LineItems rows={rows} totals={totals} />, mode);
    expect(html).toContain('DESCRIPTION');
    expect(html).toContain('Retainer');
    expect(html).toContain('£100.00');
  });

  it.each(MODES)('%s: fixes the table layout so money columns keep their width', (mode) => {
    expect(renderTool(<LineItems rows={rows} totals={totals} />, mode)).toMatch(/table-layout:\s*fixed/);
  });

  it('marks a credit with a minus sign, not colour alone', () => {
    const html = renderTool(
      <LineItems rows={rows} totals={[{ label: 'Deposit', value: '£50.00', credit: true }]} />,
      'email',
    );
    expect(html).toContain('&minus;');
  });
});

describe('Callout and AmountBlock', () => {
  it.each(MODES)('%s: callout escapes its title but passes authored body HTML', (mode) => {
    const html = renderTool(<Callout tone="warning" title="A & B" body="<em>ok</em>" />, mode);
    expect(html).toContain('A &amp; B');
    expect(html).toContain('<em>ok</em>');
  });

  it.each(MODES)('%s: amount block renders figure, label and meta', (mode) => {
    const html = renderTool(<AmountBlock label="Balance due" amount="£7,861.27" meta="Due 14 Aug" />, mode);
    expect(html).toContain('£7,861.27');
    expect(html).toContain('Balance due');
    expect(html).toContain('Due 14 Aug');
  });
});

describe('design JSON', () => {
  it('emits a custom slug per tool so designs open in the Unlayer builder', () => {
    const tree = (
      <Email contentWidth="600px">
        <Row layout={ColumnLayouts.OneColumn} padding="0px">
          <Column padding="0px">
            <Meter percent={50} />
            <StatusBadge tone="info" text="X" />
            <CodeToken code="1234" />
          </Column>
        </Row>
      </Email>
    );
    const slugs = renderToJson(tree)
      .body.rows.flatMap((row) => row.columns.flatMap((col) => col.contents))
      .map((content) => content.slug);
    expect(slugs).toEqual(['bm-meter', 'bm-status-badge', 'bm-code-token']);
  });
});
