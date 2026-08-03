/**
 * @deprecated Compatibility facade for the legacy IPC layer.
 * New main-process code should import from services/google directly.
 */
import type { CalendarList } from '../shared/ipc'
import {
  deleteCalendarEvent,
  fetchCalendarList,
  getBatchCalendarEvents,
  getCalendarColors,
  getCalendarEvents,
  getCalendarList,
  insertCalendarEvent,
  saveCalendarList,
} from './services/google/calendar'
import {
  ensureAuthorization,
} from './services/google/oauth'

export function useAuthorize(callback: (accessToken?: unknown) => void) {
  void ensureAuthorization(true)
    .then(() => callback())
    .catch((error) => console.error('Google authorization failed', error))
}

export async function useAsyncAuthorize() {
  return ensureAuthorization(false)
}

export function useCalendarList(callback: (data: { items: CalendarList } | null) => void) {
  void fetchCalendarList()
    .then((items) => callback({ items }))
    .catch((error) => {
      console.error('Unable to fetch the Google calendar list', error)
      callback(null)
    })
}

export function useSaveCalendarList(data: CalendarList | string) {
  try {
    const calendarList = typeof data === 'string'
      ? JSON.parse(data) as CalendarList
      : data
    void saveCalendarList(calendarList)
      .catch((error) => console.error('Unable to save calendar list', error))
  } catch (error) {
    console.error('Unable to parse calendar list', error)
  }
}

export const useAsyncCalendarList = getCalendarList
export const useGetCalendarColor = getCalendarColors
export const useGetCalendarEvents = getCalendarEvents
export const useGetBatchCalendarEvents = getBatchCalendarEvents
export const useDeleteCalendarEvent = deleteCalendarEvent
export const useInsertCaledarEvent = insertCalendarEvent
