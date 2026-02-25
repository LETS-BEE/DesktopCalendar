// https://devbaji.github.io/vue3-google-login/#automatic-login
// https://github.com/unjs/ofetch

import { ofetch , FetchOptions } from 'ofetch'
import { app, dialog } from 'electron'

import { OAuth2Client, Credentials } from 'google-auth-library'
// let OAuth2Client = window.googleapi.OAuth2Client
// let Credentials = window.googleapi.Credentials
import fs from 'fs'
import path from 'path'

import credentials from './private/credentials.json'

import http from 'http'
import { shell } from 'electron'

const TOKEN_PATH = path.join(app.getPath("userData"), "token.json")
const SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events"
];

// @ts-ignore
const clientConfig = credentials.installed || credentials
const client = new OAuth2Client(
    clientConfig.client_id,
    clientConfig.client_secret,
    clientConfig.redirect_uris[0]
)

var APIKEY: string | null | undefined

function useAuthorize(callback: (key?:any) => void) {    
    fs.readFile(TOKEN_PATH, (err, buf) => {
        if (err || !buf) {
            getAccessToken(client, callback)
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
async function useAsyncAuthorize() {
    try {
        var buf = await fs.promises.readFile(TOKEN_PATH)
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
            getAccessToken(client)
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

function getAccessToken(client: OAuth2Client, callback?: (key:any) => void) {
    const authUrl = client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
    });

    // 1. 코드를 받을 임시 로컬 서버를 엽니다. (BrowserWindow 팝업 대신)
    const server = http.createServer(async (req, res) => {
        try {
            if (req.url && req.url.startsWith('/')) {
                const parsedUrl = new URL(req.url, `http://localhost`);
                const code = parsedUrl.searchParams.get('code');

                if (code) {
                    // 사용자 브라우저에 보여줄 성공 메시지
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('<h1>로그인 성공!</h1><p>이 창을 닫고 앱으로 돌아가세요.</p>');
                    
                    server.close(); // 목적 달성 후 서버 닫기
                    
                    // 기존에 작성하셨던 토큰 생성 로직 호출
                    createToken(client, code, callback);
                } else {
                    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('<h1>로그인 실패 또는 취소됨</h1>');
                    server.close();
                }
            }
        } catch (e) {
            console.error(e);
            server.close();
        }
    }).listen(80, () => {
        // 2. 서버가 준비되면 사용자의 시스템 기본 브라우저를 엽니다.
        shell.openExternal(authUrl);
    });
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

        return await fileAsyncWrite(token.credentials)
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

async function fileAsyncWrite(token:Credentials) {
    await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token))
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

async function useAsyncCalendarList() {
    try {
        var buf = await fs.promises.readFile(path.join(app.getPath('userData'), 'calendar.json'))
        // console.log(buf.toString())
        if (buf.toString() == '') {
            return '[]'
        } else {
            return JSON.parse(buf.toString())
        }
    } catch (e) {
        console.error(e)
        try {
            await useAsyncAuthorize()
            
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

async function useGetBatchCalendarEvents(ids: string[], start: string, end: string) {
    const results: Record<string, any> = {};
    const BATCH_SIZE = 5;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const chunk = ids.slice(i, i + BATCH_SIZE);
        const promises = chunk.map(id =>
            useGetCalendarEvents(id, start, end)
                .then(events => ({ id, events }))
                .catch(err => {
                    console.error(`Error fetching calendar ${id}:`, err);
                    return { id, events: null };
                })
        );

        const chunkResults = await Promise.all(promises);
        chunkResults.forEach(r => {
            if (r.events) {
                results[r.id] = r.events;
            }
        });
    }

    return results;
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
    useGetCalendarColor, useGetCalendarEvents, useGetBatchCalendarEvents,
    useDeleteCalendarEvent, useInsertCaledarEvent
}