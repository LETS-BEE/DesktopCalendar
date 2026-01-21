<template>
    <div
        class="uk-card uk-card-default uk-padding-small"
        id="gcal-event"
        style="min-width: 300px"
        @mouseover="useEnableMouse"
        @mouseout="useDisableMouse"
        ref="gEvent"
    >
        <slot name="header" style="padding: 0">
            <span
                id="open-google-calendar"
                uk-icon="google"
                class="uk-icon-link uk-position-top-right uk-padding-small uk-border-circle google-button"
                uk-tooltip="Google Calendar에서 엽니다."
                v-on:click="openGCLink()"
            />
            <div
                class="uk-card-title uk-margin-small-top gcal-title uk-margin-remove-bottom"
            >{{
                calEvent.title
            }}</div>
            <p class="uk-text-meta uk-margin-remove-top">
            {{
                calEvent.extendedProps?.organizer
                ? calEvent.extendedProps.organizer.displayName || calEvent.extendedProps.organizer.email
                : ""
            }}
            </p>
            <p
                class="uk-text-meta uk-margin-remove timeShow"
                uk-tooltip="클릭으로 보기 변경"
                @click="timeShow = true"
                v-if="!timeShow"
            >
                <span v-if="timePast" uk-icon="history"></span>
                <span v-else uk-icon="future"></span>
                <time class="uk-margin-small-left">{{ getFromNow() }}</time>
            </p>
            <div
                uk-tooltip="클릭으로 보기 변경"
                v-if="timeShow"
                @click="timeShow = false"
            >
                <p class="uk-text-meta uk-margin-remove timeShow">
                    <time>{{
                        calEvent.start ?
                            dayjs(calEvent.start).format("YYYY-MM-DD A h:mm:ss") :
                            dayjs(calEvent.startStr).format("YYYY-MM-DD A h:mm:ss")
                    }}</time>
                </p>
                <p class="uk-text-meta uk-margin-remove timeShow">
                    <time>
                        ~
                        {{
                            calEvent.end ?
                            dayjs(calEvent.end).format("YYYY-MM-DD A h:mm:ss") :
                            dayjs(calEvent.endStr).format("YYYY-MM-DD A h:mm:ss")
                        }}
                    </time>
                </p>
            </div>
            <hr/>
            <div
                v-if="!isDelete" 
                uk-icon="trash"
                uk-tooltip="이벤트 삭제"
                class="uk-icon-link uk-float-right"
                @click="deleteEvent"
            />
            <div v-else uk-spinner='ratio: 0.7' class="uk-float-right"></div>
            <div
                v-if="deleteError" 
                class="uk-alert-danger uk-padding-small"
                uk-alert
            >
                <p>삭제에 실패하였습니다.</p>
            </div>
            <div
                v-if="!isEdit" 
                uk-icon="file-edit"
                uk-tooltip="이벤트 수정"
                class="uk-icon-link uk-float-right"
                @click="editEventSend"
            />
            <div v-else uk-spinner='ratio: 0.7' class="uk-float-right"/>
        </slot>
        <p class="gcal-body markdown-body" v-html="getDescription" />
    </div>
</template>

<script lang="ts">
import { inject, ref } from 'vue'
import {
    DesktopCalStore,
    useEnableMouse, useDisableMouse,
    useOpenExternalLink,
    useGetCalColor, useGetBatchCalendarEvents,
    useInsertCaledarEvent, useDeleteCalendarEvent } from '../../../composables/util'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

let accessCount = 0

