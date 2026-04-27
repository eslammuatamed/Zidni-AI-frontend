import { onActivated, onBeforeUnmount, onMounted } from 'vue';

export type VisibilityRefreshReason =
  | 'document-visible'
  | 'window-focus'
  | 'page-show'
  | 'online'
  | 'activated'
  | 'immediate';

export interface UseVisibilityRefreshOptions {
  /**
   * Invokes the callback once after mounting. Useful when a component should
   * rehydrate its data immediately instead of waiting for the first focus
   * event.
   */
  immediate?: boolean;
  /**
   * Whether to invoke the callback when the page becomes visible again.
   * Defaults to true.
   */
  includeDocumentVisibility?: boolean;
  /**
   * Whether to invoke the callback when the window regains focus. Defaults to
   * true.
   */
  includeWindowFocus?: boolean;
  /**
   * Whether to invoke the callback when the browser fires a page-show event,
   * which occurs when navigating back to the tab from history (notably on
   * Safari's back-forward cache). Defaults to true.
   */
  includePageShow?: boolean;
  /**
   * Whether to invoke the callback when the browser regains network
   * connectivity. Defaults to true.
   */
  includeOnline?: boolean;
  /**
   * Whether to invoke the callback when a keep-alive component is activated.
   * Defaults to false.
   */
  includeActivated?: boolean;
  /**
   * Minimum time in milliseconds between successive callback invocations.
   * Defaults to no throttling.
   */
  throttleMs?: number;
}

export function useVisibilityRefresh(
  callback: (reason: VisibilityRefreshReason) => void,
  options: UseVisibilityRefreshOptions = {}
) {
  const {
    immediate = false,
    includeDocumentVisibility = true,
    includeWindowFocus = true,
    includePageShow = true,
    includeOnline = true,
    includeActivated = false,
    throttleMs = 0
  } = options;

  let lastInvocation = 0;
  const invoke = (reason: VisibilityRefreshReason) => {
    const now = Date.now();
    if (throttleMs > 0 && now - lastInvocation < throttleMs) {
      return;
    }
    lastInvocation = now;
    callback(reason);
  };

  const cleanup: Array<() => void> = [];

  onMounted(() => {
    if (immediate) {
      invoke('immediate');
    }

    if (includeDocumentVisibility && typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          invoke('document-visible');
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      cleanup.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
    }

    if (includeWindowFocus && typeof window !== 'undefined') {
      const handleWindowFocus = () => {
        invoke('window-focus');
      };
      window.addEventListener('focus', handleWindowFocus);
      cleanup.push(() => window.removeEventListener('focus', handleWindowFocus));
    }

    if (includePageShow && typeof window !== 'undefined') {
      const handlePageShow = () => {
        // Safari restores pages from the back-forward cache without firing a
        // visibilitychange event, so listen to pageshow as an additional
        // signal to refresh state.
        invoke('page-show');
      };
      window.addEventListener('pageshow', handlePageShow);
      cleanup.push(() => window.removeEventListener('pageshow', handlePageShow));
    }

    if (includeOnline && typeof window !== 'undefined') {
      const handleOnline = () => {
        invoke('online');
      };
      window.addEventListener('online', handleOnline);
      cleanup.push(() => window.removeEventListener('online', handleOnline));
    }
  });

  if (includeActivated) {
    onActivated(() => {
      invoke('activated');
    });
  }

  onBeforeUnmount(() => {
    cleanup.splice(0).forEach((fn) => fn());
  });
}
