import type { RgbaColor } from '../stores/desktopCalendar'

export function convertColor(mode: string, color: RgbaColor): string | RgbaColor {
    if (mode === 'hex') {
        const r = color.r.toString(16).padStart(2, '0')
        const g = color.g.toString(16).padStart(2, '0')
        const b = color.b.toString(16).padStart(2, '0')
        const a = Math.round(color.a * 255).toString(16).padStart(2, '0')
        return `#${r}${g}${b}${a}`
    }

    if (mode === 'rgba') {
        return {
            r: 255,
            g: 255,
            b: 255,
            a: 0.3
        }
    }

    return '#FFFFFFFF'
}
