import { Eye, Heart, MessageCircle, Paperclip, Pin } from 'lucide-react'

import type { ForumPost } from './blog-types'
import { ForumPostMediaGrid } from './forum-post-media-grid'

type ForumPostCardProps = {
  post: ForumPost
}

export function ForumPostCard({ post }: ForumPostCardProps) {
  return (
    <article className="rounded-[1.85rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="inline-flex size-12 shrink-0 items-center justify-center rounded-[1.2rem] bg-primary/12 text-sm font-semibold text-primary">
            {post.author.initials}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{post.author.name}</span>
              <span>{post.author.role}</span>
              <span>{post.author.handle}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
                {post.forumName}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                {post.topic}
              </span>
              {post.isPinned ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Pin className="size-3.5" />
                  Fijado
                </span>
              ) : null}
              <span className="text-xs text-muted-foreground">{post.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-2 text-xs text-muted-foreground">
          <Paperclip className="size-3.5" />
          {post.images.length} foto{post.images.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-2xl font-semibold tracking-tight text-foreground">{post.title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground"
          >
            #{tag}
          </span>
        ))}
      </div>

      <ForumPostMediaGrid images={post.images} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="size-4" />
            {post.metrics.replies} respuestas
          </span>
          <span className="inline-flex items-center gap-2">
            <Heart className="size-4" />
            {post.metrics.likes} reacciones
          </span>
          <span className="inline-flex items-center gap-2">
            <Eye className="size-4" />
            {post.metrics.views} vistas
          </span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            Ver hilo
          </button>
          <button
            type="button"
            className="rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/12"
          >
            Responder
          </button>
        </div>
      </div>
    </article>
  )
}
