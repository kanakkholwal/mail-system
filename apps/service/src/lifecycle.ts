export class Lifecycle {
  private inFlight = 0;
  private draining = false;
  private readonly waiters = new Set<() => void>();

  get isDraining(): boolean {
    return this.draining;
  }

  get active(): number {
    return this.inFlight;
  }

  enter(): void {
    this.inFlight += 1;
  }

  exit(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
    if (this.inFlight === 0) {
      for (const waiter of this.waiters) waiter();
      this.waiters.clear();
    }
  }

  /** Readiness starts failing here so a load balancer stops sending new work before the socket closes. */
  beginDrain(): void {
    this.draining = true;
  }

  async waitForIdle(timeoutMs: number): Promise<boolean> {
    if (this.inFlight === 0) return true;
    return new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        this.waiters.delete(done);
        resolve(false);
      }, timeoutMs);
      const done = (): void => {
        clearTimeout(timer);
        resolve(true);
      };
      this.waiters.add(done);
    });
  }
}
