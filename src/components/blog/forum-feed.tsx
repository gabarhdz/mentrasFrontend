import { Search, SlidersHorizontal } from 'lucide-react'

import type { ForumPost, ForumTopic } from './blog-types'
import { ForumComposerCard } from './forum-composer-card'
import { ForumPostCard } from './forum-post-card'
import { ForumTopicTabs } from './forum-topic-tabs'

type ForumFeedProps = {
  posts: ForumPost[]
  topics: ForumTopic[]
  activeTopicId: string
}

export function ForumFeed({ posts, topics, activeTopicId }: ForumFeedProps) {
  return (
    <div className="space-y-6">
      <ForumTopicTabs topics={topics} activeTopicId={activeTopicId} />

      <section className="rounded-[1.75rem] border border-border/70 bg-card/92 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
            <Search className="size-4" />
            Buscar por titulo, tema o palabra clave
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted"
          >
            <SlidersHorizontal className="size-4" />
            Filtrar por mas recientes
          </button>
        </div>
      </section>

      <ForumComposerCard />

      <div className="space-y-5">
        {posts.map((post) => (
          <ForumPostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
