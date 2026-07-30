export class QueueFullError extends Error {
  constructor(readonly queued: number) {
    super(`Send queue is full (${queued} waiting)`);
    this.name = 'QueueFullError';
  }
}

/**
 * Caps simultaneous provider calls and sheds load past the queue bound, so a
 * burst returns 503 quickly instead of piling up sockets and timing out.
 */
export class Semaphore {
  private active = 0;
  private readonly waiting: Array<(release: () => void) => void> = [];

  constructor(
    private readonly limit: number,
    private readonly queueMax: number,
  ) {}

  get depth(): number {
    return this.waiting.length;
  }

  get inUse(): number {
    return this.active;
  }

  acquire(): Promise<() => void> {
    if (this.active < this.limit) {
      this.active += 1;
      return Promise.resolve(this.releaser());
    }
    if (this.waiting.length >= this.queueMax) {
      return Promise.reject(new QueueFullError(this.waiting.length));
    }
    return new Promise<() => void>((resolve) => this.waiting.push(resolve));
  }

  private releaser(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.waiting.shift();
      if (next) {
        next(this.releaser());
        return;
      }
      this.active -= 1;
    };
  }
}
