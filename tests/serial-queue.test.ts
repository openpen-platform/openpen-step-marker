import { describe, expect, it } from 'vitest'
import { createSerialQueue } from '../src/serial-queue'

describe('createSerialQueue', () => {
  it('starts a write only after the previous one has finished, in call order', async () => {
    const enqueue = createSerialQueue()
    const events: string[] = []
    let releaseFirst!: () => void
    const first = enqueue(
      () => new Promise<void>((res) => { events.push('first:start'); releaseFirst = () => { events.push('first:end'); res() } }),
    )
    const second = enqueue(async () => { events.push('second:start') })
    await Promise.resolve()
    expect(events).toEqual(['first:start'])
    releaseFirst()
    await Promise.all([first, second])
    expect(events).toEqual(['first:start', 'first:end', 'second:start'])
  })

  it('keeps running later writes after one fails', async () => {
    const enqueue = createSerialQueue()
    const failed = enqueue(async () => { throw new Error('boom') })
    const ok = enqueue(async () => 'ok')
    await expect(failed).rejects.toThrow('boom')
    await expect(ok).resolves.toBe('ok')
  })
})
