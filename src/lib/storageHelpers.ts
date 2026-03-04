import { getItem, setItem, removeItem } from './storage'
import type {
  ApiRequest,
  Collection,
  HistoryEntry,
  Environment,
  AppSettings,
} from '@/types'

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  REQUESTS: 'litepostman:requests',
  COLLECTIONS: 'litepostman:collections',
  HISTORY: 'litepostman:history',
  ENVIRONMENTS: 'litepostman:environments',
  SETTINGS: 'litepostman:settings',
} as const

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  activeEnvironmentId: null,
  maxHistoryEntries: 100,
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export function getRequests(): ApiRequest[] {
  return getItem<ApiRequest[]>(STORAGE_KEYS.REQUESTS) ?? []
}

export function getRequestById(id: string): ApiRequest | undefined {
  return getRequests().find((r) => r.id === id)
}

export function saveRequest(request: ApiRequest): boolean {
  const requests = getRequests()
  const index = requests.findIndex((r) => r.id === request.id)
  if (index >= 0) {
    requests[index] = { ...request, updatedAt: Date.now() }
  } else {
    requests.push(request)
  }
  return setItem(STORAGE_KEYS.REQUESTS, requests)
}

export function deleteRequest(id: string): boolean {
  const requests = getRequests().filter((r) => r.id !== id)
  return setItem(STORAGE_KEYS.REQUESTS, requests)
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export function getCollections(): Collection[] {
  return getItem<Collection[]>(STORAGE_KEYS.COLLECTIONS) ?? []
}

export function getCollectionById(id: string): Collection | undefined {
  return getCollections().find((c) => c.id === id)
}

export function saveCollection(collection: Collection): boolean {
  const collections = getCollections()
  const index = collections.findIndex((c) => c.id === collection.id)
  if (index >= 0) {
    collections[index] = { ...collection, updatedAt: Date.now() }
  } else {
    collections.push(collection)
  }
  return setItem(STORAGE_KEYS.COLLECTIONS, collections)
}

export function deleteCollection(id: string): boolean {
  const collections = getCollections().filter((c) => c.id !== id)
  return setItem(STORAGE_KEYS.COLLECTIONS, collections)
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export function getHistory(): HistoryEntry[] {
  return getItem<HistoryEntry[]>(STORAGE_KEYS.HISTORY) ?? []
}

export function addHistoryEntry(entry: HistoryEntry): boolean {
  const settings = getSettings()
  const history = [entry, ...getHistory()].slice(0, settings.maxHistoryEntries)
  return setItem(STORAGE_KEYS.HISTORY, history)
}

export function clearHistory(): boolean {
  return setItem(STORAGE_KEYS.HISTORY, [])
}

export function deleteHistoryEntry(id: string): boolean {
  const history = getHistory().filter((h) => h.id !== id)
  return setItem(STORAGE_KEYS.HISTORY, history)
}

// ---------------------------------------------------------------------------
// Environments
// ---------------------------------------------------------------------------

export function getEnvironments(): Environment[] {
  return getItem<Environment[]>(STORAGE_KEYS.ENVIRONMENTS) ?? []
}

export function getActiveEnvironment(): Environment | undefined {
  const { activeEnvironmentId } = getSettings()
  if (!activeEnvironmentId) return undefined
  return getEnvironments().find((e) => e.id === activeEnvironmentId)
}

export function saveEnvironment(environment: Environment): boolean {
  const environments = getEnvironments()
  const index = environments.findIndex((e) => e.id === environment.id)
  if (index >= 0) {
    environments[index] = { ...environment, updatedAt: Date.now() }
  } else {
    environments.push(environment)
  }
  return setItem(STORAGE_KEYS.ENVIRONMENTS, environments)
}

export function deleteEnvironment(id: string): boolean {
  const environments = getEnvironments().filter((e) => e.id !== id)
  return setItem(STORAGE_KEYS.ENVIRONMENTS, environments)
}

export function setActiveEnvironment(id: string | null): boolean {
  return saveSettings({ ...getSettings(), activeEnvironmentId: id })
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSettings(): AppSettings {
  return getItem<AppSettings>(STORAGE_KEYS.SETTINGS) ?? { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: AppSettings): boolean {
  return setItem(STORAGE_KEYS.SETTINGS, settings)
}

export function resetSettings(): boolean {
  return setItem(STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS })
}

// ---------------------------------------------------------------------------
// Bulk / export helpers
// ---------------------------------------------------------------------------

/** Exports all litepostman data as a plain object (for backup / import). */
export function exportData() {
  return {
    requests: getRequests(),
    collections: getCollections(),
    history: getHistory(),
    environments: getEnvironments(),
    settings: getSettings(),
  }
}

/** Replaces all stored data with the provided payload. */
export function importData(data: ReturnType<typeof exportData>): boolean {
  return (
    setItem(STORAGE_KEYS.REQUESTS, data.requests) &&
    setItem(STORAGE_KEYS.COLLECTIONS, data.collections) &&
    setItem(STORAGE_KEYS.HISTORY, data.history) &&
    setItem(STORAGE_KEYS.ENVIRONMENTS, data.environments) &&
    setItem(STORAGE_KEYS.SETTINGS, data.settings)
  )
}

/** Removes **all** litepostman-namespaced keys from localStorage. */
export function clearAppData(): void {
  Object.values(STORAGE_KEYS).forEach(removeItem)
}
