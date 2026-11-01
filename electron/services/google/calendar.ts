import { dialog } from 'electron'
import { ofetch, type FetchOptions } from 'ofetch'
import type { CalendarList, CalendarListEntry } from '../../../shared/ipc'
import {
  readCalendarList,
  writeCalendarList,
} from '../../persistence/app-data'
import { ensureAuthorization, getValidAccessToken } from './oauth'

interface GoogleCalendarListResponse {
  items?: CalendarListEntry[]
}

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3'
const BATCH_SIZE = 5

function normalizeCalendarList(items: CalendarListEntry[] = []): CalendarList {
  return items.map((item) => ({
    ...item,
    checked: true,
    ...(item.primary ? { isprimary: true } : {}),
  }))
}

async function requestGoogleApi<T>(
  url: string,
  options: FetchOptions<'json'> = {},
) {
  const accessToken = await getValidAccessToken()
  const headers = new Headers(options.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  return ofetch<T>(url, { ...options, headers })
}

export async function fetchCalendarList() {
  const response = await requestGoogleApi<GoogleCalendarListResponse>(
    `${GOOGLE_CALENDAR_API}/users/me/calendarList?showHidden=true`,
  )
  return normalizeCalendarList(response.items)
}

export async function saveCalendarList(calendarList: CalendarList) {
  await writeCalendarList(calendarList)
}

export async function getCalendarList() {
  const saved = await readCalendarList()
  if (saved) {
    return saved
  }

  try {
    if (!await ensureAuthorization(false)) {
      return null
    }
    const calendarList = await fetchCalendarList()
    await saveCalendarList(calendarList)
    return calendarList
  } catch (error) {
    console.error('Unable to load Google calendars', error)
    dialog.showErrorBox(
      'Google Auth Error',
      `Google 로그인 또는 캘린더 정보 저장에 실패했습니다.\n${String(error)}`,
    )
    return null
  }
}

export async function getCalendarColors() {
  try {
    return await requestGoogleApi(`${GOOGLE_CALENDAR_API}/colors`)
  } catch (error) {
    console.error('Unable to load Google calendar colors', error)
    return null
  }
}

export async function getCalendarEvents(
  calendarId: string,
  start: string,
  end: string,
) {
  try {
    return await requestGoogleApi(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        params: {
          timeMin: start,
          timeMax: end,
          timeZone: 'Asia/Seoul',
        },
      },
    )
  } catch (error) {
    console.error(`Unable to load calendar ${calendarId}`, error)
    return null
  }
}

export async function getBatchCalendarEvents(
  calendarIds: string[],
  start: string,
  end: string,
) {
  const results: Record<string, unknown> = {}

  for (let index = 0; index < calendarIds.length; index += BATCH_SIZE) {
    const chunk = calendarIds.slice(index, index + BATCH_SIZE)
    const chunkResults = await Promise.all(
      chunk.map(async (calendarId) => ({
        calendarId,
        events: await getCalendarEvents(calendarId, start, end),
      })),
    )

    for (const result of chunkResults) {
      if (result.events) {
        results[result.calendarId] = result.events
      }
    }
  }

  return results
}

export async function deleteCalendarEvent(
  calendarId: string,
  eventId: string,
) {
  try {
    return await requestGoogleApi(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: 'DELETE' },
    )
  } catch (error) {
    console.error('Unable to delete the calendar event', error)
    return null
  }
}

export async function insertCalendarEvent(
  calendarId: string,
  allDay: boolean,
  start: string,
  end: string,
  title: string,
  content: string,
  colorId: number,
) {
  const body: Record<string, unknown> = {
    summary: title,
    description: content,
    colorId,
    start: allDay ? { date: start.split('T')[0] } : { dateTime: start },
    end: allDay ? { date: end.split('T')[0] } : { dateTime: end },
  }

  try {
    return await requestGoogleApi(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      { method: 'POST', body },
    )
  } catch (error) {
    console.error('Unable to insert the calendar event', error)
    return null
  }
}
