import type { jsPDF as JsPdfDocument } from 'jspdf'

import type { MenuItem, StockMenu } from '@/components/pymes/pyme-menu-shared'
import { formatDateTime, formatPrice } from '@/components/pymes/pyme-menu-shared'

type MenuPdfPayload = {
  menu: StockMenu
  pymeName?: string | null
}

type RgbColor = readonly [number, number, number]

const PAGE_WIDTH = 210
const PAGE_HEIGHT = 297
const MARGIN_X = 16
const MARGIN_BOTTOM = 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2

const BRAND = {
  primary: [0, 137, 123] as RgbColor,
  secondary: [100, 181, 246] as RgbColor,
  accent: [255, 111, 97] as RgbColor,
  background: [250, 250, 250] as RgbColor,
  surface: [255, 255, 255] as RgbColor,
  foreground: [38, 50, 56] as RgbColor,
  muted: [234, 244, 243] as RgbColor,
  mutedForeground: [84, 110, 122] as RgbColor,
  border: [214, 228, 226] as RgbColor,
  successSurface: [230, 245, 239] as RgbColor,
  successText: [28, 112, 76] as RgbColor,
  warningSurface: [255, 244, 229] as RgbColor,
  warningText: [207, 113, 17] as RgbColor,
  dangerSurface: [255, 235, 238] as RgbColor,
  dangerText: [198, 40, 40] as RgbColor,
} as const

