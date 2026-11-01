import { desktopApi } from '../../services/desktopApi'

export const enableMouse = () => {
    desktopApi.enableMouse()
}

export const disableMouse = (event?: MouseEvent): boolean => {
    const target = event?.currentTarget
    if (event && target instanceof Element) {
        const position = target.getBoundingClientRect()
        if (
            event.clientX > position.left &&
            event.clientY > position.top &&
            event.clientX < position.left + position.width &&
            event.clientY < position.top + position.height
        ) {
            return true
        }
    }

    desktopApi.disableMouse()
    return false
}
