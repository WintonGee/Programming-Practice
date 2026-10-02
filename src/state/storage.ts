/** localStorage access that never throws: private mode, quota and disabled storage all degrade to no-ops. */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Storage full or unavailable: keep working in memory.
    }
  },
}
