export type ForumImage = {
  id: string
  src: string
  alt: string
}

export type ForumAuthor = {
  name: string
  role: string
  handle: string
  initials: string
}

export type ForumPostMetrics = {
  replies: number
  likes: number
  views: number
}

export type ForumPost = {
  id: string
  forumName: string
  topic: string
  title: string
  excerpt: string
  createdAt: string
  isPinned?: boolean
  tags: string[]
  author: ForumAuthor
  images: ForumImage[]
  metrics: ForumPostMetrics
}

export type ForumTopic = {
  id: string
  label: string
  description: string
  count: number
}

export type CommunityStat = {
  label: string
  value: string
  detail: string
}

export type SidebarHighlight = {
  title: string
  description: string
}
