import { readFailure, type ReadFailure } from "./catalogue.ts";

type State<T> = {
  status: "idle" | "loading" | "ready" | "failed";
  data: T | null;
  failure: ReadFailure | null;
};

/** One controller per identity/store/account. No persisted financial cache. */
export function createScopedRead<T>(read: (signal: AbortSignal) => Promise<T>) {
  let state: State<T> = { status: "idle", data: null, failure: null };
  let generation = 0;
  let controller: AbortController | null = null;
  const listeners = new Set<() => void>();
  function publish(next: State<T>) {
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
            failure: readFailure(error),
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
