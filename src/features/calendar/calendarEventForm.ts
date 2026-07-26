import dayjs from 'dayjs'

export const DATE_TIME_TYPE = {
    date: '날짜',
    dateTime: '날짜-시간'
} as const

export type DateTimeType = typeof DATE_TIME_TYPE[keyof typeof DATE_TIME_TYPE]

export interface CalendarEventDraft {
    calendarId: string
    summary: string
    timeType: DateTimeType
    startTime: string
    endTime: string
    colorId: number
}

export interface CalendarEventInput {
    calendarId: string
    isAllDay: boolean
    start: string
    end: string
    title: string
    content: string
    colorId: number
}

interface EditableCalendarEvent {
    title: string
    start: Date | null
    end: Date | null
    extendedProps: {
        description?: string | null
        e?: {
            colorId?: string
        }
    }
}

const DATE_FORMAT = 'YYYY-MM-DD'
const DATE_TIME_FORMAT = 'YYYY-MM-DD hh:mm A'

export const createCalendarEventDraft = (): CalendarEventDraft => ({
    calendarId: '',
    summary: '',
    timeType: DATE_TIME_TYPE.date,
    startTime: new Date().toString(),
    endTime: '',
    colorId: 1
})

export const resetCalendarEventDraft = (draft: CalendarEventDraft) => {
    draft.startTime = ''
    draft.endTime = ''
    draft.summary = ''
    draft.colorId = 1
}

export const toCalendarEventInput = (
    draft: CalendarEventDraft,
    content: string
): CalendarEventInput => {
    const isAllDay = draft.timeType === DATE_TIME_TYPE.date
    let start = draft.startTime
    let end = draft.endTime || start

    // Google Calendar uses an exclusive end date for all-day events. This
    // retains the existing renderer behavior for both form modes.
    end = dayjs(end).add(1, 'd').format(DATE_FORMAT)

    if (!isAllDay) {
        start = dayjs(start).toISOString()
        end = dayjs(end).toISOString()
    }

    return {
        calendarId: draft.calendarId,
        isAllDay,
        start,
        end,
        title: draft.summary,
        content,
        colorId: draft.colorId
    }
}

export const applyCalendarEventToDraft = (
    draft: CalendarEventDraft,
    event: EditableCalendarEvent
): string => {
    draft.summary = event.title
    const format = draft.timeType === DATE_TIME_TYPE.date
        ? DATE_FORMAT
        : DATE_TIME_FORMAT
    draft.startTime = dayjs(event.start).format(format)
    draft.endTime = dayjs(event.end).subtract(1, 'd').format(format)
    draft.colorId = Number(event.extendedProps.e?.colorId) - 1

    return event.extendedProps.description ?? ''
}

export const formatDraftStartForTimeType = (
    startTime: string,
    timeType: DateTimeType
): string => dayjs(startTime).format(
    timeType === DATE_TIME_TYPE.date ? DATE_FORMAT : DATE_TIME_FORMAT
)

export const formatAddedDate = (
    date: string,
    timeType: DateTimeType
): string => timeType === DATE_TIME_TYPE.date
    ? date
    : dayjs(date).format(DATE_TIME_FORMAT)
