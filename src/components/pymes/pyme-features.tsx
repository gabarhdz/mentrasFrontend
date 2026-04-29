import type { IconType } from "react-icons";
import { FiCpu, FiGlobe, FiMessageCircle, FiZap } from "react-icons/fi";

const features: Array<{
  title: string;
  description: string;
  icon: IconType;
}> = [
  {
    title: "Presencia digital clara",
    description:
      "Creamos una base profesional para que tu negocio se vea confiable y sea facil de encontrar.",
    icon: FiGlobe,
  },
  {
    title: "Canales que venden",
    description:
      "Organizamos WhatsApp, formularios, catalogos y seguimiento para que cada contacto tenga un camino.",
    icon: FiMessageCircle,
  },
  {
    title: "Automatizacion con sentido",
    description:
      "Quitamos tareas repetitivas con automatizaciones ligeras que de verdad ahorran tiempo.",
    icon: FiZap,
  },
  {
    title: "Asistencia inteligente",
    description:
      "Integramos herramientas digitales y asistentes que ayudan a responder, ordenar y escalar.",
    icon: FiCpu,
  },
];

const PymeFeatures = () => {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-12 md:px-8 md:pb-16">
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Herramientas compactas para operar mejor
          </h2>
        </div>
      </div>

      <div className="mt-7 grid gap-2 sm:grid-cols-2">
        {features.map(({ title, description, icon: Icon }) => (
          <article
            key={title}
            className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-3">
              <div className="inline-flex shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
                <Icon className="size-4" />
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-semibold leading-6 tracking-tight">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PymeFeatures;
