import type { CommunityStat, ForumPost, ForumTopic, SidebarHighlight } from '@/components/blog/blog-types'

export const communityStats: CommunityStat[] = [
  {
    label: 'Conversaciones activas',
    value: '128',
    detail: 'Hilos de emprendedores, mentores y equipos compartiendo aprendizajes.',
  },
  {
    label: 'Fotos por post',
    value: '0-4',
    detail: 'La galeria del componente ya contempla publicaciones sin imagen y hasta cuatro adjuntos.',
  },
  {
    label: 'Tiempo de respuesta',
    value: '< 3 h',
    detail: 'Ideal para validaciones rapidas, feedback de producto y preguntas abiertas.',
  },
]

export const forumTopics: ForumTopic[] = [
  {
    id: 'tendencias',
    label: 'Tendencias',
    description: 'Lo mas comentado por la comunidad esta semana.',
    count: 18,
  },
  {
    id: 'casos-reales',
    label: 'Casos reales',
    description: 'Experiencias de negocio contadas por quienes las vivieron.',
    count: 34,
  },
  {
    id: 'preguntas',
    label: 'Preguntas',
    description: 'Espacio rapido para pedir ayuda o validar ideas.',
    count: 21,
  },
  {
    id: 'recursos',
    label: 'Recursos',
    description: 'Plantillas, checklists y materiales compartidos en el foro.',
    count: 12,
  },
]

export const sidebarHighlights: SidebarHighlight[] = [
  {
    title: 'Abre un hilo claro',
    description: 'Un buen titulo, contexto y una pregunta concreta hacen que la comunidad responda mejor.',
  },
  {
    title: 'Adjunta evidencia visual',
    description: 'Puedes mostrar cero, una o hasta cuatro fotos para apoyar tu idea, avance o problema.',
  },
  {
    title: 'Cierra el ciclo',
    description: 'Cuando algo te funcione, vuelve al post y cuenta que aprendiste. Eso hace valioso el foro.',
  },
]

export const forumPosts: ForumPost[] = [
  {
    id: 'post-1',
    forumName: 'Foro de crecimiento',
    topic: 'Tendencias',
    title: 'Probamos una vitrina nueva para productos artesanales y estas fueron las reacciones',
    excerpt:
      'Hicimos un cambio en la exhibicion del punto de venta y documentamos el antes y despues. El equipo quiere decidir si dejamos el formato fijo o si lo usamos solo en lanzamientos.',
    createdAt: 'Hace 18 min',
    isPinned: true,
    tags: ['Retail', 'Visual merchandising', 'Validacion'],
    author: {
      name: 'Daniela Mora',
      role: 'Mentora de producto',
      handle: '@daniela',
      initials: 'DM',
    },
    images: [
      {
        id: 'post-1-image-1',
        src: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80',
        alt: 'Exhibicion de productos textiles en una tienda.',
      },
    ],
    metrics: {
      replies: 14,
      likes: 38,
      views: 216,
    },
  },
  {
    id: 'post-2',
    forumName: 'Foro de comunidad',
    topic: 'Preguntas',
    title: 'Que estructura usan para pedir feedback despues de una asesoria?',
    excerpt:
      'Quiero dejar un formato simple para que cada pyme pueda decir que entendio, que aplicara primero y que quedo pendiente. Si alguien ya tiene un template, me ayudaria muchisimo.',
    createdAt: 'Hace 1 h',
    tags: ['Feedback', 'Mentoria', 'Operaciones'],
    author: {
      name: 'Luis Chaves',
      role: 'Coordinador academico',
      handle: '@luisch',
      initials: 'LC',
    },
    images: [],
    metrics: {
      replies: 9,
      likes: 17,
      views: 104,
    },
  },
  {
    id: 'post-3',
    forumName: 'Foro de casos reales',
    topic: 'Casos reales',
    title: 'Comparativa rapida de empaque: version actual vs. version sostenible',
    excerpt:
      'Subo dos fotos porque estamos decidiendo si el cambio comunica mejor el valor del producto sin perder identidad. Nos interesa sobre todo la percepcion de calidad.',
    createdAt: 'Hace 2 h',
    tags: ['Packaging', 'Marca'],
    author: {
      name: 'Andrea Varela',
      role: 'Fundadora de pyme',
      handle: '@andreava',
      initials: 'AV',
    },
    images: [
      {
        id: 'post-3-image-1',
        src: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
        alt: 'Empaque de producto en una mesa de trabajo.',
      },
      {
        id: 'post-3-image-2',
        src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80',
        alt: 'Presentacion renovada de producto con enfoque sostenible.',
      },
    ],
    metrics: {
      replies: 22,
      likes: 41,
      views: 308,
    },
  },
  {
    id: 'post-4',
    forumName: 'Foro visual',
    topic: 'Recursos',
    title: 'Moodboard de la activacion en feria: stand, materiales y recorrido',
    excerpt:
      'Este hilo muestra tres imagenes porque necesitamos validar si el recorrido se entiende desde afuera, si la marca destaca bien y si el material POP se siente consistente.',
    createdAt: 'Hace 4 h',
    tags: ['Evento', 'Branding', 'Experiencia'],
    author: {
      name: 'Sofia Brenes',
      role: 'Disenadora de experiencia',
      handle: '@sofiab',
      initials: 'SB',
    },
    images: [
      {
        id: 'post-4-image-1',
        src: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
        alt: 'Stand de feria con paneles graficos.',
      },
      {
        id: 'post-4-image-2',
        src: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
        alt: 'Material promocional sobre una mesa de exhibicion.',
      },
      {
        id: 'post-4-image-3',
        src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        alt: 'Personas recorriendo un espacio de activacion de marca.',
      },
    ],
    metrics: {
      replies: 11,
      likes: 29,
      views: 187,
    },
  },
  {
    id: 'post-5',
    forumName: 'Foro de lanzamientos',
    topic: 'Tendencias',
    title: 'Cuatro vistas del nuevo corner para lanzamiento: escaparate, detalle, empaque y prueba social',
    excerpt:
      'Aqui si usamos el maximo de cuatro fotos para probar la variante completa del componente. Nos sirve ver si la grilla sigue ordenada cuando el post trae bastante material visual.',
    createdAt: 'Ayer',
    tags: ['Lanzamiento', 'Display', 'Conversion'],
    author: {
      name: 'Mariana Solis',
      role: 'Lider comercial',
      handle: '@marianas',
      initials: 'MS',
    },
    images: [
      {
        id: 'post-5-image-1',
        src: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
        alt: 'Escaparate principal con montaje de producto.',
      },
      {
        id: 'post-5-image-2',
        src: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80',
        alt: 'Detalle de producto y empaque sobre exhibidor.',
      },
      {
        id: 'post-5-image-3',
        src: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=1200&q=80',
        alt: 'Area de prueba social con clientes explorando el espacio.',
      },
      {
        id: 'post-5-image-4',
        src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        alt: 'Vista general del corner de lanzamiento dentro de tienda.',
      },
    ],
    metrics: {
      replies: 31,
      likes: 64,
      views: 452,
    },
  },
]
