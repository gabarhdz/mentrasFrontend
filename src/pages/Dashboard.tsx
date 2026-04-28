import Header from '@/components/ui/Header'

export default function Dashboard() {
  return (
    <main className="relative min-h-screen text-foreground">
      <Header />
      <section className="px-6 py-16 md:px-12 lg:px-24 xl:px-40">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
      </section>
    </main>
  )
}