const sanitizePdfText = (value?: string | null) => {
  if (!value) {
    return ''
  }

  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

const sanitizeFileSegment = (value?: string | null) => {
  const sanitizedValue = sanitizePdfText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return sanitizedValue || 'menu'
}

const buildMenuPdfFileName = (menuName: string) => `${sanitizeFileSegment(menuName)}.pdf`

const resolveGeneratedAtLabel = () =>
  new Intl.DateTimeFormat('es-CR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date())

const setFillColor = (doc: JsPdfDocument, color: RgbColor) => {
  doc.setFillColor(color[0], color[1], color[2])
}

const setDrawColor = (doc: JsPdfDocument, color: RgbColor) => {
  doc.setDrawColor(color[0], color[1], color[2])
}

const setTextColor = (doc: JsPdfDocument, color: RgbColor) => {
  doc.setTextColor(color[0], color[1], color[2])
}

const splitText = (doc: JsPdfDocument, text: string, width: number) =>
  doc.splitTextToSize(text || '-', width) as string[]

const drawRoundedCard = (
  doc: JsPdfDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  fillColor = BRAND.surface,
) => {
  setFillColor(doc, fillColor)
  setDrawColor(doc, BRAND.border)
  doc.roundedRect(x, y, width, height, 6, 6, 'FD')
}

const drawPageBase = (
  doc: JsPdfDocument,
  options: { menuName: string; pymeName?: string | null; firstPage?: boolean },
) => {
  setFillColor(doc, BRAND.background)
  doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F')

  if (options.firstPage) {
    setFillColor(doc, BRAND.primary)
    doc.rect(0, 0, PAGE_WIDTH, 64, 'F')

    setFillColor(doc, BRAND.secondary)
    doc.rect(0, 64, PAGE_WIDTH, 3, 'F')

    setFillColor(doc, BRAND.accent)
    doc.roundedRect(PAGE_WIDTH - 34, 12, 18, 18, 5, 5, 'F')

    setFillColor(doc, BRAND.surface)
    doc.circle(PAGE_WIDTH - 42, 24, 6, 'F')
    return
  }

  setFillColor(doc, BRAND.surface)
  doc.rect(0, 0, PAGE_WIDTH, 22, 'F')
  setDrawColor(doc, BRAND.border)
  doc.line(MARGIN_X, 22, PAGE_WIDTH - MARGIN_X, 22)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, BRAND.primary)
  doc.text('Mentras', MARGIN_X, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setTextColor(doc, BRAND.mutedForeground)
  doc.text(sanitizePdfText(options.pymeName || options.menuName), PAGE_WIDTH - MARGIN_X, 12, {
    align: 'right',
  })
}

const addFooter = (doc: JsPdfDocument, payload: MenuPdfPayload) => {
  const totalPages = doc.getNumberOfPages()
  const menuLabel = sanitizePdfText(payload.menu.name || 'Menu digital')
  const pymeLabel = sanitizePdfText(payload.pymeName || 'Pyme')

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    doc.setPage(pageNumber)

    setDrawColor(doc, BRAND.border)
    doc.line(MARGIN_X, PAGE_HEIGHT - 11, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 11)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setTextColor(doc, BRAND.mutedForeground)
    doc.text(`${pymeLabel} · ${menuLabel}`, MARGIN_X, PAGE_HEIGHT - 6)
    doc.text(`Preparado con Mentras · ${pageNumber}/${totalPages}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 6, {
      align: 'right',
    })
  }
}

const getNumericPrice = (value?: string | number | null) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value)

    if (Number.isFinite(parsedValue)) {
      return parsedValue
    }
  }

  return null
}

const getAvailabilityTone = (stock: number) => {
  if (stock <= 0) {
    return {
      label: 'Agotado temporalmente',
      fill: BRAND.dangerSurface,
      text: BRAND.dangerText,
    }
  }

  if (stock <= 5) {
    return {
      label: 'Pocas unidades',
      fill: BRAND.warningSurface,
      text: BRAND.warningText,
    }
  }

  return {
    label: 'Disponible',
    fill: BRAND.successSurface,
    text: BRAND.successText,
  }
}

const getPriceRangeLabel = (menu: StockMenu) => {
  const prices = menu.menu_items
    .map((menuItem) => getNumericPrice(menuItem.item?.price))
    .filter((value): value is number => value !== null)

  if (prices.length === 0) {
    return 'Consultar precios'
  }

  const minimumPrice = Math.min(...prices)
  const maximumPrice = Math.max(...prices)

  if (minimumPrice === maximumPrice) {
    return formatPrice(minimumPrice)
  }

  return `${formatPrice(minimumPrice)} - ${formatPrice(maximumPrice)}`
}

const getAvailabilitySummary = (menu: StockMenu) => {
  const availableItems = menu.menu_items.filter((menuItem) => (menuItem.item?.stock ?? 0) > 0).length

  if (menu.menu_items.length === 0) {
    return 'Sin productos cargados'
  }

  if (availableItems === menu.menu_items.length) {
    return 'Todo el menu disponible'
  }

  if (availableItems === 0) {
    return 'Disponibilidad por confirmar'
  }

  return `${availableItems} de ${menu.menu_items.length} productos disponibles`
}

const drawMetricCard = (
  doc: JsPdfDocument,
  options: {
    x: number
    y: number
    width: number
    height: number
    label: string
    value: string
    caption?: string
    accent: RgbColor
  },
) => {
  drawRoundedCard(doc, options.x, options.y, options.width, options.height)

  setFillColor(doc, options.accent)
  doc.roundedRect(options.x + 5, options.y + 5, 14, 14, 4, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setTextColor(doc, BRAND.mutedForeground)
  doc.text(sanitizePdfText(options.label), options.x + 24, options.y + 10)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  setTextColor(doc, BRAND.foreground)
  const valueLines = splitText(doc, sanitizePdfText(options.value), options.width - 12)
  doc.text(valueLines, options.x + 6, options.y + 21)

  if (options.caption) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    setTextColor(doc, BRAND.mutedForeground)
    const captionLines = splitText(doc, sanitizePdfText(options.caption), options.width - 12)
    doc.text(captionLines, options.x + 6, options.y + options.height - 7)
  }
}

const drawSectionHeading = (
  doc: JsPdfDocument,
  options: {
    y: number
    eyebrow: string
    title: string
    description?: string
  },
) => {
  setFillColor(doc, BRAND.muted)
  doc.roundedRect(MARGIN_X, options.y, 36, 9, 4.5, 4.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  setTextColor(doc, BRAND.primary)
  doc.text(sanitizePdfText(options.eyebrow), MARGIN_X + 18, options.y + 6, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  setTextColor(doc, BRAND.foreground)
  doc.text(sanitizePdfText(options.title), MARGIN_X, options.y + 18)

  if (!options.description) {
    return options.y + 24
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setTextColor(doc, BRAND.mutedForeground)
  const lines = splitText(doc, sanitizePdfText(options.description), CONTENT_WIDTH)
  doc.text(lines, MARGIN_X, options.y + 26)

  return options.y + 26 + lines.length * 5
}

const getItemCardHeight = (doc: JsPdfDocument, menuItem: MenuItem) => {
  const nameLines = splitText(
    doc,
    sanitizePdfText(menuItem.item?.name || 'Producto sin nombre'),
    CONTENT_WIDTH - 52,
  )

  return 26 + Math.max(0, nameLines.length - 1) * 5
}

const drawAvailabilityPill = (
  doc: JsPdfDocument,
  x: number,
  y: number,
  label: string,
  fill: RgbColor,
  text: RgbColor,
) => {
  const pillWidth = Math.max(32, sanitizePdfText(label).length * 1.85 + 10)

  setFillColor(doc, fill)
  doc.roundedRect(x, y, pillWidth, 8, 4, 4, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  setTextColor(doc, text)
  doc.text(sanitizePdfText(label), x + pillWidth / 2, y + 5.5, { align: 'center' })
}

const drawMenuItemCard = (
  doc: JsPdfDocument,
  options: {
    item: MenuItem
    index: number
    y: number
  },
) => {
  const stock = options.item.item?.stock ?? 0
  const availability = getAvailabilityTone(stock)
  const productName = sanitizePdfText(options.item.item?.name || `Producto ${options.index + 1}`)
  const priceValue = getNumericPrice(options.item.item?.price)
  const priceLabel = priceValue === null ? 'Consultar precio' : formatPrice(priceValue)
  const nameLines = splitText(doc, productName, CONTENT_WIDTH - 52)
  const cardHeight = getItemCardHeight(doc, options.item)

  drawRoundedCard(doc, MARGIN_X, options.y, CONTENT_WIDTH, cardHeight)

  setFillColor(doc, BRAND.primary)
  doc.roundedRect(MARGIN_X + 6, options.y + 6, 16, 16, 5, 5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, BRAND.surface)
  doc.text(String(options.index + 1).padStart(2, '0'), MARGIN_X + 14, options.y + 16, {
    align: 'center',
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12.5)
  setTextColor(doc, BRAND.foreground)
  doc.text(nameLines, MARGIN_X + 28, options.y + 12)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  setTextColor(doc, BRAND.primary)
  doc.text(sanitizePdfText(priceLabel), MARGIN_X + 28, options.y + 22 + (nameLines.length - 1) * 5)

  drawAvailabilityPill(
    doc,
    PAGE_WIDTH - MARGIN_X - Math.max(32, sanitizePdfText(availability.label).length * 1.85 + 10),
    options.y + 8,
    availability.label,
    availability.fill,
    availability.text,
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  setTextColor(doc, BRAND.mutedForeground)
  doc.text('Precio de referencia', MARGIN_X + 28, options.y + 27 + (nameLines.length - 1) * 5)

  return options.y + cardHeight + 5
}

const createMenuPdfDocument = async (payload: MenuPdfPayload) => {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  })
  const menuName = sanitizePdfText(payload.menu.name || 'Menu sin nombre')
  const pymeLabel = sanitizePdfText(payload.pymeName || 'Pyme')
  const descriptionText = sanitizePdfText(
    payload.menu.description ||
      'Una seleccion clara de productos preparada para compartir con tus clientes.',
  )
  const lastUpdatedLabel = payload.menu.movements[0]?.created_at
    ? formatDateTime(payload.menu.movements[0].created_at)
    : resolveGeneratedAtLabel()
  const priceRangeLabel = getPriceRangeLabel(payload.menu)
  const availabilitySummary = getAvailabilitySummary(payload.menu)
  const introLines = splitText(doc, descriptionText, CONTENT_WIDTH - 20)
  const introCardHeight = Math.max(34, 24 + introLines.length * 5)
  const metricY = 92 + introCardHeight - 34
  const metricWidth = (CONTENT_WIDTH - 8) / 3

  drawPageBase(doc, {
    menuName,
    pymeName: pymeLabel,
    firstPage: true,
  })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  setTextColor(doc, BRAND.surface)
  doc.text('Mentras', MARGIN_X, 16)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(23)
  setTextColor(doc, BRAND.surface)
  doc.text(menuName, MARGIN_X, 30)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Menu digital de ${pymeLabel}`, MARGIN_X, 38)
  doc.text(`Actualizado: ${sanitizePdfText(lastUpdatedLabel)}`, MARGIN_X, 45)

  drawRoundedCard(doc, MARGIN_X, 52, CONTENT_WIDTH, introCardHeight)

  setFillColor(doc, BRAND.muted)
  doc.roundedRect(MARGIN_X + 6, 58, 52, 8, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  setTextColor(doc, BRAND.primary)
  doc.text('Listo para compartir', MARGIN_X + 32, 63.5, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  setTextColor(doc, BRAND.foreground)
  doc.text('Resumen claro para tus clientes', MARGIN_X + 6, 74)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  setTextColor(doc, BRAND.mutedForeground)
  doc.text(introLines, MARGIN_X + 6, 82)

  drawMetricCard(doc, {
    x: MARGIN_X,
    y: metricY,
    width: metricWidth,
    height: 31,
    label: 'Productos',
    value: String(payload.menu.menu_items.length),
    caption: 'Opciones dentro de este menu',
    accent: BRAND.primary,
  })
  drawMetricCard(doc, {
    x: MARGIN_X + metricWidth + 4,
    y: metricY,
    width: metricWidth,
    height: 31,
    label: 'Rango de precios',
    value: priceRangeLabel,
    caption: 'Valores expresados en CRC',
    accent: BRAND.secondary,
  })
  drawMetricCard(doc, {
    x: MARGIN_X + (metricWidth + 4) * 2,
    y: metricY,
    width: metricWidth,
    height: 31,
    label: 'Disponibilidad',
    value: availabilitySummary,
    caption: 'Sujeta a cambios del dia',
    accent: BRAND.accent,
  })

  let y = drawSectionHeading(doc, {
    y: metricY + 39,
    eyebrow: 'Carta',
    title: 'Lo que encontraran en este menu',
    description:
      'Cada producto se presenta con un precio de referencia y una senal simple de disponibilidad para facilitar la consulta.',
  })

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= PAGE_HEIGHT - MARGIN_BOTTOM - 14) {
      return
    }

    doc.addPage()
    drawPageBase(doc, {
      menuName,
      pymeName: pymeLabel,
    })
    y = 30
  }

  if (payload.menu.menu_items.length === 0) {
    ensureSpace(34)
    drawRoundedCard(doc, MARGIN_X, y, CONTENT_WIDTH, 30, BRAND.surface)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    setTextColor(doc, BRAND.foreground)
    doc.text('Este menu aun no tiene productos visibles.', MARGIN_X + 8, y + 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    setTextColor(doc, BRAND.mutedForeground)
    doc.text(
      splitText(
        doc,
        'Cuando la pyme agregue productos, aqui apareceran listos para descargar y compartir.',
        CONTENT_WIDTH - 16,
      ),
      MARGIN_X + 8,
      y + 20,
    )

    y += 36
  } else {
    payload.menu.menu_items.forEach((menuItem, index) => {
      const cardHeight = getItemCardHeight(doc, menuItem)
      ensureSpace(cardHeight + 5)
      y = drawMenuItemCard(doc, {
        item: menuItem,
        index,
        y,
      })
    })
  }

  ensureSpace(44)
  y += 4

  drawRoundedCard(doc, MARGIN_X, y, CONTENT_WIDTH, 34, BRAND.muted)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  setTextColor(doc, BRAND.foreground)
  doc.text('Notas para compartir este menu', MARGIN_X + 8, y + 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  setTextColor(doc, BRAND.mutedForeground)
  doc.text('- Los precios se muestran en colones costarricenses.', MARGIN_X + 8, y + 19)
  doc.text('- La disponibilidad puede cambiar segun inventario y demanda del dia.', MARGIN_X + 8, y + 24.5)
  doc.text('- Si deseas confirmar un pedido especial, contacta directamente a la pyme.', MARGIN_X + 8, y + 30)

  addFooter(doc, payload)

  return doc
}

export const canShareMenuPdf = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function'

export const downloadMenuPdf = async (payload: MenuPdfPayload) => {
  const doc = await createMenuPdfDocument(payload)
  const fileName = buildMenuPdfFileName(payload.menu.name)

  doc.save(fileName)

  return fileName
}

export const buildMenuPdfFile = async (payload: MenuPdfPayload) => {
  const doc = await createMenuPdfDocument(payload)
  const fileName = buildMenuPdfFileName(payload.menu.name)
  const pdfBlob = doc.output('blob')

  return new File([pdfBlob], fileName, {
    type: 'application/pdf',
  })
}

export const shareMenuPdf = async (payload: MenuPdfPayload) => {
  if (!canShareMenuPdf()) {
    throw new Error('Tu navegador no permite compartir PDFs desde esta pantalla.')
  }

  const file = await buildMenuPdfFile(payload)
  const sharePayload = {
    title: sanitizePdfText(payload.menu.name || 'Menu'),
    text: sanitizePdfText(`Menu exportado desde Mentras: ${payload.menu.name}`),
    files: [file],
  }

  if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
    throw new Error('Este dispositivo no soporta compartir archivos PDF desde el navegador.')
  }

  await navigator.share(sharePayload)
}
