<template>
    <div :style="calendarStyleVars">
        <div class="uk-inline uk-width-expand uk-flex-wrap-stretch calendar-head">
            <div class="uk-position-left uk-button-group calendar-head-left"> 
                <button class='uk-button uk-button-small' :class="['uk-button-' + buttonType]" @click='reloadEvent' uk-tooltip="새로고침" id='reload-btn' @mouseover="useEnableMouse" @mouseout="useDisableMouse">새로고침</button>
                <button class='uk-button uk-button-small' :class="['uk-button-' + buttonType]" @mouseover="useEnableMouse" @mouseout="useDisableMouse">
                    <span uk-icon='calendar' uk-tooltip="Google Calendar 열기" @click="useOpenExternalLink('https://calendar.google.com/')"/>
                </button>
                <button class='uk-button uk-button-small' :class="['uk-button-' + buttonType]" uk-tooltip="설정을 엽니다." id='createOption' @click='loadSetting'  @mouseover="useEnableMouse" @mouseout="useDisableMouse" >
                <span uk-icon='settings'/>
                </button>
                <button class='uk-button uk-button-small' :class="['uk-button-' + buttonType]" uk-tooltip="Event 추가" ref="addEventBtn" @click='showEvent'  @mouseover="useEnableMouse" @mouseout="useDisableMouse">
                <span uk-icon='plus' />
                </button>
                <div uk-drop='mode: click' ref="eventAddDrop">
                    <div class='uk-card uk-card-default uk-padding-small event-add' @mouseover="useEnableMouse" @mouseout="useDisableMouse">
                        <fieldset class='uk-fieldset'>
                        달력
                        <select v-model="calPrimaryID" v-if="calendarids" class="uk-select uk-form-small">
                            <template v-for="(data) in calendarids">
                            <option :key="data.id" v-if="data.accessRole == 'owner' || data.accessRole == 'writer'" :value="data.id">
                                {{ data.summary }}
                            </option>
                            </template>
                        </select>
                        제목
                        <input type='text' placeholder='제목 입력' class='uk-input' v-model='summary'>
                        <div class='uk-margin-small-top'>
                            설명
                            <div ref="description" />
                            <!-- <textarea class='uk-textarea uk-height-small uk-resize-vertical uk-height-max-medium' v-model='description'/> -->
                            <!-- <a class="uk-text-muted uk-float-right uk-text-small" @click="useOpenExternalLink('https://gist.github.com/ihoneymon/652be052a0727ad59601#2-%EB%A7%88%ED%81%AC%EB%8B%A4%EC%9A%B4-%EC%82%AC%EC%9A%A9%EB%B2%95%EB%AC%B8%EB%B2%95')">Markdown 형식</a> -->
                        </div>
                        <p class='uk-margin-small-top'>
                            시간 종류
                            <select class="uk-select uk-width-1-3 uk-form-small" v-model="timeType">
                                <option>날짜</option>
                                <option>날짜-시간</option>
                            </select>
                            <br/>
                            시작
                            <VueDatePicker v-model='startTime' v-if="timeType == '날짜'" :formats="{ input: dpFormat, preview: dpFormat }" :model-type="dpFormat" :locale="ko" input-class='uk-width color-input' :time-config="{ is24: false }" week-start="0" auto-apply/>
                            <VueDatePicker v-model='startTime' v-else :formats="{ input: dptFormat, preview: dptFormat }" :model-type="dptFormat" :locale="ko" input-class='uk-width color-input' :time-config="{ is24: false }" week-start="0" auto-apply/>
                        </p>
                        <p class='uk-margin-small-top'>
                            종료
                            <VueDatePicker v-model='endTime' v-if="timeType == '날짜'" :formats="{ input: dpFormat, preview: dpFormat }" :model-type="dpFormat" :locale="ko" input-class='uk-width' :time-config="{ is24: false }" week-start="0" auto-apply/>
                            <VueDatePicker v-model='endTime' v-else :formats="{ input: dptFormat, preview: dptFormat }" :model-type="dptFormat" :locale="ko" input-class='uk-width' :time-config="{ is24: false }" week-start="0" auto-apply/>
                        </p>
                        <p class='uk-margin-small-top'>
                            <template v-for="(color, i) in gcolor" v-bind:key="i">
                                <div :style="{background : color.background}" class="event-color" :class="{eventcolorselect: colorid == i}" @click="colorid = i">
                                    <span v-if="colorid == i" ratio="1.3" uk-icon="check" class="icon-custom" />
                                </div>
                            </template>
                        </p>
                        <button v-if="!isEdit" class="uk-button uk-button-small" :class="['uk-button-' + buttonType]" :uk-tooltip="[startTime ? '이벤트를 추가합니다.' : '시작 시간을 정해 주십시오.']" @click='insertEvent' :disabled="!startTime">추가</button>
                        <button v-if="isEdit" class="uk-button uk-button-small" :class="['uk-button-' + buttonType]" :uk-tooltip="[startTime ? '이벤트를 수정합니다.' : '시작 시간을 정해 주십시오.']" @click='insertEditEvent' :disabled="!startTime">수정</button>
                        </fieldset>
                    </div>
                </div>
                <button class="uk-button uk-button-small" :class="['uk-button-' + buttonType]" uk-tooltip="Calendar을 움직입니다." @mouseover="useEnableMouse" @mouseout="useDisableMouse">
                    <span uk-icon='move' id='dragBtn' @mouseover="useEnableMouse" @mouseout="useDisableMouse"/>
                </button>
            </div>
            <div class="uk-position-center calendar-head-center">
                {{ calendarMonth }}
            </div>
            <div class="uk-position-right uk-button-group calendar-head-right" @mouseover="useEnableMouse" @mouseout="useDisableMouse">
                <button class='uk-button uk-button-small' :class="['uk-button-' + buttonType]" @click='calendarPrev()'><span uk-icon='chevron-left'/></button>
                <button class='uk-button uk-button-small' :class="['uk-button-' + buttonType]" @click='calendarToday()'><span uk-icon='clock'/></button>
                <button class='uk-button uk-button-small' :class="['uk-button-' + buttonType]" @click='calendarNext()'><span uk-icon='chevron-right'/></button>
            </div>
        </div>
        <FullCalendar :options="calendarOptions" ref="Fcalendar" id="calendar"/>
        <popupEvent
            v-show='isShow'
            :calendarApi="calendarApi"
            :calendarids="calendarids"
            :calEvent="eventValue"
            :isShow="isShow"
            @reloadEnd="reloadEnd"
            @showPopup="showPopup"
            @editEvent="editEvent"
            @mouseover="popupEventmouseover"
            @mouseout="popupEventmouseout"
            ref='eventform'
        />
    </div>
