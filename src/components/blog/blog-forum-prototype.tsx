import { communityStats, forumPosts, forumTopics, sidebarHighlights } from './blog-mock-data'
import { BlogPageHero } from './blog-page-hero'
import { ForumFeed } from './forum-feed'
import { ForumSidebar } from './forum-sidebar'

export function BlogForumPrototype() {
  return (
    <div className="space-y-8">
      <BlogPageHero stats={communityStats} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_22rem]">
        <ForumFeed posts={forumPosts} topics={forumTopics} activeTopicId="tendencias" />
        <ForumSidebar highlights={sidebarHighlights} />
      </section>
    </div>
  )
}
