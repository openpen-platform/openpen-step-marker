/**
 * Runs async writes one after another. The host merges each settings patch
 * into a cache that only updates after the previous write finishes, so two
 * quick changes (a swatch, then the slider) could otherwise send the second
 * patch on top of stale values and lose the first.
 */
export function createSerialQueue(): <T>(task: () => Promise<T>) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve()
  return (task) => {
    const run = tail.then(task, task)
    tail = run.catch(() => undefined)
    return run
  }
}
