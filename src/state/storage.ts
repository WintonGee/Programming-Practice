/** localStorage access that never throws: private mode, quota and disabled storage all degrade to no-ops. */
export const safeStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  /** Returns false when the value could not be persisted (storage full or unavailable). */
  setItem(key: string, value: string): boolean {
    try {
      window.localStorage.setItem(key, value)
      return true
    } catch {
      return false
    }
  },
}
