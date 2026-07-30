import { recipientEmails, type OutboundMessage, type SendResult, type Transport } from '../types.js';

export interface ConsoleConfig {
  /** Writes the HTML body to this directory for local inspection. */
  outputDir?: string;
  quiet?: boolean;
}

const NAME = 'console';

/**
 * Development default. Nothing leaves the machine, so `bun dev` works with no
 * credentials and no risk of mailing a real address from a seed script.
 */
export function consoleTransport(config: ConsoleConfig = {}): Transport & { sent: OutboundMessage[] } {
  const sent: OutboundMessage[] = [];
  let counter = 0;

  return {
    name: NAME,
    sent,
    async send(message: OutboundMessage): Promise<SendResult> {
      counter += 1;
      sent.push(message);
      const messageId = `console-${counter}`;

      if (config.outputDir) {
        const { mkdir, writeFile } = await import('node:fs/promises');
        const { join } = await import('node:path');
        await mkdir(config.outputDir, { recursive: true });
        const stem = join(config.outputDir, `${String(counter).padStart(3, '0')}-${slug(message.subject)}`);
        await writeFile(`${stem}.html`, message.html, 'utf8');
        await writeFile(`${stem}.txt`, message.text, 'utf8');
      }

      if (!config.quiet) {
        const to = message.to.map((a) => a.email).join(', ');
        console.info(`[console-transport] ${messageId} to ${to} :: ${message.subject}`);
      }

      return {
        transport: NAME,
        messageId,
        accepted: recipientEmails(message),
        rejected: [],
        deduped: false,
      };
    },
    async verify(): Promise<void> {},
  };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}
