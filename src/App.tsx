import { useState } from 'react'
import { Send, Trash2, History, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getHistory, clearHistory, getCollections } from '@/lib/storageHelpers'
import type { HttpMethod, HistoryEntry, Collection } from '@/types'

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-emerald-100 text-emerald-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-amber-100 text-amber-800',
  PATCH: 'bg-purple-100 text-purple-800',
  DELETE: 'bg-red-100 text-red-800',
  HEAD: 'bg-gray-100 text-gray-800',
  OPTIONS: 'bg-gray-100 text-gray-800',
}

export default function App() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())
  const [collections] = useState<Collection[]>(() => getCollections())

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-primary">lite</span>postman
        </h1>
        <Badge variant="secondary">v0.1.0</Badge>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r flex flex-col">
          <div className="p-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            Collections
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto p-2">
            {collections.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No collections yet.</p>
            ) : (
              collections.map((c) => (
                <div
                  key={c.id}
                  className="px-3 py-2 rounded-md text-sm hover:bg-accent cursor-pointer"
                >
                  {c.name}
                </div>
              ))
            )}
          </div>
          <Separator />
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <History className="h-4 w-4" />
              History
            </div>
            {history.length > 0 && (
              <Button variant="ghost" size="icon" onClick={handleClearHistory}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="overflow-y-auto max-h-48 p-2">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No history yet.</p>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="px-3 py-1.5 rounded-md text-xs hover:bg-accent cursor-pointer flex items-center gap-2"
                >
                  <span
                    className={`font-semibold ${METHOD_COLORS[entry.method] ?? ''} rounded px-1`}
                  >
                    {entry.method}
                  </span>
                  <span className="truncate text-muted-foreground">{entry.url}</span>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Request bar */}
          <div className="p-4 flex gap-2">
            <Select value={method} onValueChange={(v) => setMethod(v as HttpMethod)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              className="flex-1"
              placeholder="https://api.example.com/endpoint"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button disabled={!url.trim()}>
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>

          <Separator />

          {/* Welcome card */}
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle>Welcome to litepostman 🚀</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Enter a URL above and press <strong>Send</strong> to make an API request.</p>
                <p>Your request history and collections are persisted in <code className="bg-muted px-1 rounded text-xs">localStorage</code>.</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
