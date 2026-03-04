import { useState } from 'react'
import { Send, Trash2, History, FolderOpen, Plus, X, Save } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  getHistory,
  clearHistory,
  getCollections,
  saveRequest,
  saveCollection,
  addHistoryEntry,
  getRequests,
} from '@/lib/storageHelpers'
import type { HttpMethod, HistoryEntry, Collection, KeyValuePair, ApiRequest } from '@/types'
import { cn } from '@/lib/utils'

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

function KVEditor({
  items,
  onChange,
}: {
  items: KeyValuePair[]
  onChange: (items: KeyValuePair[]) => void
}) {
  const handleUpdate = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }

    // If last item is changed, add a new empty row
    if (index === items.length - 1 && (field === 'key' || field === 'value') && value !== '') {
      newItems.push({ key: '', value: '', enabled: true })
    }

    onChange(newItems)
  }

  const handleRemove = (index: number) => {
    if (items.length === 1) {
      onChange([{ key: '', value: '', enabled: true }])
      return
    }
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems)
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={item.enabled}
            onChange={(e) => handleUpdate(index, 'enabled', e.target.checked)}
            className="h-4 w-4"
          />
          <Input
            placeholder="Key"
            value={item.key}
            onChange={(e) => handleUpdate(index, 'key', e.target.value)}
            className="flex-1 h-8 text-xs"
          />
          <Input
            placeholder="Value"
            value={item.value}
            onChange={(e) => handleUpdate(index, 'value', e.target.value)}
            className="flex-1 h-8 text-xs"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleRemove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [url, setUrl] = useState('')
  const [params, setParams] = useState<KeyValuePair[]>([{ key: '', value: '', enabled: true }])
  const [headers, setHeaders] = useState<KeyValuePair[]>([{ key: '', value: '', enabled: true }])
  const [body, setBody] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory())
  const [collections, setCollections] = useState<Collection[]>(() => getCollections())
  const [requests, setRequests] = useState<ApiRequest[]>(() => getRequests())
  const [newCollectionName, setNewCollectionName] = useState('')
  const [isNewCollectionDialogOpen, setIsNewCollectionDialogOpen] = useState(false)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveRequestName, setSaveRequestName] = useState('')
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('none')

  const [response, setResponse] = useState<{
    status: number
    statusText: string
    time: number
    size: string
    body: string
    headers: Record<string, string>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClearHistory = () => {
    clearHistory()
    setHistory([])
  }

  const handleSaveRequest = () => {
    if (!saveRequestName.trim()) return

    const newRequest: ApiRequest = {
      id: Math.random().toString(36).substring(7),
      name: saveRequestName,
      method,
      url,
      headers: headers.filter((h) => h.key),
      params: params.filter((p) => p.key),
      body,
      bodyType: 'raw',
      collectionId: selectedCollectionId === 'none' ? null : selectedCollectionId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    saveRequest(newRequest)

    if (newRequest.collectionId) {
      const collection = getCollections().find((c) => c.id === newRequest.collectionId)
      if (collection) {
        collection.requestIds.push(newRequest.id)
        saveCollection(collection)
      }
    }

    setRequests(getRequests())
    setCollections(getCollections())
    setIsSaveDialogOpen(false)
    setSaveRequestName('')
  }

  const loadRequest = (req: Partial<ApiRequest>) => {
    if (req.method) setMethod(req.method)
    if (req.url) setUrl(req.url)
    if (req.params) {
      setParams(
        req.params.length > 0 ? [...req.params, { key: '', value: '', enabled: true }] : [{ key: '', value: '', enabled: true }]
      )
    } else {
      setParams([{ key: '', value: '', enabled: true }])
    }
    if (req.headers) {
      setHeaders(
        req.headers.length > 0 ? [...req.headers, { key: '', value: '', enabled: true }] : [{ key: '', value: '', enabled: true }]
      )
    } else {
      setHeaders([{ key: '', value: '', enabled: true }])
    }
    if (req.body !== undefined) setBody(req.body)
    setResponse(null)
  }

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return

    const collection: Collection = {
      id: Math.random().toString(36).substring(7),
      name: newCollectionName,
      description: '',
      requestIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    saveCollection(collection)
    setCollections(getCollections())
    setNewCollectionName('')
    setIsNewCollectionDialogOpen(false)
  }

  const handleSend = async () => {
    if (!url.trim()) return

    setIsLoading(true)
    setResponse(null)
    const startTime = Date.now()

    try {
      // Build URL with params
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      params.forEach((p) => {
        if (p.enabled && p.key) {
          urlObj.searchParams.append(p.key, p.value)
        }
      })

      // Build headers
      const headersObj: Record<string, string> = {}
      headers.forEach((h) => {
        if (h.enabled && h.key) {
          headersObj[h.key] = h.value
        }
      })

      const fetchOptions: RequestInit = {
        method,
        headers: headersObj,
      }

      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        fetchOptions.body = body
      }

      const res = await fetch(urlObj.toString(), fetchOptions)
      const endTime = Date.now()
      const responseBody = await res.text()

      const historyEntry: HistoryEntry = {
        id: Math.random().toString(36).substring(7),
        requestId: null,
        method,
        url: urlObj.toString(),
        statusCode: res.status,
        responseTime: endTime - startTime,
        timestamp: Date.now(),
      }

      addHistoryEntry(historyEntry)
      setHistory(getHistory())

      let formattedBody = responseBody
      try {
        formattedBody = JSON.stringify(JSON.parse(responseBody), null, 2)
      } catch {
        // Not JSON, keep as is
      }

      const responseHeaders: Record<string, string> = {}
      res.headers.forEach((v, k) => {
        responseHeaders[k] = v
      })

      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: endTime - startTime,
        size: `${(responseBody.length / 1024).toFixed(2)} KB`,
        body: formattedBody,
        headers: responseHeaders,
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setResponse({
        status: 0,
        statusText: 'Error',
        time: Date.now() - startTime,
        size: '0 KB',
        body: errorMessage || 'Failed to fetch',
        headers: {},
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">
          <span className="text-primary">lite</span>post
        </h1>
        <Badge variant="secondary">v0.1.0</Badge>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <aside className="w-64 border-r flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              Collections
            </div>
            <Dialog open={isNewCollectionDialogOpen} onOpenChange={setIsNewCollectionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Collection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Collection Name</Label>
                    <Input
                      id="name"
                      placeholder="My Collection"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewCollectionDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim()}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto p-2">
            {collections.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">No collections yet.</p>
            ) : (
              collections.map((c) => (
                <div key={c.id} className="mb-1">
                  <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {c.name}
                  </div>
                  <div className="ml-2 border-l pl-2">
                    {requests
                      .filter((r) => r.collectionId === c.id)
                      .map((r) => (
                        <div
                          key={r.id}
                          className="px-2 py-1.5 rounded-md text-xs hover:bg-accent cursor-pointer flex items-center gap-2"
                          onClick={() => loadRequest(r)}
                        >
                          <span
                            className={`font-bold text-[10px] ${METHOD_COLORS[r.method] ?? ''} rounded px-1`}
                          >
                            {r.method}
                          </span>
                          <span className="truncate">{r.name}</span>
                        </div>
                      ))}
                  </div>
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
                  onClick={() =>
                    loadRequest({
                      method: entry.method,
                      url: entry.url,
                    })
                  }
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
            <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="req-name">Request Name</Label>
                    <Input
                      id="req-name"
                      placeholder="My Awesome API"
                      value={saveRequestName}
                      onChange={(e) => setSaveRequestName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="collection">Collection</Label>
                    <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {collections.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRequest} disabled={!saveRequestName.trim()}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button disabled={!url.trim() || isLoading} onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          <div className="px-4 pb-4 flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="params" className="flex-1 flex flex-col">
              <TabsList className="justify-start h-9 bg-transparent border-b rounded-none px-0 gap-4">
                <TabsTrigger
                  value="params"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 h-9"
                >
                  Params
                </TabsTrigger>
                <TabsTrigger
                  value="headers"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 h-9"
                >
                  Headers
                </TabsTrigger>
                <TabsTrigger
                  value="body"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 h-9"
                >
                  Body
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-auto py-4">
                <TabsContent value="params" className="mt-0 outline-none">
                  <KVEditor items={params} onChange={setParams} />
                </TabsContent>
                <TabsContent value="headers" className="mt-0 outline-none">
                  <KVEditor items={headers} onChange={setHeaders} />
                </TabsContent>
                <TabsContent value="body" className="mt-0 outline-none">
                  <Textarea
                    placeholder='{"key": "value"}'
                    className="font-mono min-h-[200px]"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <Separator className="my-4" />

            {/* Response Area */}
            <div className="flex-1 min-h-0 flex flex-col">
              {!response && !isLoading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground italic text-sm">
                  Click Send to see the response
                </div>
              ) : isLoading ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground italic text-sm">
                  Loading...
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center gap-4 mb-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={cn(
                          'font-bold',
                          response!.status >= 200 && response!.status < 300
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        )}
                      >
                        {response!.status} {response!.statusText}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{response!.time} ms</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">{response!.size}</span>
                    </div>
                  </div>
                  <ScrollArea className="flex-1 border rounded-md bg-slate-950 text-slate-50 p-4 font-mono text-xs">
                    <pre>{response!.body}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>

          {/* Welcome card (hidden when response or input exists) */}
          {!url && !response && (
            <div className="flex-1 flex items-center justify-center p-8">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle>Welcome to litepost 🚀</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    Enter a URL above and press <strong>Send</strong> to make an API request.
                  </p>
                  <p>
                    Your request history and collections are persisted in{' '}
                    <code className="bg-muted px-1 rounded text-xs">localStorage</code>.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
