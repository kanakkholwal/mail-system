export interface Address {
  email: string;
  name?: string;
}

export interface Attachment {
  filename: string;
  content: string | Uint8Array;
  contentType?: string;
  /** Set for images referenced as cid: in the HTML body. */
  contentId?: string;
}

export interface OutboundMessage {
  from: Address;
  to: Address[];
  cc?: Address[];
  bcc?: Address[];
  replyTo?: Address;
  subject: string;
  html: string;
  /** Required. Sending without a text part measurably hurts inbox placement. */
  text: string;
  headers?: Record<string, string>;
  attachments?: Attachment[];
  /** Provider-side categorisation. Flattened per provider convention. */
  tags?: Record<string, string>;
  /**
   * Dedupe key. A repeat send with the same key returns the first result
   * instead of delivering twice, which matters when a queue retries.
   */
  idempotencyKey?: string;
}

export interface SendResult {
  transport: string;
  messageId: string;
  accepted: string[];
  rejected: string[];
  /** True when an idempotency hit replayed an earlier result. */
  deduped: boolean;
  raw?: unknown;
}

export interface Transport {
  readonly name: string;
  send(message: OutboundMessage, signal?: AbortSignal): Promise<SendResult>;
  /** Credential and connectivity check for readiness probes. */
  verify?(): Promise<void>;
}

export function formatAddress(address: Address): string {
  if (!address.name) return address.email;
  // A display name containing a comma or quote must be quoted and escaped.
  const escaped = address.name.replace(/(["\\])/g, '\\$1');
  return `"${escaped}" <${address.email}>`;
}

export function formatAddressList(addresses: Address[]): string {
  return addresses.map(formatAddress).join(', ');
}

export function recipientEmails(message: OutboundMessage): string[] {
  return [...message.to, ...(message.cc ?? []), ...(message.bcc ?? [])].map((a) => a.email);
}
