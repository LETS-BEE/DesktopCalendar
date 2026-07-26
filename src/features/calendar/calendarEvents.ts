import type { EventInput } from '@fullcalendar/vue3'
import type {
    CalendarColor,
    CalendarListEntry,
    GoogleCalendarColors
} from '../../services/desktopApi'

export interface GoogleCalendarEvent {
    id: string
    summary?: string
    colorId?: string
    description?: string
    created?: string
    htmlLink?: string
    organizer?: {
        email?: string
        displayName?: string
    }
    start: {
        date?: string
        dateTime?: string
    }
    end: {
        date?: string
        dateTime?: string
    }
    [key: string]: unknown
}

export interface SelectedCalendar {
    id: string
    color: CalendarColor
}

export const getSelectedCalendars = (
    calendars: CalendarListEntry[],
    colors: GoogleCalendarColors
): SelectedCalendar[] =>
    calendars
        .filter((calendar) => calendar.checked)
        .map((calendar) => ({
            id: calendar.id,
            color: colors.calendar[calendar.colorId ?? '']
        }))

export const toFullCalendarEvent = (
    event: GoogleCalendarEvent,
    calendarColor: CalendarColor,
    eventColors: GoogleCalendarColors['event']
): EventInput => {
    const color = event.colorId
        ? eventColors[event.colorId]
        : calendarColor

    const baseEvent: EventInput = {
        id: event.id,
        title: event.summary,
        start: event.start.dateTime ?? event.start.date,
        end: event.end.dateTime ?? event.end.date,
        color: color.background,
        contrastColor: color.foreground,
        e: event,
        organizer: event.organizer,
        description: event.description || null,
        created: event.created
    }

    if (event.start.dateTime) {
        baseEvent.allDay = false
    }

    return baseEvent
}
