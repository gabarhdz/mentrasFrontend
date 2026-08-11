import { ShieldCheck } from 'lucide-react'

import { MentorApplicationsAdminPanel } from '@/components/learning/mentor-applications-admin'
import { MentorsAdminPanel } from '@/components/learning/mentors-admin'
import Footer from '@/components/ui/Footer'
import Header from '@/components/ui/Header'

export default function AdminMentorApplications() {
  return (
    <>
      <Header />
      <main className="relative min-h-screen text-foreground">
        <section className="px-6 py-10 md:px-12 lg:px-24 xl:px-40">
          <div className="mx-auto max-w-6xl space-y-6">
            <section className="rounded-[2rem] border border-border/70 bg-card/92 p-6 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
                    Administracion Mentras
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                    Administración de rangos
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Gestiona solicitudes para crear cursos y retira permisos de mentor o dueño de
                    pyme cuando corresponda.
                  </p>
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
            </section>

            <MentorApplicationsAdminPanel />
            <MentorsAdminPanel />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