export default {
    props: [
        "calEvent", "calendarApi", "calendarids"
    ],
    data() {
        return {
            gcolor: null as any,
            timeShow: false,
            timePast: false,
            isDelete: false,
            isEdit: false,
            deleteError: false,
            // const editError = ref(false)
            // const isUpdate = ref(false)
            refreshInterval: null as any,
            useEnableMouse,
            useDisableMouse,
            dayjs
        }
    },
    setup() {
        const store = inject("DeskCalStore") as DesktopCalStore
        const gEvent = ref()
        return { store, gEvent }
    },
    methods: {
        openGCLink() {
            useOpenExternalLink(this.calEvent.extendedProps?.e.htmlLink)
        },
        addEvent(ev:any, color:any) {
            ev.forEach((e:any) => {
                var ev = {}
                if (e.start.dateTime) {
                    ev = {
                        id: e.id,
                        title: e.summary,
                        allDay: false,
                        start: e.start.dateTime,
                        end: e.end.dateTime,
                        // color: e.colorId
                        backgroundColor: e.colorId
                            ? this.gcolor.event[e.colorId].background
                            : color.background,
                        borderColor: e.colorId
                            ? this.gcolor.event[e.colorId].background
                            : color.background,
                        // extendedProps
                        e,
                        organizer: e.organizer,
                        description: e.description || null,
                        created: e.created
                    }
                } else {
                    ev = {
                        id: e.id,
                        title: e.summary,
                        start: e.start.date,
                        end: e.end.date,
                        // color: e.colorId
                        backgroundColor: e.colorId
                            ? this.gcolor.event[e.colorId].background
                            : color.background,
                        borderColor: e.colorId
                            ? this.gcolor.event[e.colorId].background
                            : color.background,
                        // extendedProps
                        e,
                        organizer: e.organizer,
                        description: e.description || null,
                        created: e.created
                    }
                }
                this.calendarApi.addEvent(ev)
            })
        },
        removeAllEvents() {
            let events = this.calendarApi.getEvents()
            if (events.length > 0) {
                events.forEach((ev:any) => {
                    ev.remove()
                })
            }
        },
        init() {
            var colors:any = {}
            // console.log(this.calendarids)
            if (this.calendarids) {
                if (this.calendarids.length == 0) {
                    this.removeAllEvents()
                    this.$emit("reloadEnd")
                    return
                }
            }

            useGetCalColor((res) => {
                this.gcolor = res
                this.removeAllEvents()
                accessCount += 1
                
                const checkedIds: string[] = []
                for (const cal of this.calendarids) {
                    if (!cal.checked) {
                        continue
                    }
                    checkedIds.push(cal.id)
                    colors[cal.id] = this.gcolor.calendar[cal.colorId]
                }

                if (checkedIds.length === 0) {
                    // No checked calendars
                    if (accessCount >= 2) {
                         accessCount -= 1
                    }
                    this.$emit("reloadEnd")
                    return
                }

                console.time("fetchBatchEvents")
                useGetBatchCalendarEvents(
                    checkedIds,
                    this.calendarApi.view.activeStart.toString(),
                    this.calendarApi.view.activeEnd.toString(),
                    (results) => {
                        console.timeEnd("fetchBatchEvents")

                        // Handle concurrency logic for reloadEnd
                        if (accessCount >= 2) {
                            accessCount -= 1
                        } else {
                            accessCount -= 1
                            // If this callback runs, we have results
                            // Iterate results
                            for (const [calId, events] of Object.entries(results)) {
                                if (events && events.items && events.items.length > 0) {
                                    this.addEvent(events.items, colors[calId])
                                }
                            }
                            this.$emit("reloadEnd")
                        }
                    }
                )
            })
        },
        getFromNow() {
            const start = this.calEvent.start
            const end = this.calEvent.end
            const now = dayjs()
            if (start == null || start == undefined) {
                return ""
            }
            if (dayjs(start).diff(now) > 0 || (start == null || start == undefined)) {
                this.timePast = false
                return dayjs(start).fromNow() + "에 시작"
            } else if (dayjs(end).diff(now) > 0) {
                this.timePast = false
                return dayjs(end).fromNow() + "에 종료"
            } else {
                this.timePast = true
                return dayjs(end).fromNow() + "에 종료됨"
            }
        },
        deleteEvent() {
            this.isDelete = true
            useDeleteCalendarEvent(
                this.calEvent.extendedProps.organizer.email,
                this.calEvent.id,
                (req) => {
                    this.isDelete = false
                    // console.log(req)
                    if (req == undefined ) { //} && req != null && req?.status == 204) {
                        this.$emit("showPopup", false)
                        this.calendarApi.getEventById(this.calEvent.id).remove()
                    } else {
                        this.deleteError = true
                        setTimeout(() => {
                            this.deleteError = false
                        }, 2000)
                    }
                }
            )
        },
        deleteInsertEvent(ce:any) {
            this.isDelete = true
            useDeleteCalendarEvent(ce.extendedProps.organizer.email, ce.id, (req) => {
                this.isDelete = false
                if (req == undefined) { // != null && req?.status == 204) {
                    this.$emit("showPopup", false)
                    // console.log(ce, this.calendarApi.getEventById(ce.id))
                    this.calendarApi.getEventById(ce.id).remove()
                } else {
                    this.deleteError = true
                    setTimeout(() => {
                        this.deleteError = false
                    }, 2000)
                }
            })
        },
        editEventSend() {
            this.$emit("editEvent", this.calEvent)
        },
        insertEvent(calId:string, isDay:boolean, start:string, end:string, title:string, content:string, colorid:number) {
            useInsertCaledarEvent(
                calId,
                isDay,
                start,
                end,
                title,
                content,
                colorid + 1,
                (req) => {
                    this.addEvent([req], this.gcolor.calendar[colorid])
                }
            )
        },
        forceReload() {
            this.init()
        }
    },
    mounted() {
        this.init()
        this.refreshInterval = setInterval(this.init, parseInt(this.getRefresh) * 1000)
    },
    computed: {
        getDescription() {
            return this.calEvent.extendedProps?.description
        },
        getRefresh() {
            return this.store.getOptions("refreshTime")
        }
    },
    watch: {
        getRefresh(oldValue, newValue) {
            if (oldValue != newValue) {
                clearInterval(this.refreshInterval)
                this.refreshInterval = setInterval(this.init, parseInt(newValue) * 1000)
            }
        }
    },
    updated() {
        this.$nextTick(async () => {
            var eventRect = this.calEvent.extendedProps?.eventRect
            if (eventRect) {
                var top = eventRect.top
                var left = eventRect.left
                
                // let gcalEvent = document.querySelector("#gcal-event") as HTMLDivElement
                let gcalEvent = this.gEvent
                if (gcalEvent) {
                    if (gcalEvent.offsetHeight != 0) {
                        if (gcalEvent.offsetHeight + top > window.outerHeight - 20) {
                            top = eventRect.top - eventRect.titleHeight - gcalEvent.offsetHeight
                            gcalEvent.style.borderTopColor = "white"
                            gcalEvent.style.borderBottomColor = this.calEvent.backgroundColor
                        } else {
                            gcalEvent.style.borderTopColor = this.calEvent.backgroundColor
                            gcalEvent.style.borderBottomColor = "white"
                        }
                    }

                    if (gcalEvent.offsetWidth != 0) {
                        // 오른쪽 끝에 창 생성 시 가로 크기 한계로 가로/세로 길이 변동이 발생하므로
                        // 디자인이 망가짐을 방지하기 위해 추가함.
                        gcalEvent.style.left = '0px'
                        await this.$nextTick()
                        if (gcalEvent.offsetWidth + left > eventRect.calendarRight - 20) {
                            left = eventRect.right - gcalEvent.offsetWidth
                        }
                    }
                    
                    gcalEvent.style.top = Math.round(top).toString() + 'px'
                    gcalEvent.style.left = Math.round(left).toString() + 'px'

                }
            }
        })
    }
}
</script>

<style>
#gcal-event {
    position: fixed;
    display: inline-block;
    min-width: 270px;
    max-width: 400px;
    top: 50px;
    z-index: 10;
    border-top: 6px solid white;
    border-bottom: 6px solid white;
}

.google-button:hover {
    background: lightgray;
}

.google-button {
    border-radius: 30px;
}

.gcal-body {
    word-wrap: break-word;
}

.gcal-title {
    max-width: 90%;
}
</style>