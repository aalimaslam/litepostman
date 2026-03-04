export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface KeyValuePair {
  key: string
  value: string
  enabled: boolean
}

export interface ApiRequest {
  id: string
  name: string
  method: HttpMethod
  url: string
  headers: KeyValuePair[]
  params: KeyValuePair[]
  body: string
  bodyType: 'none' | 'json' | 'form' | 'raw'
  collectionId: string | null
  createdAt: number
  updatedAt: number
}

export interface Collection {
  id: string
  name: string
  description: string
  requestIds: string[]
  createdAt: number
  updatedAt: number
}

export interface HistoryEntry {
  id: string
  requestId: string | null
  method: HttpMethod
  url: string
  statusCode: number
  responseTime: number
  timestamp: number
}

export interface Environment {
  id: string
  name: string
  variables: KeyValuePair[]
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  activeEnvironmentId: string | null
  maxHistoryEntries: number
}
