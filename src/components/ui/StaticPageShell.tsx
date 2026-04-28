import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'

type StaticPageShellProps = {
  eyebrow: string
  title: string
}

export default function StaticPageShell({ eyebrow, title }: StaticPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 px-6 pb-20 pt-8 sm:pt-10 md:px-12 lg:px-24 xl:px-40">
        <section className="mx-auto max-w-6xl rounded-[2rem] border border-border/70 bg-card/80 p-8 shadow-sm backdrop-blur sm:p-10">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        </section>
      </main>

      <Footer />
    </div>
  )
}
