/**
 * Generic localStorage utilities providing type-safe access to persisted data.
 */

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/**
 * Retrieves a parsed value from localStorage.
 * Returns `null` if the key does not exist or the stored value cannot be parsed.
 */
export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Serialises `value` and writes it to localStorage.
 * Returns `true` on success, `false` when storage is unavailable (e.g. quota exceeded).
 */
export function setItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/**
 * Removes a single key from localStorage.
 */
export function removeItem(key: string): void {
  localStorage.removeItem(key)
}

/**
 * Clears **all** entries from localStorage.
 * Use with caution – this removes every key, not just those used by litepostman.
 */
export function clearAll(): void {
  localStorage.clear()
}

/**
 * Returns all keys currently stored in localStorage.
 */
export function getAllKeys(): string[] {
  return Object.keys(localStorage)
}

/**
 * Returns `true` when localStorage is available in the current environment.
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__litepostman_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}
