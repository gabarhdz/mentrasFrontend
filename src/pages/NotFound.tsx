import { ArrowLeft, Compass, Home, SearchCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Reveal } from "@/components/ui/reveal";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const quickLinks = [
  {
    icon: Home,
    title: "Volver al inicio",
    description: "Regresa al landing principal de Mentras y retoma el recorrido.",
    href: "/",
    label: "Ir al home",
  },
  {
    icon: Compass,
    title: "Ver servicios",
    description: "Explora como Mentras digitaliza lo importante sin complicarte.",
    href: "/#servicios",
    label: "Ver servicios",
  },
  {
    icon: SearchCheck,
    title: "Hablar con Mentras",
    description: "Ve directo a la seccion de contacto si ya sabes lo que necesitas.",
    href: "/#contacto",
    label: "Ir a contacto",
  },
];

export default function NotFound() {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isDark]);

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-[6%] top-[8%] h-72 w-72 rounded-full bg-secondary/18 blur-3xl dark:bg-secondary/16" />
        <div className="absolute right-[4%] top-[14%] h-80 w-80 rounded-full bg-primary/20 blur-3xl dark:bg-primary/18" />
        <div className="absolute bottom-[10%] left-[28%] h-64 w-64 rounded-full bg-accent/12 blur-3xl dark:bg-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--secondary)_18%,transparent),transparent_34%),radial-gradient(circle_at_85%_0%,_color-mix(in_oklab,var(--primary)_20%,transparent),transparent_30%),linear-gradient(to_bottom,_color-mix(in_oklab,var(--background)_65%,transparent),var(--background)_92%)]" />
      </div>

      <div className="relative z-10 px-6 pb-12 pt-6 sm:pb-16 sm:pt-10">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted"
            >
              <span className="size-2 rounded-full bg-primary" />
              Mentras
            </Link>
            <ThemeToggle isDark={isDark} onToggle={() => setIsDark((current) => !current)} />
          </div>

          <section className="mt-12 grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <Reveal className="space-y-8">
              <div className="space-y-6">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  Error 404
                </span>
                <div className="space-y-4">
                  <p className="text-7xl font-semibold tracking-tight text-primary/85 sm:text-8xl">
                    404
                  </p>
                  <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                    Esta ruta se salio del mapa, pero Mentras sigue contigo.
                  </h1>
                  <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                    La pagina que buscas no existe o se movio. Volvamos a una ruta clara
                    para que encuentres lo importante sin perder tiempo.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
                >
                  <ArrowLeft className="size-4" />
                  Volver
                </button>
                <a
                  href="/#contacto"
                  className="inline-flex items-center rounded-full border border-border bg-card/90 px-5 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition-colors hover:bg-muted"
                >
                  Ir a contacto
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/72 p-6 shadow-[0_28px_100px_-42px_color-mix(in_oklab,var(--primary)_34%,transparent)] backdrop-blur sm:p-8">
                <div className="absolute inset-x-10 top-0 h-32 rounded-full bg-primary/18 blur-3xl" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background/55" />

                <div className="relative">
                  <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                    Rutas sugeridas
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                    Te devolvemos a una experiencia clara y util.
                  </h2>

                  <div className="mt-6 grid gap-4">
                    {quickLinks.map(({ icon: Icon, title, description, href, label }, index) => (
                      <Reveal key={title} delay={0.08 * (index + 1)} y={18}>
                        <a
                          href={href}
                          className="group flex items-start gap-4 rounded-[1.6rem] border border-border/80 bg-background/86 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                        >
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/18 text-secondary-foreground">
                            <Icon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
                            <p className="mt-2 text-sm leading-7 text-muted-foreground">
                              {description}
                            </p>
                            <span className="mt-3 inline-flex text-sm font-semibold text-primary">
                              {label}
                            </span>
                          </div>
                        </a>
                      </Reveal>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          </section>
        </div>
      </div>
    </main>
  );
}
