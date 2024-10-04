// https://devbaji.github.io/vue3-google-login/#automatic-login
// https://github.com/unjs/ofetch

import { ofetch , FetchOptions } from 'ofetch'
import { app, BrowserWindow, dialog } from 'electron'

import { OAuth2Client, Credentials } from 'google-auth-library'
// let OAuth2Client = window.googleapi.OAuth2Client
// let Credentials = window.googleapi.Credentials
import fs from 'fs'
import path from 'path'

import credentials from './private/credentials.json'

const TOKEN_PATH = path.join(app.getPath("userData"), "token.json")
const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
];

const client = new OAuth2Client(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
)

var APIKEY: string | null | undefined
let popupWin: BrowserWindow | null

function useAuthorize(parentWin:BrowserWindow, callback: (key?:any) => void) {    
    fs.readFile(TOKEN_PATH, (err, buf) => {
        if (err || !buf) {
            getAccessToken(client, parentWin, callback)
            return
        }

        const token = JSON.parse(buf.toString()) as Credentials
        client.setCredentials(token)
        APIKEY = token.access_token
        // 1000ms => 1s * 60 => 1m * 60 => 1h * 2
        setInterval(() => { refreshToken(client) }, 2 * 60 * 60 * 1000)
        
        if (token.expiry_date) {
            var nowDate = new Date()
            nowDate.setMinutes(nowDate.getMinutes() + 30)
            if (token.expiry_date > nowDate.getTime()) {
                callback(APIKEY)
            } else {
                refreshToken(client, callback)
            }
        } else {
            refreshToken(client, callback)
        }
    })
}

// 로그인 된 계정 재인증
async function useAsyncAuthorize(parentWin:BrowserWindow) {
    try {
        var buf = fs.readFileSync(TOKEN_PATH)
        var token:Credentials
        if (buf) {
            token = JSON.parse(buf.toString()) as Credentials
            
            client.setCredentials(token)
            APIKEY = token.access_token

            if (token.expiry_date) {
                var nowDate = new Date()
                nowDate.setMinutes(nowDate.getMinutes() + 30)
                if (token.expiry_date < nowDate.getTime()) {
                    await refreshAsyncToken(client)
                }
            }
            
            return true
        } else {
            getAccessToken(client, parentWin)
            return false
        }
    } catch(err) {
        console.error(err)
        return false
    }
}

function useCalendarList(callback: (data:any) => void) {
    useRequestFetch(
        "https://www.googleapis.com/calendar/v3/users/me/calendarList?showHidden=true",
        callback
    )
}

function getAPIKEY() {
    return APIKEY
}

function getAccessToken(client: OAuth2Client, parentWin:BrowserWindow, callback?: (key:any) => void) {
    const authUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
    })
    
    if (popupWin == null || popupWin == undefined) {
        popupWin = new BrowserWindow({
            parent: parentWin,
            modal: true,
            height: 850,
            transparent: false,
            frame: true
        })

        popupWin.setIgnoreMouseEvents(false)
        popupWin.setMenuBarVisibility(false)
        popupWin.loadURL(authUrl)
        popupWin.on("closed", () => {
            popupWin = null
        })
        popupWin.webContents.on("will-redirect", (_event, url) => {
            if (url.indexOf("http://localhost") == 0) {
                var params = url.split('?')[1]
                var searchParam = new URLSearchParams(params)
                // console.log(searchParam)
                const code = searchParam.get('code')
                if (code == null) {
                    var err = "createToken: code is null"
                    console.error(err)
                    return
                }
                createToken(client, code, callback)
                popupWin?.close()
            }
        })
    }
}

function createToken(client: OAuth2Client, code:string, callback?: (key:any) => void) {
    client.getToken(code, (err:any, token:any) => {
        if (err || token == null || token == undefined) {
            console.error("Error Create Token", err)
            return
        }
        client.setCredentials(token)
        fileWrite(token, callback)
    })
}

function refreshToken(client: OAuth2Client, callback?: (key:any) => void) {
    client.refreshAccessToken((err:any, token:any) => {
        if (err || token == null || token == undefined) {
            console.error("Error Refresh Token", err)
            return
        }
        fileWrite(token, callback)
    })
}

async function refreshAsyncToken(client: OAuth2Client) {
    var token
    
    try {
        token = await client.refreshAccessToken()

        return fileAsyncWrite(token.credentials)
    } catch (err) {
        console.error("Error Refresh Token", err)
        return false
    }
}