</template>

<script setup lang="ts">
import {
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    toRefs,
    watch,
    inject,
    computed
} from 'vue'
import FullCalendar, {
    type CalendarApi,
    type CalendarOptions,
    type DayCellInfo,
    type MountInfo
} from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/vue3/daygrid'
import koLocale from '@fullcalendar/vue3/locales/ko'
import classicThemePlugin from '@fullcalendar/vue3/themes/classic'
import '@fullcalendar/vue3/skeleton.css'
import '@fullcalendar/vue3/themes/classic/theme.css'
import '@fullcalendar/vue3/themes/classic/palette.css'
import UIKit from 'uikit'
// @ts-ignore
import Editor from '@toast-ui/editor'
import type { DesktopCalStore } from '../../../stores/desktopCalendar'
import {
    desktopApi,
    type CalendarListEntry,
    type Cleanup
} from '../../../services/desktopApi'
import {
    disableMouse as useDisableMouse,
    enableMouse as useEnableMouse
} from '../../../features/window/mousePassthrough'
import {
    applyCalendarEventToDraft,
    createCalendarEventDraft,
    formatAddedDate,
    formatDraftStartForTimeType,
    resetCalendarEventDraft,
    toCalendarEventInput
} from '../../../features/calendar/calendarEventForm'
import popupEvent from './popupEvents.vue'
import { ko } from 'date-fns/locale'

import dayjs from 'dayjs'

const dpFormat = 'yyyy-MM-dd'
const dptFormat = 'yyyy-MM-dd hh:mm aa'
const ymFormat = 'YYYY년 M월'
const useOpenExternalLink = desktopApi.openExternalLink

