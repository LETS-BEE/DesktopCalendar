interface PopupAnchor {
    left: number
    right: number
    top: number
    bottom: number
}

interface Size {
    width: number
    height: number
}

export const getCalendarPopupPosition = (
    anchor: PopupAnchor,
    popup: Size,
    viewport: Size,
    calendarRight = viewport.width,
    margin = 20
) => {
    const right = Math.min(calendarRight, viewport.width) - margin
    const maxLeft = Math.max(margin, right - popup.width)
    const preferredLeft = anchor.left + popup.width > right
        ? anchor.right - popup.width
        : anchor.left
    const above = anchor.bottom + popup.height > viewport.height - margin
    const preferredTop = above ? anchor.top - popup.height : anchor.bottom
    const maxTop = Math.max(margin, viewport.height - margin - popup.height)

    return {
        left: Math.round(Math.max(margin, Math.min(preferredLeft, maxLeft))),
        top: Math.round(Math.max(margin, Math.min(preferredTop, maxTop))),
        above
    }
}
