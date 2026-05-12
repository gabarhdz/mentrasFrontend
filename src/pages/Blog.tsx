import { BlogForumPrototype } from '@/components/blog/blog-forum-prototype'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'

export default function Blog() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-6 pb-20 pt-8 sm:pt-10 md:px-12 lg:px-24 xl:px-32">
        <div className="mx-auto max-w-7xl">
          <BlogForumPrototype />
        </div>
      </main>

      <Footer />
    </div>
  )
}
