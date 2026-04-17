import { BriefcaseBusiness, Clock3, ShieldCheck } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const trustPoints = [
  {
    title: "Pensado para emprendedores",
    description: "Procesos sencillos, lenguaje claro y herramientas que no te roban tiempo.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Implementacion practica",
    description: "Priorizamos avances visibles rapido para que empieces a notar orden y traccion.",
    icon: Clock3,
  },
  {
    title: "Mas confianza frente a clientes",
    description: "Una presencia digital consistente transmite seriedad y mejora la conversion.",
    icon: ShieldCheck,
  },
];

export function SocialProofSection() {
  return (
    <section id="contacto" className="px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_11%,white),color-mix(in_oklab,var(--secondary)_10%,white))] p-8 shadow-sm dark:bg-[linear-gradient(135deg,color-mix(in_oklab,var(--primary)_14%,black),color-mix(in_oklab,var(--secondary)_12%,black))] sm:p-10">
        <Reveal>
          <SectionHeading
            badge="Confianza"
            title="Digitalizarse tambien es verse listo para crecer"
            description="Mentras te ayuda a proyectar claridad, orden y profesionalismo para que tus clientes confien antes, durante y despues del primer contacto."
            className="max-w-3xl"
          />
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <Reveal delay={0.08}>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-3">
                {trustPoints.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="rounded-2xl bg-background p-4">
                    <Icon className="size-5 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="flex h-full flex-col justify-between rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                  Resultado esperado
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                  Un negocio que se entiende mejor, responde mas rapido y transmite mas
                  confianza.
                </h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Desde una presencia mas profesional hasta procesos mas ordenados,
                  cada mejora suma credibilidad para vender con menos friccion.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  Sitio y presencia
                </span>
                <span className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                  Contacto y seguimiento
                </span>
                <span className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
                  Automatizacion
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
