import type { ForumComposerPayload, ForumPost, ForumRecord } from './blog-types'
import { ForumComposerCard } from './forum-composer-card'
import { ForumPostCard } from './forum-post-card'

type ForumFeedProps = {
  activeForum: ForumRecord | null
  posts: ForumPost[]
  isLoadingPosts?: boolean
  canPublish?: boolean
  isSubmittingPost?: boolean
  isDeletingPostId?: string | null
  composerErrorMessage?: string | null
  composerSuccessMessage?: string | null
  feedTitle: string
  feedDescription: string
  currentUserId?: string | null
  useActiveForumAsCardLabel?: boolean
  onSubmitPost: (payload: ForumComposerPayload) => Promise<void>
  onDeletePost: (postId: string) => Promise<void>
}

export function ForumFeed({
  activeForum,
  posts,
  isLoadingPosts = false,
  canPublish = false,
  isSubmittingPost = false,
  isDeletingPostId = null,
  composerErrorMessage,
  composerSuccessMessage,
  feedTitle,
  feedDescription,
  currentUserId,
  useActiveForumAsCardLabel = false,
  onSubmitPost,
  onDeletePost,
}: ForumFeedProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">Lectura actual</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{feedTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{feedDescription}</p>
      </section>

      <ForumComposerCard
        activeForum={activeForum}
        disabled={!canPublish}
        errorMessage={composerErrorMessage}
        successMessage={composerSuccessMessage}
        isSubmitting={isSubmittingPost}
        onSubmit={onSubmitPost}
      />

      <div className="space-y-5">
        {isLoadingPosts ? (
          <div className="rounded-[1.75rem] border border-border/70 bg-card/92 p-6 text-sm text-muted-foreground shadow-sm">
            Cargando publicaciones...
          </div>
        ) : null}

        {!isLoadingPosts && posts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-border/80 bg-card/92 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground">Todavia no hay publicaciones para mostrar</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {activeForum
                ? `Puedes abrir la primera conversacion dentro de ${activeForum.name}.`
                : 'Selecciona un foro o espera a que la comunidad publique nuevas entradas.'}
            </p>
          </div>
        ) : null}

        {!isLoadingPosts
          ? posts.map((post) => (
              <ForumPostCard
                key={post.id}
                currentForumName={useActiveForumAsCardLabel ? activeForum?.name ?? null : null}
                isDeleting={isDeletingPostId === post.id}
                isOwnPost={currentUserId === post.author.id}
                post={post}
                onDelete={onDeletePost}
              />
            ))
          : null}
      </div>
    </div>
  )
}
