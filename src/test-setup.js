import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Make @testing-library/react's fake-timer detection work with Vitest.
// The library checks `typeof jest !== 'undefined'` and calls `jest.advanceTimersByTime(0)`
// to drain the microtask queue when fake timers are active. Without this shim,
// waitFor() times out whenever vi.useFakeTimers() is in use.
if (typeof globalThis.jest === 'undefined') {
  globalThis.jest = {
    advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms),
  }
}
