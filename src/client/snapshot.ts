/**
 * Registrant-private snapshot store. 0.1.2-rc.1 removed
 * `@deepseek-ai/dsh-client-runtime` from the web module table; this plugin
 * must not require that package. The slots hook contract is only
 * `getSnapshot` + `subscribe`.
 */

/** Read-only observable used by slot selector hooks. */
export interface ObservableSnapshot<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/** Mutable snapshot used by the settings card controller. */
export interface SnapshotStore<T> extends ObservableSnapshot<T> {
  set(value: T): void
}

/**
 * Create a subscriber-notifying snapshot.
 * @param initial - first `getSnapshot` value.
 */
export function createSnapshotStore<T>(initial: T): SnapshotStore<T> {
  let value = initial
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => value,
    set(next) {
      value = next
      for (const listener of listeners) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}