const store = inject("DeskCalStore") as DesktopCalStore

const eventAddDrop = ref<HTMLElement>()
const eventDrop = ref<UIKit.UIkitDropElement>()

let isShow = ref(false)
let isEdit = ref(false)
let eventValue = {}
const eventDraft = reactive(createCalendarEventDraft())
const {
    calendarId: calPrimaryID,
    summary,
    timeType,
    startTime,
    endTime,
    colorId: colorid
} = toRefs(eventDraft)
const buttonType = ref(store.getOptions("calendar").buttonType)
let showAdd = false

const Fcalendar = ref<InstanceType<typeof FullCalendar>>()
let calendarApi = ref<CalendarApi>()
const calendarMonth = ref("")
const eventform = ref()

const calendarids = ref<CalendarListEntry[]>([])

let descriptEditor:Editor
const description = ref<HTMLElement>()

let gcolor = [
        {
          'background': '#a4bdfc',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#7ae7bf',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#dbadff',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#ff887c',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#fbd75b',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#ffb878',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#46d6db',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#e1e1e1',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#5484ed',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#51b749',
          'foreground': '#1d1d1d'
        },
        {
          'background': '#dc2127',
          'foreground': '#1d1d1d'
        }
      ]

function initialEventAdd() {
    resetCalendarEventDraft(eventDraft)
    descriptEditor.setMarkdown('')
    eventValue = {}
}

function reloadEvent() {
    document.querySelector("#reload-btn")?.setAttribute("disabled", "true")

    eventform.value.forceReload()
}

function reloadEnd() {
    document.querySelector("#reload-btn")?.removeAttribute("disabled")
}

function loadSetting() {
    var btn = document.querySelector("#createOption")
    var btnDrag = document.querySelector("#dragBtn") as HTMLElement
    if (!btn || !btnDrag) {
        return
    }

    btn.setAttribute("disabled", "true")

    // @ts-ignore
    btnDrag.style.webkitAppRegion = "none"
    desktopApi.openSettingWindow()
}

function insertEvent() {
    eventDrop.value?.hide()
    isEdit.value = false

    let resultHtml = descriptEditor.getHTML()

    const input = toCalendarEventInput(eventDraft, resultHtml)
    eventform.value.insertEvent(
        input.calendarId,
        input.isAllDay,
        input.start,
        input.end,
        input.title,
        input.content,
        input.colorId
    )
    initialEventAdd()
}

function convertRGBA(rgba:any) {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
}

function showEvent() {
    if (showAdd) {
        isEdit.value = false
        initialEventAdd()
    }
    showAdd = !showAdd
}

function editEvent(ev:any) {
    isEdit.value = true
    eventDrop.value?.show()

    descriptEditor.setMarkdown(applyCalendarEventToDraft(eventDraft, ev))
    eventValue = ev
}

function insertEditEvent() {
    eventDrop.value?.hide()
    isEdit.value = false

    let resultHtml = descriptEditor.getHTML()

    const input = toCalendarEventInput(eventDraft, resultHtml)
    eventform.value.insertEvent(
        input.calendarId,
        input.isAllDay,
        input.start,
        input.end,
        input.title,
        input.content,
        input.colorId
    )
    eventform.value.deleteInsertEvent(eventValue)
    initialEventAdd()
}

const addEventDate = (st?:string) => {
    if (st != undefined) {
        const formattedDate = formatAddedDate(st, timeType.value)
        startTime.value = formattedDate
        endTime.value = formattedDate
        isEdit.value = false
        eventDrop.value?.show()
    }
}

const addPlusBtn = (daycellargs: MountInfo<DayCellInfo>) => {
    const plusbtn = document.createElement('a')
    plusbtn.setAttribute('uk-icon', 'plus-circle')
    plusbtn.setAttribute('data-date', daycellargs.el.getAttribute('data-date') as string)
    plusbtn.classList.add('calendar-pointer-interactive')
    plusbtn.onmouseover = useEnableMouse
    plusbtn.onmouseout = useDisableMouse
    plusbtn.style.margin = '4px'
    plusbtn.style.position = 'absolute'
    plusbtn.style.zIndex = '4'
    

    var el = daycellargs.el
    el.addEventListener('mouseleave', (_event) => {
        el.removeChild(plusbtn)
    })
    el.addEventListener('mouseenter', (_event) => {
        plusbtn.onclick = () => addEventDate(el.getAttribute('data-date') as string)
        el.prepend(plusbtn)
    })
}

