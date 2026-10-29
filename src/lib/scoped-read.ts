import { readFailure, type ReadFailure } from "./catalogue.ts";

type State<T, F> = {
  status: "idle" | "loading" | "ready" | "failed";
  data: T | null;
  failure: F | null;
};

/** One controller per identity/store/account. No persisted financial cache. */
export function createScopedRead<T, F extends string = never>(
  read: (signal: AbortSignal) => Promise<T>,
  classify?: (error: unknown) => F,
) {
  let state: State<T, ReadFailure | F> = {
    status: "idle",
    data: null,
    failure: null,
  };
  let generation = 0;
  let controller: AbortController | null = null;
  const listeners = new Set<() => void>();
  function publish(next: State<T, ReadFailure | F>) {
    state = next;
    listeners.forEach((listener) => listener());
  }
  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async refresh() {
      const request = ++generation;
      controller?.abort();
      const current = new AbortController();
      controller = current;
      publish({ status: "loading", data: null, failure: null });
      try {
        const data = await read(current.signal);
        if (request === generation && !current.signal.aborted)
          publish({ status: "ready", data, failure: null });
      } catch (error) {
        if (request === generation && !current.signal.aborted)
          publish({
            status: "failed",
            data: null,
            failure: classify ? classify(error) : readFailure(error),
          });
      }
    },
    cancel() {
      ++generation;
      controller?.abort();
      controller = null;
      publish({ status: "idle", data: null, failure: null });
    },
  };
}
