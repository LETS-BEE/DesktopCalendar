export interface CalendarRefreshScheduler {
    start: (refreshSeconds: string | number) => void
    update: (refreshSeconds: string | number) => void
    stop: () => void
}

export const createCalendarRefreshScheduler = (
    refresh: () => void
): CalendarRefreshScheduler => {
    let interval: ReturnType<typeof setInterval> | undefined
    let listeningForOnline = false

    const clearTimer = () => {
        if (interval !== undefined) {
            clearInterval(interval)
            interval = undefined
        }
    }

    const update = (refreshSeconds: string | number) => {
        clearTimer()
        interval = setInterval(refresh, parseInt(String(refreshSeconds), 10) * 1000)
    }

    const start = (refreshSeconds: string | number) => {
        update(refreshSeconds)
        if (!listeningForOnline) {
            window.addEventListener('online', refresh)
            listeningForOnline = true
        }
    }

    const stop = () => {
        clearTimer()
        if (listeningForOnline) {
            window.removeEventListener('online', refresh)
            listeningForOnline = false
        }
    }

    return {
        start,
        update,
        stop
    }
}
