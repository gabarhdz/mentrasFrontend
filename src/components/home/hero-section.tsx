import { ArrowRight, BadgeCheck, ChartSpline, Smartphone } from "lucide-react";
import { motion } from "motion/react";

import { MarqueeStrip } from "@/components/ui/marquee-strip";
import { Reveal } from "@/components/ui/reveal";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type HeroSectionProps = {
  isDark: boolean;
  onToggleTheme: () => void;
};

const heroPoints = [
  {
    icon: Smartphone,
    label: "Tu negocio en canales digitales",
  },
  {
    icon: ChartSpline,
    label: "Procesos simples para vender mejor",
  },
  {
    icon: BadgeCheck,
    label: "Acompanamiento cercano y claro",
  },
];

const marqueeItems = [
  "Diagnostico digital",
  "Catalogo online",
  "Automatizacion ligera",
  "WhatsApp y CRM",
  "Cobros y seguimiento",
  "Presencia profesional",
];

export function HeroSection({ isDark, onToggleTheme }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-6 sm:pb-24 sm:pt-10">
      <div className="absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklab,var(--color-brand-secondary)_30%,transparent),transparent_45%),radial-gradient(circle_at_80%_10%,_color-mix(in_oklab,var(--color-brand-primary)_22%,transparent),transparent_42%),linear-gradient(to_bottom,_transparent,_color-mix(in_oklab,var(--background)_88%,white_12%))]" />

      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <span className="size-2 rounded-full bg-primary" />
            Mentras
          </div>
          <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />
        </div>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <Reveal className="space-y-8">
            <div className="space-y-6">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Digitalizacion util para emprendedores que quieren avanzar sin caos
              </span>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
                  Convierte tu negocio en una operacion digital clara, confiable y
                  lista para crecer.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  Mentras ayuda a emprendedores a ordenar su presencia digital, mejorar
                  sus ventas y automatizar lo esencial sin volverse una empresa pesada.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
              >
                Quiero digitalizar mi negocio
                <ArrowRight className="size-4" />
              </a>
              <a
                href="#servicios"
                className="inline-flex items-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
              >
                Ver como funciona
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroPoints.map(({ icon: Icon, label }, index) => (
                <Reveal
                  key={label}
                  delay={0.08 * (index + 1)}
                  className="rounded-2xl border border-border/80 bg-card/90 p-4 shadow-sm backdrop-blur"
                >
                  <Icon className="mb-3 size-5 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">{label}</p>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="relative mx-auto w-full max-w-[34rem] lg:max-w-none">
              <motion.div
                className="absolute inset-x-10 bottom-4 top-10 -z-10 rounded-full bg-primary/25 blur-3xl"
                animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.5, 0.35] }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              />
              <div className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card p-3 shadow-[0_28px_100px_-42px_color-mix(in_oklab,var(--primary)_34%,transparent)] sm:p-4">
                <div className="absolute inset-x-10 top-2 h-28 rounded-full bg-secondary/20 blur-3xl" />
                <div className="relative overflow-hidden rounded-[1.8rem] bg-[linear-gradient(155deg,color-mix(in_oklab,var(--primary)_14%,white),color-mix(in_oklab,var(--secondary)_12%,white)_48%,color-mix(in_oklab,var(--accent)_12%,white))] dark:bg-[linear-gradient(155deg,color-mix(in_oklab,var(--primary)_20%,black),color-mix(in_oklab,var(--secondary)_14%,black)_48%,color-mix(in_oklab,var(--accent)_12%,black))]">
                  <div className="flex items-center justify-between border-b border-white/40 px-5 py-4 backdrop-blur sm:px-6">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                        Confianza real
                      </p>
                      <p className="mt-1 text-lg font-semibold">Mentras acompana tu crecimiento</p>
                    </div>
                    <div className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                      1 a 1
                    </div>
                  </div>

                  <div className="relative min-h-[27rem] px-4 pt-4 sm:min-h-[33rem] sm:px-6 sm:pt-6">
                    <img
                      src="/smiling-man.webp"
                      alt="Emprendedor sonriendo mientras usa Mentras"
                      className="absolute bottom-0 right-0 z-10 h-[25rem] w-auto max-w-none object-contain drop-shadow-[0_28px_45px_rgba(0,0,0,0.18)] sm:h-[31rem] lg:h-[33rem]"
                    />

                    
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.18} className="mt-10">
          <MarqueeStrip items={marqueeItems} />
        </Reveal>
      </div>
    </section>
  );
}