const deleteDayNumberToHangul = (daycellargs: DayCellInfo) => {
    var text = daycellargs.dayNumberText
    
    if (text.includes('월')) {
        text = text.replace('월', '.')
    }
    text = text.replace("일", '')
    return {
        html: text
    }

}

const calendarStyleVars = computed(() => {
    return {
        '--calendar-bg-color': convertRGBA(store.options.calendar.background),
        '--fc-classic-border': convertRGBA(store.options.calendar.color)
    }
})

const calendarOptions: CalendarOptions = {
    plugins: [
        dayGridPlugin,
        classicThemePlugin
    ],
    initialView: store.getOptions('calendarType'),
    headerToolbar: false,
    locale: koLocale,
    height: "100%",
    dayMaxEventRows: false,
    fixedWeekCount: false,
    views: {
        dayGrid: {
            tableHeaderClass: (tableHeader) =>
                tableHeader.isSticky ? 'calendar-sticky-header' : ''
        },
        month: {
            type: 'dayGridMonth',
            duration: {
                months: 1
            },
            expandRows: true,
        },
        week: {
            type: 'dayGridMonth',
            duration: {
                week: 3
            },
            expandRows: false,
        }
    },
    dayCellClass: (dayCell) => [
        'calendar-day-cell',
        dayCell.isToday ? 'calendar-day-today' : ''
    ].filter(Boolean).join(' '),
    dayCellDidMount: addPlusBtn,
    dayCellTopContent: deleteDayNumberToHangul,
    dayCellTopInnerClass: 'calendar-day-number',
    dayHeaderClass: 'calendar-day-header',
    dayHeaderInnerClass: 'calendar-day-header-inner',
    eventClass: 'calendar-pointer-interactive',
    rowMoreLinkClass: 'calendar-pointer-interactive',
    popoverClass: 'calendar-more-popover calendar-pointer-interactive',
    eventMouseEnter: (mouseinfo) => {
        if (eventform.value.isDelete) {
            return
        }
        useEnableMouse()
        const el = mouseinfo.el
        const calendarEl = Fcalendar.value?.$el as HTMLElement
        var bcr = el.getBoundingClientRect()
        
        var eventRect = {
            titleHeight: el.clientHeight,
            top: bcr.top + el.clientHeight,
            left: bcr.left,
            right: bcr.right,
            calendarRight: calendarEl.offsetLeft + calendarEl.offsetWidth,
        }
        mouseinfo.event.setExtendedProp("eventRect", eventRect)
        eventValue = mouseinfo.event
        isShow.value = true
    },
    eventMouseLeave: () => {
        useDisableMouse()
        isShow.value = false
    },
    eventTimeFormat: { hour12: true, hour: '2-digit'},
    eventDisplay: 'block',
    popoverFormat: {
        month: '2-digit',
        day: '2-digit',
        weekday: 'long'
    },
    moreLinkText: '더보기',
    navLinks: false,
}

const calendarNext = () => {
    calendarApi.value?.next()
    var date = calendarApi.value?.getDate()
    calendarMonth.value = dayjs(date).format(ymFormat)
    reloadEvent()
}

const calendarToday = () => {
    calendarApi.value?.today()
    var date = calendarApi.value?.getDate()
    calendarMonth.value = dayjs(date).format(ymFormat)

    reloadEvent()
}

const calendarPrev = () => {
    calendarApi.value?.prev()
    var date = calendarApi.value?.getDate()
    calendarMonth.value = dayjs(date).format(ymFormat)
    reloadEvent()
}

function showPopup(bIsShow:boolean) {
    isShow.value = bIsShow
}

function popupEventmouseover() {
    isShow.value = true
}

function popupEventmouseout() {
    isShow.value = false
}

