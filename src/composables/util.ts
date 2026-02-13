import { defineStore, Store } from 'pinia'
import { Ref } from 'vue'
import dayjs from 'dayjs'

interface State {
    options: {
        timeMoment: string,
        timerStyle: {
            color: string,
            weight: string | number,
            size: string | number
        },
        calendar: {
            background: {
                r: number,
                g: number,
                b: number,
                a: number
            },
            color: {
                r: number,
                g: number,
                b: number,
                a: number
            },
            buttonType: string
        },
        calendarType: string,
        calendarHeight: string | number,
        refreshTime: string | number
    }
    // [key: string]: {
    //     [key: string]: {
    //         [key: string]: {
    //             [key: string]: string | number
    //         } | string | number
    //     } | string | number
    // } | string | number
}

const LS_STORE_NAME = 'DeskCalSettings'

const getDefaultSettings = () => ({
    timeMoment: "LTS",
    timerStyle: {
        color: "black",
        weight: "600",
        size: "6em"
    },
    calendar: {
        background: {
            r: 255,
            g: 255,
            b: 255,
            a: 0.3
        },
        color: {
            r: 0,
            g: 0,
            b: 0,
            a: 1
        },
        buttonType: "primary"
    },
    calendarType: "week",
    calendarHeight: "1.0",
    refreshTime: 600
})

const getSettings = () => {
    const settings = localStorage.getItem(LS_STORE_NAME)

    return settings ? JSON.parse(settings) : getDefaultSettings()
}

export const useDeskCalStore = defineStore('DesktopCalendar-Property', {
    state: (): State => ( {
        options: getSettings()
    }),
    getters: {
        getOptions: (state) => {
            // @ts-ignore
            return (index:string) => state.options[index]
        },
        getAll: (state) => state.options
    },
    actions: {
        setOption(key:any, value:any) {
            // @ts-ignore
            this.options[key] = value
            localStorage.setItem(LS_STORE_NAME, JSON.stringify(this.options))
        },
        // @ts-ignore
        setOptions(payload) { 
            //@ts-ignore
            this.options[payload.key] = payload.value
            localStorage.setItem(LS_STORE_NAME, JSON.stringify(this.options))
        },
        // @ts-ignore
        setAll(payload) { 
            // @ts-ignore
            this.options = payload
            localStorage.setItem(LS_STORE_NAME, JSON.stringify(this.options))
        }
    }
})

export interface DesktopCalStore extends Store<"DesktopCalendar-Property", State, any> {
    getOptions: (index:string) => any,
    getAll: () => State,
    setOption: (key:string, value:any) => void,
    setOptions: (payload: any) => void,
    setAll: (payload:any) => void
}

// const win = getCurrentWindow()
export const useEnableMouse = () => {
    window.ipcRenderer.send('enableMouse')
    // win.setIgnoreMouseEvents(false)
}

export const useDisableMouse = (e?:any) => {
    if (e) {
        const pos = e.currentTarget.getBoundingClientRect()
        if ( e.clientX > pos.left && e.clientY > pos.top && e.clientX < pos.left + pos.width && e.clientY < pos.top + pos.height ) {
            return true
        }
    }
    window.ipcRenderer.send('disableMouse')
    // win.setIgnoreMouseEvents(true, { forward: true })
}

export const useGoogleAuth = (isAuthed:Ref<boolean>, calendarList:Ref<Array<any>>) => {
    window.ipcRenderer.send('googleLoginAuth')
    window.ipcRenderer.on('isAuthed', (_event, bAuthed) => {
        isAuthed.value = bAuthed
    })
    window.ipcRenderer.on('CalendarList', (_event, data) => {
        calendarList.value = data
    })
}

export const useSaveCalendar = (calendarList:Ref<Array<any>>) => {
    const data = JSON.stringify(calendarList.value)
    // console.log(data, calendarList.value)
    window.ipcRenderer.send('saveCalendarList', data)
}

export const useGetCalendarList = () => {
    return window.ipcRenderer.invoke('getCalendarList')
}

export const useGetCalColor = (callback: (res:any) => void) => {
    window.ipcRenderer.invoke('justGoogleAuth')
    .then(() => {
        window.ipcRenderer.invoke('getCalendarColor')
        .then((res) => {
            callback(res)
        })
    })
}

