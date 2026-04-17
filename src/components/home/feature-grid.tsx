import { Bot, Globe, MessageCircleMore, Workflow } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const features = [
  {
    title: "Presencia digital clara",
    description:
      "Creamos una base profesional para que tu negocio se vea confiable y sea facil de encontrar.",
    icon: Globe,
  },
  {
    title: "Canales que venden",
    description:
      "Organizamos WhatsApp, formularios, catalogos y seguimiento para que cada contacto tenga un camino.",
    icon: MessageCircleMore,
  },
  {
    title: "Automatizacion con sentido",
    description:
      "Quitamos tareas repetitivas con automatizaciones ligeras que de verdad ahorran tiempo.",
    icon: Workflow,
  },
  {
    title: "Asistencia inteligente",
    description:
      "Integramos herramientas digitales y asistentes que ayudan a responder, ordenar y escalar.",
    icon: Bot,
  },
];

export function FeatureGrid() {
  return (
    <section id="servicios" className="px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          badge="Que hacemos"
          title="Digitalizamos lo importante sin complicar tu operacion"
          description="Mentras convierte necesidades dispersas en un sistema digital simple: presencia, captacion, seguimiento y automatizacion para que puedas enfocarte en vender y atender mejor."
        />

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ title, description, icon: Icon }, index) => (
            <Reveal key={title} delay={index * 0.08}>
              <article className="group h-full rounded-3xl border border-border bg-card p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1">
                <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
