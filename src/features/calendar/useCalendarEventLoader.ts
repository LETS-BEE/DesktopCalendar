import type { EventInput } from '@fullcalendar/vue3'
import {
    desktopApi,
    type CalendarListEntry,
    type GoogleCalendarColors
} from '../../services/desktopApi'
import {
    getSelectedCalendars,
    toFullCalendarEvent,
    type GoogleCalendarEvent
} from './calendarEvents'

export type CalendarEventLoadResult =
    | {
        status: 'loaded'
        events: EventInput[]
        colors: GoogleCalendarColors
    }
    | { status: 'unavailable' }
    | { status: 'failed' }

export const useCalendarEventLoader = () => {
    let latestRequest = 0

    const cancel = () => {
        latestRequest += 1
    }

    const load = async (
        calendars: CalendarListEntry[],
        start: string,
        end: string
    ): Promise<CalendarEventLoadResult | null> => {
        const request = ++latestRequest

        try {
            const colors = await desktopApi.getCalendarColors()
            if (request !== latestRequest) {
                return null
            }
            if (!colors) {
                return { status: 'unavailable' }
            }

            const selectedCalendars = getSelectedCalendars(calendars, colors)
            if (selectedCalendars.length === 0) {
                return { status: 'loaded', events: [], colors }
            }

            const results = await desktopApi.getBatchCalendarEvents(
                selectedCalendars.map((calendar) => calendar.id),
                start,
                end
            )
            if (request !== latestRequest) {
                return null
            }

            const events = selectedCalendars.flatMap((calendar) => {
                const response = results[calendar.id]
                const calendarEvents = response?.items as GoogleCalendarEvent[] | undefined
                if (!calendarEvents?.length) {
                    return []
                }

                return calendarEvents.map((event) =>
                    toFullCalendarEvent(event, calendar.color, colors.event)
                )
            })

            return { status: 'loaded', events, colors }
        } catch (error) {
            console.error(error)
            return request === latestRequest ? { status: 'failed' } : null
        }
    }

    return {
        load,
        cancel
    }
}