export const useSetAutoStartProgram = (openAtLogin:boolean) => {
    window.ipcRenderer.send('setAutoStartProgram', openAtLogin)
}

export const useGetAutoStartProgram = async () => {
    var data = await window.ipcRenderer.invoke('getAutoStartProgram')
    return data
}

export const useSettingEnd = () => {
    window.ipcRenderer.send('setting-end')
}

export const useNoteMemoStore = async (noteMemo?:string) => {
    var memo = ""
    if (noteMemo) {
        window.ipcRenderer.send('saveNoteMemo', noteMemo)
    } else {
        memo = await window.ipcRenderer.invoke('getNoteMemo')
    }
    return memo
}

export const useOpenExternalLink = (link:string) => {
    window.ipcRenderer.send("openExternalLink", link)
}

export const useGetCalendarEvents = async (id:string, start:string, end:string, callback: (events:any)=>void) => {
    // start = dayjs(start).format("YYYY-MM-DD[T]HH:mm:ss[Z]")
    // end = dayjs(end).format("YYYY-MM-DD[T]HH:mm:ss[Z]")
    start = dayjs(start).toISOString()
    end = dayjs(end).toISOString()

    window.ipcRenderer.invoke('getCalendarEvents', id, start, end)
    .then((events) => {
        callback(events)
    })
}

export const useGetBatchCalendarEvents = async (ids: string[], start: string, end: string, callback: (results: Record<string, any>) => void) => {
    start = dayjs(start).toISOString()
    end = dayjs(end).toISOString()

    window.ipcRenderer.invoke('getBatchCalendarEvents', ids, start, end)
    .then((results) => {
        callback(results)
    })
}

export const useDeleteCalendarEvent = async (email:string, id:string, callback:(res:any) => void) => {
    window.ipcRenderer.invoke('deleteCalEvent', email, id)
    .then((req) => {
        callback(req)
    }).catch((err) => {
        console.error(err)
    })
}

export const useInsertCaledarEvent = async (calId:string, isDay:boolean, start:string, end:string, title:string, content:string, colorid:number, callback:(req:any) => void) => {
    window.ipcRenderer.invoke('insertCalEvent', calId, isDay, start, end, title, content, colorid)
        .then((req) => {
            // console.log(req)
            callback(req)
        })
        .catch((err) => {
            console.error(err)
        })
}

export const useSettingWindow = () => {
    window.ipcRenderer.send('openSettingWindow')
}

export const useGetAppVersion = async () => {
    return await window.ipcRenderer.invoke("getAppVersion")
}

export const useSendMainSettingData = (key:string, value:any) => {
    window.ipcRenderer.send('sendMainSettingData', key, JSON.stringify(value))
}
export const useRequstReloadCalendar = () => {
    window.ipcRenderer.send('requstReloadCalendar')
}
export const useSetProgramSize = (width:number, height:number) => {
    if (isFinite(width) && isFinite(height) && width > 0 && height > 0) {
        window.ipcRenderer.send("setWindowSize", width, height)
    }
}

export const useGetProgramSize = async () => {
    var buf = await window.ipcRenderer.invoke("getWindowSize")
    return JSON.parse(buf)
}

export const useDeleteToken = (calendarList:Ref<Array<any>>) => {
    window.ipcRenderer.send('deleteToken')
    window.ipcRenderer.on('resetCalendarList', (_event, data) => {
        calendarList.value = data
    })
}

export const useRestartApp = () => {
    window.ipcRenderer.send("restartApp")
}

export function convertColor(mode:string, color:any) {
    if (mode == 'hex') {
        var r = color.r.toString(16).padStart(2, '0')
        var g = color.g.toString(16).padStart(2, '0')
        var b = color.b.toString(16).padStart(2, '0')
        var a = Math.round(color.a * 255).toString(16).padStart(2, '0')
        // console.log(r, g, b, a, `#${r}${g}${b}${a}`)
        return `#${r}${g}${b}${a}`
    } else if (mode == 'rgba') {
        // console.log(color)
        return {
            r: 255,
            g: 255,
            b: 255,
            a: 0.3
        }
    } else {
        // black
        return "#FFFFFFFF"
    }
}