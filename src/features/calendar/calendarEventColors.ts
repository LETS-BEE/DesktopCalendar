import type { CalendarColor } from '../../services/desktopApi'

const getLuminance = (color: string): number | undefined => {
    const hex = color.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1]
    if (!hex) {
        return undefined
    }
    const expanded = hex.length === 3
        ? hex.replace(/./g, (digit) => digit.repeat(2))
        : hex
    const [red, green, blue] = [0, 2, 4].map((index) => {
        const channel = parseInt(expanded.slice(index, index + 2), 16) / 255
        return channel <= 0.04045
            ? channel / 12.92
            : ((channel + 0.055) / 1.055) ** 2.4
    })
    return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

const getContrast = (first: number, second: number) =>
    (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)

export const getCalendarEventTextColor = (color: CalendarColor): string => {
    const background = getLuminance(color.background)
    const foreground = getLuminance(color.foreground)
    if (background === undefined) {
        return color.foreground
    }
    // Keep Google's foreground when it has enough contrast for small event labels.
    if (foreground !== undefined && getContrast(background, foreground) >= 4.5) {
        return color.foreground
    }
    return getContrast(background, 0) >= getContrast(background, 1)
        ? '#000000'
        : '#ffffff'
}
