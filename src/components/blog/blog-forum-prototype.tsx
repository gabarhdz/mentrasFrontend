import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { authFetch, getStoredUserId, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'

import { BlogPageHero } from './blog-page-hero'
import { ForumFeed } from './forum-feed'
import { ForumSidebar } from './forum-sidebar'
import type { ForumComposerPayload, ForumImage, ForumPost, ForumRecord } from './blog-types'

type ApiForumRecord = {
  id?: string
  name?: string
  description?: string
  profile_pic?: string
  is_private?: boolean
  created_at?: string
}

type ApiPostUser = {
  id?: string | number
  username?: string
  profile_pic?: string
  is_mod?: boolean
  is_admin?: boolean
  is_mentor?: boolean
  is_pyme_owner?: boolean
}

type ApiPostRecord = {
  id?: string
  title?: string
  text?: string
  images?: string | string[]
  created_at?: string
  forum_id?: string | number | null
  user?: ApiPostUser | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const getResponseErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const data = await response.json()

    if (typeof data.detail === 'string') {
      return data.detail
    }

    if (typeof data.message === 'string') {
      return data.message
    }

    if (typeof data.error === 'string') {
      return data.error
    }

    if (isRecord(data)) {
      const firstEntry = Object.entries(data)[0]

      if (firstEntry) {
        const [, value] = firstEntry

        if (Array.isArray(value) && typeof value[0] === 'string') {
          return value[0]
        }

        if (typeof value === 'string') {
          return value
        }
      }
    }

    return fallbackMessage
  } catch {
    return fallbackMessage
  }
}

const toForumArray = (value: unknown): ApiForumRecord[] =>
  Array.isArray(value) ? (value.filter(isRecord) as ApiForumRecord[]) : []

const toPostArray = (value: unknown): ApiPostRecord[] =>
  Array.isArray(value) ? (value.filter(isRecord) as ApiPostRecord[]) : []

const parseImages = (value: string | string[] | undefined): ForumImage[] => {
  const parsedList =
    Array.isArray(value)
      ? value
      : typeof value === 'string' && value.trim()
        ? (() => {
            try {
              const parsedValue = JSON.parse(value)
              return Array.isArray(parsedValue) ? parsedValue : []
            } catch {
              return []
            }
          })()
        : []

  return parsedList
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, 4)
    .map((src, index) => ({
      id: `${src}-${index}`,
      src,
      alt: `Imagen ${index + 1} de la publicacion`,
    }))
}

const getUserRoleLabel = (user: ApiPostUser | null | undefined) => {
  if (!user) {
    return 'Miembro'
  }

  if (user.is_admin) {
    return 'Administrador'
  }

  if (user.is_mod) {
    return 'Moderador'
  }

  if (user.is_mentor) {
    return 'Mentor'
  }

  if (user.is_pyme_owner) {
    return 'Pyme'
  }

  return 'Miembro'
}

const getInitials = (value: string) =>
  value
    .split(' ')
    .map((segment) => segment.trim()[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

const normalizeForum = (forum: ApiForumRecord, index: number): ForumRecord => ({
  id: typeof forum.id === 'string' ? forum.id : `forum-${index + 1}`,
  name: typeof forum.name === 'string' && forum.name.trim() ? forum.name.trim() : `Foro ${index + 1}`,
  description:
    typeof forum.description === 'string' && forum.description.trim()
      ? forum.description.trim()
      : 'Sin descripcion disponible.',
  profilePic: typeof forum.profile_pic === 'string' ? forum.profile_pic : '',
  isPrivate: Boolean(forum.is_private),
  createdAt: typeof forum.created_at === 'string' ? forum.created_at : '',
})

const normalizePost = (post: ApiPostRecord, index: number): ForumPost => {
  const username =
    typeof post.user?.username === 'string' && post.user.username.trim()
      ? post.user.username.trim()
      : `usuario_${index + 1}`

  return {
    id: typeof post.id === 'string' ? post.id : `post-${index + 1}`,
    title:
      typeof post.title === 'string' && post.title.trim()
        ? post.title.trim()
        : 'Publicacion sin titulo',
    text:
      typeof post.text === 'string' && post.text.trim()
        ? post.text.trim()
        : 'Sin contenido disponible.',
    createdAt: typeof post.created_at === 'string' ? post.created_at : '',
    forumId:
      typeof post.forum_id === 'string'
        ? post.forum_id
        : typeof post.forum_id === 'number'
          ? String(post.forum_id)
          : null,
    images: parseImages(post.images),
    author: {
      id:
        typeof post.user?.id === 'string'
          ? post.user.id
          : typeof post.user?.id === 'number'
            ? String(post.user.id)
            : '',
      username,
      profilePic: typeof post.user?.profile_pic === 'string' ? post.user.profile_pic : '',
      roleLabel: getUserRoleLabel(post.user),
      initials: getInitials(username),
    },
  }
}

const fetchForums = async () => {
  const response = await authFetch(buildBackendUrl('/api/forum/'))

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'No se pudieron cargar los foros.'))
  }

  return toForumArray(await response.json()).map(normalizeForum)
}

const fetchPosts = async () => {
  const response = await authFetch(buildBackendUrl('/api/forum/post/'))

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'No se pudieron cargar las publicaciones.'))
  }

  return toPostArray(await response.json()).map(normalizePost)
}

const createForumPost = async (forumId: string, payload: ForumComposerPayload) => {
  const response = await authFetch(buildBackendUrl('/api/forum/post/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      forum_id: forumId,
      title: payload.title,
      text: payload.text,
      images: JSON.stringify(payload.imageUrls),
    }),
  })

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'No se pudo publicar el post.'))
  }

  const data = (await response.json()) as ApiPostRecord
  return normalizePost({ ...data, forum_id: forumId }, 0)
}

