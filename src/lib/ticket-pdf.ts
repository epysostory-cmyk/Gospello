import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface TicketData {
  eventTitle: string
  eventDate: string
  eventLocation: string
  attendeeName: string
  attendeeEmail: string
  ticketNumber: number
  registrationType: 'free_registration' | 'paid'
}

/**
 * Generates a PDF ticket and returns the raw bytes.
 * Call Buffer.from(bytes).toString('base64') to get a base64 string for email attachments.
 */
export async function generateTicketPdf(data: TicketData): Promise<Uint8Array> {
  const doc = await PDFDocument.create()

  // Landscape ticket: 600 x 260 pts
  const page = doc.addPage([600, 260])
  const { width, height } = page.getSize()

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica)

  // ── Background ────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) })

  // ── Left dark panel (branding) ────────────────────────────
  const panelW = 160
  page.drawRectangle({
    x: 0, y: 0, width: panelW, height,
    color: rgb(0.192, 0.173, 0.435), // indigo-900
  })

  // Gospello wordmark
  page.drawText('GOSPELLO', {
    x: 18, y: height - 46,
    size: 15,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  // Divider line in left panel
  page.drawLine({
    start: { x: 18, y: height - 55 },
    end:   { x: panelW - 18, y: height - 55 },
    thickness: 0.5,
    color: rgb(1, 1, 1, 0.3),
  })

  // "TICKET" label
  page.drawText('EVENT TICKET', {
    x: 18, y: height - 80,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.78, 1),
    opacity: 0.9,
  })

  // Ticket number in large text
  const ticketStr = `#${String(data.ticketNumber).padStart(4, '0')}`
  page.drawText(ticketStr, {
    x: 18, y: height - 110,
    size: 26,
    font: fontBold,
    color: rgb(1, 1, 1),
  })

  // Ticket type badge
  const typeLabel = data.registrationType === 'paid' ? 'PAID' : 'FREE'
  const typeColor = data.registrationType === 'paid' ? rgb(0.98, 0.74, 0.16) : rgb(0.22, 0.87, 0.53)
  page.drawText(typeLabel, {
    x: 18, y: height - 145,
    size: 9,
    font: fontBold,
    color: typeColor,
  })

  // gospello.ng at bottom of left panel
  page.drawText('gospello.ng', {
    x: 18, y: 18,
    size: 8,
    font: fontRegular,
    color: rgb(0.8, 0.78, 1),
    opacity: 0.7,
  })

  // ── Tear-off perforation line ─────────────────────────────
  const perf = panelW + 1
  for (let y = 10; y < height - 10; y += 10) {
    page.drawLine({
      start: { x: perf, y },
      end:   { x: perf, y: y + 5 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    })
  }

  // ── Right content area ────────────────────────────────────
  const contentX = panelW + 22
  const maxW = width - contentX - 18

  // Event title
  const titleSize = data.eventTitle.length > 38 ? 16 : 20
  page.drawText(data.eventTitle, {
    x: contentX, y: height - 44,
    size: titleSize,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.2),
    maxWidth: maxW,
    lineHeight: titleSize + 4,
  })

  // Separator line
  page.drawLine({
    start: { x: contentX, y: height - 72 },
    end:   { x: width - 18, y: height - 72 },
    thickness: 0.5,
    color: rgb(0.88, 0.88, 0.92),
  })

  // Date + location row
  page.drawText('DATE', {
    x: contentX, y: height - 92,
    size: 7, font: fontBold,
    color: rgb(0.5, 0.5, 0.6),
  })
  page.drawText(data.eventDate, {
    x: contentX, y: height - 105,
    size: 11, font: fontRegular,
    color: rgb(0.15, 0.15, 0.25),
  })

  page.drawText('LOCATION', {
    x: contentX + 200, y: height - 92,
    size: 7, font: fontBold,
    color: rgb(0.5, 0.5, 0.6),
  })
  page.drawText(data.eventLocation, {
    x: contentX + 200, y: height - 105,
    size: 11, font: fontRegular,
    color: rgb(0.15, 0.15, 0.25),
    maxWidth: maxW - 200,
  })

  // Another separator
  page.drawLine({
    start: { x: contentX, y: height - 122 },
    end:   { x: width - 18, y: height - 122 },
    thickness: 0.5,
    color: rgb(0.88, 0.88, 0.92),
  })

  // Attendee name + email
  page.drawText('TICKET HOLDER', {
    x: contentX, y: height - 142,
    size: 7, font: fontBold,
    color: rgb(0.5, 0.5, 0.6),
  })
  page.drawText(data.attendeeName, {
    x: contentX, y: height - 155,
    size: 13, font: fontBold,
    color: rgb(0.1, 0.1, 0.2),
    maxWidth: maxW,
  })
  page.drawText(data.attendeeEmail, {
    x: contentX, y: height - 171,
    size: 9, font: fontRegular,
    color: rgb(0.45, 0.45, 0.55),
  })

  // Bottom strip
  page.drawRectangle({
    x: panelW + 2, y: 0,
    width: width - panelW - 2, height: 36,
    color: rgb(0.97, 0.97, 0.99),
  })
  page.drawText('This ticket was issued by Gospello. Present at the event entrance.', {
    x: contentX, y: 12,
    size: 7.5, font: fontRegular,
    color: rgb(0.55, 0.55, 0.65),
  })

  return doc.save()
}
