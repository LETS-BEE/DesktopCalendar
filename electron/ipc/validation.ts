import type {
  BatchCalendarEventsQuery,
  CalendarEventsQuery,
  CalendarList,
  DeleteCalendarEventPayload,
  InsertCalendarEventPayload,
  SettingDataPayload,
  WindowSizePayload,
} from '../../shared/ipc'

const MAX_CALENDARS = 10_000
const MAX_MEMO_LENGTH = 1_000_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(
  value: unknown,
  name: string,
  maxLength = 10_000,
) {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.length > maxLength
  ) {
    throw new TypeError(`${name} must be a non-empty string`)
  }
  return value
}

function requireIsoDate(value: unknown, name: string) {
  const date = requireString(value, name, 100)
  if (!Number.isFinite(Date.parse(date))) {
    throw new TypeError(`${name} must be a valid date`)
  }
  return date
}

function requireFiniteNumber(value: unknown, name: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number`)
  }
  return value
}

export function parseBoolean(value: unknown, name: string) {
  if (typeof value !== 'boolean') {
    throw new TypeError(`${name} must be a boolean`)
  }
  return value
}

export function parseMemo(value: unknown) {
  if (typeof value !== 'string' || value.length > MAX_MEMO_LENGTH) {
    throw new TypeError('memo must be a string no longer than 1 MB')
  }
  return value
}

export function parseExternalUrl(value: unknown) {
  const url = new URL(requireString(value, 'url', 2048))
  const allowedHosts = new Set(['calendar.google.com', 'www.google.com'])
  if (
    url.protocol !== 'https:'
    || !allowedHosts.has(url.hostname)
    || url.username
    || url.password
  ) {
    throw new TypeError('Only approved HTTPS Google Calendar links are allowed')
  }
  return url.toString()
}

export function parseCalendarList(value: unknown): CalendarList {
  let parsed = value
  if (typeof value === 'string') {
    if (value.length > 5_000_000) {
      throw new TypeError('calendar list payload is too large')
    }
    parsed = JSON.parse(value) as unknown
  }

  if (
    !Array.isArray(parsed)
    || parsed.length > MAX_CALENDARS
    || parsed.some((item) => !isRecord(item))
  ) {
    throw new TypeError('calendar list must be an array of objects')
  }
  return parsed as CalendarList
}

export function parseWindowSize(
  first: unknown,
  second?: unknown,
): WindowSizePayload {
  const payload = isRecord(first)
    ? first
    : { width: first, height: second }
  const width = requireFiniteNumber(payload.width, 'width')
  const height = requireFiniteNumber(payload.height, 'height')
  if (width <= 0 || height <= 0 || width > 32_768 || height > 32_768) {
    throw new RangeError('window dimensions are outside the supported range')
  }
  return { width: Math.round(width), height: Math.round(height) }
}

export function parseSettingData(
  first: unknown,
  second?: unknown,
): SettingDataPayload {
  const payload = isRecord(first)
    ? first
    : { key: first, value: second }
  return {
    key: requireString(payload.key, 'key', 200),
    value: requireString(payload.value, 'value', 1_000_000),
  }
}

export function parseCalendarEventsQuery(
  first: unknown,
  second?: unknown,
  third?: unknown,
): CalendarEventsQuery {
  const payload = isRecord(first)
    ? first
    : { calendarId: first, start: second, end: third }
  return {
    calendarId: requireString(payload.calendarId, 'calendarId', 1024),
    start: requireIsoDate(payload.start, 'start'),
    end: requireIsoDate(payload.end, 'end'),
  }
}

export function parseBatchCalendarEventsQuery(
  first: unknown,
  second?: unknown,
  third?: unknown,
): BatchCalendarEventsQuery {
  const payload = isRecord(first)
    ? first
    : { calendarIds: first, start: second, end: third }
  if (
    !Array.isArray(payload.calendarIds)
    || payload.calendarIds.length > MAX_CALENDARS
  ) {
    throw new TypeError('calendarIds must be an array')
  }

  return {
    calendarIds: payload.calendarIds.map((calendarId) =>
      requireString(calendarId, 'calendarId', 1024)),
    start: requireIsoDate(payload.start, 'start'),
    end: requireIsoDate(payload.end, 'end'),
  }
}

export function parseDeleteCalendarEvent(
  first: unknown,
  second?: unknown,
): DeleteCalendarEventPayload {
  const payload = isRecord(first)
    ? first
    : { calendarId: first, eventId: second }
  return {
    calendarId: requireString(payload.calendarId, 'calendarId', 1024),
    eventId: requireString(payload.eventId, 'eventId', 2048),
  }
}

export function parseInsertCalendarEvent(
  first: unknown,
  ...legacy: unknown[]
): InsertCalendarEventPayload {
  const payload = isRecord(first)
    ? first
    : {
      calendarId: first,
      allDay: legacy[0],
      start: legacy[1],
      end: legacy[2],
      title: legacy[3],
      content: legacy[4],
      colorId: legacy[5],
    }
  return {
    calendarId: requireString(payload.calendarId, 'calendarId', 1024),
    allDay: parseBoolean(payload.allDay, 'allDay'),
    start: requireIsoDate(payload.start, 'start'),
    end: requireIsoDate(payload.end, 'end'),
    title: requireString(payload.title, 'title', 4096),
    content: typeof payload.content === 'string' && payload.content.length <= MAX_MEMO_LENGTH
      ? payload.content
      : (() => { throw new TypeError('content must be a string no longer than 1 MB') })(),
    colorId: requireFiniteNumber(payload.colorId, 'colorId'),
  }
}
