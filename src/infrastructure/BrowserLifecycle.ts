export interface BrowserLifecycleHandlers {
  onSuspend(): Promise<void> | void;
  onResume(): void;
}

export class BrowserLifecycle {
  public constructor(private readonly handlers: BrowserLifecycleHandlers) {}

  public start(): void {
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('pagehide', this.onPageHide);
  }

  public stop(): void {
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('pagehide', this.onPageHide);
  }

  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      void this.handlers.onSuspend();
      return;
    }

    if (document.visibilityState === 'visible') {
      this.handlers.onResume();
    }
  };

  private readonly onPageHide = (): void => {
    void this.handlers.onSuspend();
  };
}