const removeForumPost = async (postId: string) => {
  const response = await authFetch(buildBackendUrl(`/api/forum/post/${postId}/`), {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await getResponseErrorMessage(response, 'No se pudo eliminar la publicacion.'))
  }
}

export function BlogForumPrototype() {
  const userId = getStoredUserId()
  const [searchParams, setSearchParams] = useSearchParams()
  const [forums, setForums] = useState<ForumRecord[]>([])
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [isLoadingForums, setIsLoadingForums] = useState(true)
  const [isLoadingPosts, setIsLoadingPosts] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [composerErrorMessage, setComposerErrorMessage] = useState<string | null>(null)
  const [composerSuccessMessage, setComposerSuccessMessage] = useState<string | null>(null)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const [isDeletingPostId, setIsDeletingPostId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingForums(true)
        setIsLoadingPosts(true)
        setPageError(null)

        const [nextForums, nextPosts] = await Promise.all([fetchForums(), fetchPosts()])

        setForums(nextForums)
        setPosts(nextPosts)
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'No se pudo cargar la seccion de foros.'
        setPageError(message)
      } finally {
        setIsLoadingForums(false)
        setIsLoadingPosts(false)
      }
    }

    void loadData()
  }, [])

  const selectedForumId = searchParams.get('forum')
  const activeForum =
    forums.find((forum) => forum.id === selectedForumId) ??
    (forums.length > 0 ? forums[0] : null)

  useEffect(() => {
    if (!activeForum || selectedForumId === activeForum.id) {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('forum', activeForum.id)
    setSearchParams(nextSearchParams, { replace: true })
  }, [activeForum, searchParams, selectedForumId, setSearchParams])

  const knownForumIds = new Set(forums.map((forum) => forum.id))
  const supportsScopedPosts = posts.some((post) => post.forumId && knownForumIds.has(post.forumId))

  const selectedForumPostCount =
    activeForum && supportsScopedPosts
      ? posts.filter((post) => post.forumId === activeForum.id).length
      : null

  const visiblePosts =
    activeForum && supportsScopedPosts
      ? posts.filter((post) => post.forumId === activeForum.id)
      : posts

  const feedTitle = activeForum
    ? supportsScopedPosts
      ? `Publicaciones en ${activeForum.name}`
      : `Actividad reciente con ${activeForum.name} como contexto activo`
    : 'Actividad reciente de la comunidad'

  const feedDescription = activeForum
    ? supportsScopedPosts
      ? 'Estas publicaciones corresponden al foro que tienes seleccionado en este momento.'
      : 'El formulario queda amarrado al foro activo y el listado mantiene las publicaciones recientes disponibles.'
    : 'Elige un foro desde el directorio para centrar la lectura y la publicacion.'

  const handleSelectForum = (forumId: string) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('forum', forumId)
    setSearchParams(nextSearchParams)
    setComposerErrorMessage(null)
    setComposerSuccessMessage(null)
  }

  const handleSubmitPost = async (payload: ForumComposerPayload) => {
    if (!activeForum) {
      setComposerErrorMessage('Selecciona un foro antes de publicar.')
      return
    }

    if (!hasStoredSession()) {
      setComposerErrorMessage('Necesitas iniciar sesion para publicar.')
      return
    }

    if (!payload.title.trim() || !payload.text.trim()) {
      setComposerErrorMessage('Completa el titulo y el contenido antes de publicar.')
      return
    }

    try {
      setIsSubmittingPost(true)
      setComposerErrorMessage(null)
      setComposerSuccessMessage(null)
      const createdPost = await createForumPost(activeForum.id, payload)
      setPosts((current) => [createdPost, ...current])
      setComposerSuccessMessage(`Tu publicacion ya aparece en ${activeForum.name}.`)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo publicar el post en este momento.'
      setComposerErrorMessage(message)
    } finally {
      setIsSubmittingPost(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      setIsDeletingPostId(postId)
      setComposerErrorMessage(null)
      setComposerSuccessMessage(null)
      await removeForumPost(postId)
      setPosts((current) => current.filter((post) => post.id !== postId))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo eliminar la publicacion.'
      setComposerErrorMessage(message)
    } finally {
      setIsDeletingPostId(null)
    }
  }

  if (pageError && forums.length === 0 && posts.length === 0) {
    return (
      <section className="rounded-[2rem] border border-destructive/20 bg-card p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-destructive">Foros</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          No pudimos cargar esta seccion
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{pageError}</p>
      </section>
    )
  }

  const visualPostCount = posts.filter((post) => post.images.length > 0).length

  return (
    <div className="space-y-8">
      <BlogPageHero
        activeForum={activeForum}
        forumCount={forums.length}
        postCount={posts.length}
        visualPostCount={visualPostCount}
      />

      <section className="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <ForumSidebar
          activeForumId={activeForum?.id ?? null}
          forums={forums}
          selectedForumPostCount={selectedForumPostCount}
          supportsScopedPosts={supportsScopedPosts}
          onSelectForum={handleSelectForum}
        />

        <ForumFeed
          activeForum={activeForum}
          canPublish={hasStoredSession()}
          composerErrorMessage={composerErrorMessage}
          composerSuccessMessage={composerSuccessMessage}
          currentUserId={userId}
          feedDescription={feedDescription}
          feedTitle={feedTitle}
          isDeletingPostId={isDeletingPostId}
          isLoadingPosts={isLoadingPosts || isLoadingForums}
          isSubmittingPost={isSubmittingPost}
          posts={visiblePosts}
          useActiveForumAsCardLabel={supportsScopedPosts}
          onDeletePost={handleDeletePost}
          onSubmitPost={handleSubmitPost}
        />
      </section>
    </div>
  )
}