function fileWrite(token: Credentials, callback?: (key:any) => void ) {
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) {
            console.error("Error Write Token", err)
            return
        }
        APIKEY = token.access_token
        if (callback) {
            callback(APIKEY)
        }
    })
}

function fileAsyncWrite(token:Credentials) {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token))
    APIKEY = token.access_token
    return true
}

function useRequestFetch(url:string, callback: (data:any) => void) {
    useAsyncRequestFetch(url, {
        method: 'GET',
    })
    .then(callback)
    .catch((err) => {
        if (err) {
            console.error(err)
            callback(null)
        }
    })
}

async function useAsyncRequestFetch(url:string, options?: FetchOptions){
    if (options) {
        if (options.headers) {
            // @ts-ignore
            options.headers["Authorization"] = "Bearer " + getAPIKEY()
        } else {
            options.headers = {
                Authorization: "Bearer " + getAPIKEY()
            }
        }
    } else {
        options = {
            headers: {
                Authorization: "Bearer " + getAPIKEY()
            }
        }
    }
    
    return await ofetch(url, options)
}

function useSaveCalendarList(data:any) {
    fs.writeFile(
        path.join(app.getPath('userData'), "calendar.json"),
        JSON.stringify(data),
        (err) => {
            if (err) {
                console.error(err)
            }
        }
    )
}

async function useAsyncCalendarList(parentWin:BrowserWindow) {
    try {
        var buf = fs.readFileSync(path.join(app.getPath('userData'), 'calendar.json'))
        // console.log(buf.toString())
        if (buf.toString() == '') {
            return '[]'
        } else {
            return JSON.parse(buf.toString())
        }
    } catch (e) {
        console.error(e)
        try {
            await useAsyncAuthorize(parentWin)
            
            var data = await useAsyncRequestFetch(
                "https://www.googleapis.com/calendar/v3/users/me/calendarList?showHidden=true"
            )

            let calList = data.items.map((item:any) => {
                var obj = Object.assign({}, item)
                obj.checked = true
                if (item.primary) {
                    obj.isprimary = true
                }
                return obj
            })

            useSaveCalendarList(JSON.stringify(calList))
            return calList
        } catch(e) {
            dialog.showErrorBox("Google Auth Error", "로그인 및 달력 정보 저장에 문제가 있습니다. 프로그램 삭제 후 재설치 해주세요.\n" + e)
            return null
        }
    }
}

async function useGetCalendarColor() {
    try {
        var data = await useAsyncRequestFetch("https://www.googleapis.com/calendar/v3/colors")
        
        return data
    } catch(e) {
        console.error(e)
        return null
    }
}

async function useGetCalendarEvents(id:string, start:string, end:string, ) {
    try {
        var calEvents = await useAsyncRequestFetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(id)}/events`,
            {
                params: {
                    timeMin: start,
                    timeMax: end,
                    timeZone: "Asia/Seoul"
                }
            }
        )
        
        return calEvents
    } catch(e) {
        console.error(e)
        return null
    }
}

async function useDeleteCalendarEvent(email:string, id:string) {
    var req = null
    try {
        req = await useAsyncRequestFetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(email)}/events/${id}`,
            {
                method: "DELETE"
            }
        )
    } catch (e) {
        console.error(e)
    }
    // console.log(req)
    return req
}

async function useInsertCaledarEvent(calId:string, isDay:boolean, start:string, end:string, title:string, content:string, colorid:number) {
    let sendObj: Record<string, any> = {
        summary: title,
        description: content,
        colorId: colorid
    }
    if (isDay) {
        sendObj["start"] = {
            date: start.split("T")[0]
        }
        sendObj["end"] = {
            date: end.split("T")[0]
        }
    } else {
        sendObj["start"] = {
            dateTime: start
        }
        sendObj["end"] = {
            dateTime: end
        }
    }

    try {
        let req = await useAsyncRequestFetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
            {
                method: "POST",
                body: sendObj
            }
        )

        return req
    } catch(e) {
        console.error(e)
        return null
    }
}

export {
    useAuthorize, useAsyncAuthorize,
    useCalendarList, useAsyncCalendarList, useSaveCalendarList,
    useGetCalendarColor, useGetCalendarEvents,
    useDeleteCalendarEvent, useInsertCaledarEvent
}