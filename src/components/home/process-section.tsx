import { Compass, Rocket, SearchCheck } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    title: "Diagnostico simple",
    description:
      "Revisamos tu negocio, tus canales actuales y las trabas mas urgentes para priorizar bien.",
    icon: SearchCheck,
  },
  {
    title: "Ruta digital realista",
    description:
      "Definimos una hoja de ruta clara con acciones alcanzables, herramientas y tiempos razonables.",
    icon: Compass,
  },
  {
    title: "Implementacion y acompanamiento",
    description:
      "Ponemos en marcha la solucion contigo y te dejamos un sistema que puedas sostener.",
    icon: Rocket,
  },
];

export function ProcessSection() {
  return (
    <section className="px-6 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-10 rounded-[2rem] border border-border bg-card px-6 py-8 shadow-sm sm:px-8 sm:py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <SectionHeading
            badge="Como trabajamos"
            title="Un proceso pensado para avanzar sin abrumarte"
            description="Nos enfocamos en pasos concretos, decisiones claras y herramientas que tu negocio pueda adoptar de verdad."
          />
        </Reveal>

        <div className="space-y-4">
          {steps.map(({ title, description, icon: Icon }, index) => (
            <Reveal key={title} delay={index * 0.08}>
              <article className="flex gap-4 rounded-3xl border border-border/80 bg-background p-5">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/20 text-secondary-foreground">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                    Paso {index + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
