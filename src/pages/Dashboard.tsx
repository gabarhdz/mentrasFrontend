import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import PymeMenuManager from '@/components/pymes/pyme-menu-manager'

export default function Dashboard() {
  return (
    <>
      <Header />
      <main className="relative min-h-screen text-foreground">
        <section className="mx-auto mt-8 w-full max-w-5xl rounded-2xl bg-background px-6 py-10 md:mt-10 md:px-8 md:py-14">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
            Dashboard
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Gestion de menus
          </h1>
          <p className="mt-3 max-w-2xl text-base text-foreground/75 md:text-lg">
            Este espacio concentra la operacion de menus, inventario y registros para que puedas
            crear, revisar y ajustar stock con detalle separado dentro del mismo dashboard.
          </p>
        </section>
        <PymeMenuManager />
      </main>
      <Footer />
    </>
  )
}
