import { cn } from '@/lib/utils'

import type { ForumImage } from './blog-types'

type ForumPostMediaGridProps = {
  images: ForumImage[]
}

const getContainerClassName = (imageCount: number) => {
  if (imageCount === 1) {
    return 'grid-cols-1'
  }

  if (imageCount === 3) {
    return 'grid-cols-2 grid-rows-2'
  }

  return 'grid-cols-2'
}

const getItemClassName = (imageCount: number, index: number) => {
  if (imageCount === 1) {
    return 'aspect-[16/9]'
  }

  if (imageCount === 3 && index === 0) {
    return 'row-span-2 aspect-auto min-h-[19rem]'
  }

  return 'aspect-square'
}

export function ForumPostMediaGrid({ images }: ForumPostMediaGridProps) {
  const visibleImages = images.slice(0, 4)

  if (visibleImages.length === 0) {
    return null
  }

  return (
    <div className={cn('mt-5 grid gap-3', getContainerClassName(visibleImages.length))}>
      {visibleImages.map((image, index) => (
        <figure
          key={image.id}
          className={cn(
            'group relative overflow-hidden rounded-[1.4rem] border border-border/70 bg-muted',
            getItemClassName(visibleImages.length, index),
          )}
        >
          <img
            src={image.src}
            alt={image.alt}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 via-black/10 to-transparent p-4">
            <p className="text-sm font-medium text-white">{image.alt}</p>
          </div>
        </figure>
      ))}
    </div>
  )
}
