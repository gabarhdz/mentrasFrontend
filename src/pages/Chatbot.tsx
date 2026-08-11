import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Bot, LoaderCircle, MessageCircle, Plus, Send, Trash2, UserRound } from 'lucide-react'

import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'
import { authFetch, clearAuthTokens, getStoredUserId, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

type ChatConversation = {
  id: string
  title: string
  updatedAt: string
  messages: ChatMessage[]
}

const storageKey = (userId: string) => `mentras.chatbot.history.${userId}`

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const createConversation = (): ChatConversation => ({
  id: createId(),
  title: 'Nueva conversación',
  updatedAt: new Date().toISOString(),
  messages: [{
    id: createId(),
    role: 'assistant',
    content: 'Hola. Soy el asistente empresarial de Mentras. Puedo ayudarte con emprendimiento, administración, finanzas, marketing, ventas, operaciones e inventario.',
    createdAt: new Date().toISOString(),
  }],
})

const readConversations = (userId: string | null) => {
  if (!userId) return []
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is ChatConversation => Boolean(entry && typeof entry.id === 'string' && Array.isArray(entry.messages)))
  } catch {
    return []
  }
}

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (typeof data.error === 'string') return data.error
    if (Array.isArray(data.message) && typeof data.message[0] === 'string') return data.message[0]
    if (typeof data.message === 'string') return data.message
  } catch {
    // The API may return an empty body for some errors.
  }
  return fallback
}