let stopSettingWindowClosed: Cleanup | undefined
let stopCalendarReloadRequested: Cleanup | undefined

const selectPrimaryCalendar = () => {
    const primaryCalendar = calendarids.value.find((calendar) => calendar.primary)
    if (primaryCalendar) {
        calPrimaryID.value = primaryCalendar.id
    }
}

onMounted(async () => {
    stopSettingWindowClosed = desktopApi.onSettingWindowClosed(() => {
        document.querySelector("#createOption")?.removeAttribute("disabled")
        const btnDrag = document.querySelector("#dragBtn") as HTMLElement | null
        if (btnDrag) {
            // @ts-ignore
            btnDrag.style.webkitAppRegion = "drag"
        }
    })
    stopCalendarReloadRequested = desktopApi.onCalendarReloadRequested(async () => {
        calendarids.value = await desktopApi.getCalendarList()
        selectPrimaryCalendar()
        reloadEvent()
    })

    eventDrop.value = UIKit.drop(eventAddDrop.value as HTMLElement)
    calendarids.value = await desktopApi.getCalendarList()
    selectPrimaryCalendar()
    
    if (description.value) {
        descriptEditor = new Editor({
            el: description.value,
            height: 'auto',
            //'wysiwyg', 'markdown' 택 1
            initialEditType: 'wysiwyg',
            initialValue: '',
            toolbarItems: [
                ['heading', 'bold', 'italic', 'strike']
            ],
            useCommandShortcut: true,
            hideModeSwitch: true,
            autofocus: true,
            usageStatistics: false,
        })
    }

    calendarApi.value = Fcalendar.value?.getApi()
    UIKit.heightViewport(document.querySelector('#calendar') as HTMLElement, { offsetTop: true })
    calendarMonth.value = dayjs(calendarApi.value?.getDate()).format(ymFormat)
})

onBeforeUnmount(() => {
    stopSettingWindowClosed?.()
    stopCalendarReloadRequested?.()
    descriptEditor?.destroy()
})

watch(startTime, (newValue) => {
    if (endTime.value == '') {
        endTime.value = newValue
    } else {
        if (!dayjs(newValue).isBefore(endTime.value)) {
            endTime.value = newValue
        }
    }
})

watch(endTime, (newValue) => {
    if (!dayjs(newValue).isAfter(dayjs(startTime.value))) {
        startTime.value = newValue
    }
})

watch(timeType, (newValue) => {
    startTime.value = formatDraftStartForTimeType(startTime.value, newValue)
})

watch(() => store.options.calendarType, (newValue) => {
    calendarApi.value?.changeView(newValue)
})

watch(() => store.options.calendar.buttonType, (newValue) => {
    buttonType.value = newValue
})

</script>

<style>
#calendar {
    position: relative;
    padding: 0 0 0 0;
    background-clip: content-box;
}

#dragBtn {
    app-region: drag;
}

.calendar-day-today {
    background: rgba(215, 240, 247, 0.6);
}

.calendar-head {
    height: 40px;
}

.calendar-head-center {
    color: black;
    font-size: xx-large;
}

.calendar-head-left {
    left: 0%;
}

.calendar-head-right {
    right: 0%;
}

.event-color {
    width:40px;
    height:40px;
    border-radius: 30px;
    margin: 3px 5.5px;
    text-align: center;
    display:inline-block !important;
}

.event-color:hover {
    box-shadow: 0 0 3px 1px #a8a8a8;
}

.icon-custom {
    transform: translate(-12px, 7px);
    position:absolute;
    color:black;
}

.calendar-day-number,
.calendar-day-header-inner {
    color: black;
}

.calendar-more-popover {
    background:white;
}

/*Allow pointer-events through*/
.calendar-day-header,
.calendar-day-cell {
    pointer-events:none
}
/*Turn pointer events back on*/
.calendar-pointer-interactive {
    pointer-events:auto; /*events*/
}
.calendar-head-center,
.calendar-day-header-inner,
.calendar-day-number,
#reload-btn {
  user-select: none;
}

#calendar,
.calendar-head {
    background-color: var(--calendar-bg-color);
}

.calendar-sticky-header,
.calendar-sticky-header > * {
    background-color: transparent !important;
}
</style>