export default function Chatbot() {
  const userId = getStoredUserId()
  const [conversations, setConversations] = useState<ChatConversation[]>(() => readConversations(userId))
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => readConversations(userId)[0]?.id ?? null)
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  )

  useEffect(() => {
    if (userId) localStorage.setItem(storageKey(userId), JSON.stringify(conversations))
  }, [conversations, userId])

  const ensureConversation = () => {
    if (activeConversation) return activeConversation
    const conversation = createConversation()
    setConversations((current) => [conversation, ...current])
    setActiveConversationId(conversation.id)
    return conversation
  }

  const handleNewConversation = () => {
    const conversation = createConversation()
    setConversations((current) => [conversation, ...current])
    setActiveConversationId(conversation.id)
    setErrorMessage(null)
  }

  const handleDeleteConversation = (conversationId: string) => {
    setConversations((current) => {
      const remaining = current.filter((conversation) => conversation.id !== conversationId)
      if (conversationId === activeConversationId) {
        setActiveConversationId(remaining[0]?.id ?? null)
      }
      return remaining
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message || isSending) return
    if (!hasStoredSession()) {
      setErrorMessage('Inicia sesión para conversar con el asistente.')
      return
    }

    const conversation = ensureConversation()
    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    }
    setDraft('')
    setErrorMessage(null)
    setConversations((current) => current.map((entry) => entry.id === conversation.id
      ? {
          ...entry,
          title: entry.title === 'Nueva conversación' ? message.slice(0, 42) : entry.title,
          updatedAt: userMessage.createdAt,
          messages: [...entry.messages, userMessage],
        }
      : entry,
    ))
    setIsSending(true)

    try {
      const response = await authFetch(buildBackendUrl('/api/chatbot/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: conversation.messages.slice(-10).map(({ role, content }) => ({ role, content })),
        }),
      })
      if (!response.ok) {
        if (response.status === 401) {
          clearAuthTokens()
          throw new Error('Tu sesión venció. Inicia sesión de nuevo para continuar.')
        }
        throw new Error(await getErrorMessage(response, 'El asistente no pudo responder ahora.'))
      }
      const data = await response.json() as { reply?: unknown }
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('El asistente devolvió una respuesta vacía.')
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: data.reply,
        createdAt: new Date().toISOString(),
      }
      setConversations((current) => current.map((entry) => entry.id === conversation.id
        ? { ...entry, updatedAt: assistantMessage.createdAt, messages: [...entry.messages, assistantMessage] }
        : entry,
      ))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'El asistente no pudo responder ahora.')
    } finally {
      setIsSending(false)
    }
  }

  if (!hasStoredSession()) {
    return <div className="flex min-h-screen flex-col"><Header /><main className="flex flex-1 items-center justify-center px-6 py-20"><div className="max-w-lg rounded-3xl border border-border/70 bg-card p-8 text-center shadow-sm"><Bot className="mx-auto size-10 text-primary" /><h1 className="mt-4 text-2xl font-semibold">Asistente de Mentras</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Inicia sesión para resolver dudas y conservar tus conversaciones anteriores.</p></div></main><Footer /></div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 px-4 py-6 sm:px-6 lg:px-10">
        <section className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-7xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 shadow-sm backdrop-blur">
          <aside className="hidden w-80 shrink-0 border-r border-border/70 bg-background/60 p-4 md:flex md:flex-col">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Mentras AI</p><h1 className="mt-1 text-xl font-semibold">Tus conversaciones</h1></div><button type="button" onClick={handleNewConversation} className="rounded-xl bg-primary p-2 text-primary-foreground hover:opacity-90" aria-label="Nueva conversación"><Plus className="size-4" /></button></div>
            <button type="button" onClick={handleNewConversation} className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/15"><Plus className="size-4" /> Nueva conversación</button>
            <div className="mt-5 flex-1 space-y-2 overflow-y-auto">{conversations.length === 0 ? <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs leading-5 text-muted-foreground">Tus conversaciones aparecerán aquí.</p> : conversations.map((conversation) => <div key={conversation.id} className={`group flex items-center gap-1 rounded-xl ${conversation.id === activeConversationId ? 'bg-primary/10' : 'hover:bg-muted'}`}><button type="button" onClick={() => setActiveConversationId(conversation.id)} className="min-w-0 flex-1 px-3 py-3 text-left"><span className="block truncate text-sm font-medium">{conversation.title}</span><span className="mt-1 block text-xs text-muted-foreground">{conversation.messages.filter((message) => message.role === 'user').length} preguntas</span></button><button type="button" onClick={() => handleDeleteConversation(conversation.id)} className="mr-2 rounded-lg p-2 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive" aria-label={`Eliminar ${conversation.title}`}><Trash2 className="size-4" /></button></div>)}</div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageCircle className="size-5" /></span><div><p className="text-sm font-semibold">{activeConversation?.title ?? 'Asistente empresarial'}</p><p className="text-xs text-muted-foreground">Preguntas claras para decisiones más seguras</p></div></div><button type="button" onClick={handleNewConversation} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-muted md:hidden"><Plus className="size-4" /> Nuevo</button></header>
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-7">{!activeConversation ? <div className="flex h-full min-h-96 flex-col items-center justify-center text-center"><Bot className="size-12 text-primary" /><h2 className="mt-4 text-2xl font-semibold">¿Qué necesitas resolver?</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Consulta sobre gestión, ventas, inventario, marketing, finanzas o productividad.</p><button type="button" onClick={handleNewConversation} className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">Empezar conversación</button></div> : activeConversation.messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`flex max-w-[85%] gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}><span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-foreground text-background' : 'bg-primary/10 text-primary'}`}>{message.role === 'user' ? <UserRound className="size-4" /> : <Bot className="size-4" />}</span><div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-tr-md bg-primary text-primary-foreground' : 'rounded-tl-md border border-border/70 bg-background'}`}><p className="whitespace-pre-wrap">{message.content}</p></div></div></div>)}</div>
            {errorMessage ? <div className="mx-5 mb-3 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm sm:mx-7">{errorMessage}</div> : null}
            <form onSubmit={handleSubmit} className="border-t border-border/70 p-4 sm:p-6"><div className="flex items-end gap-3 rounded-2xl border border-border bg-background p-2 shadow-sm focus-within:border-primary/50"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} maxLength={2000} rows={1} placeholder="Escribe tu duda…" className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none" disabled={isSending} /><button type="submit" disabled={isSending || !draft.trim()} className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Enviar mensaje">{isSending ? <LoaderCircle className="size-5 animate-spin" /> : <Send className="size-5" />}</button></div><p className="mt-2 text-right text-xs text-muted-foreground">{draft.length}/2000 · Enter para enviar · Shift + Enter para una nueva línea</p></form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
