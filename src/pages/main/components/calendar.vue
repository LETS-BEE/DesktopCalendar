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
                        <p class='uk-margin-small-top'>
                            설명
                            <div ref="description" />
                            <!-- <textarea class='uk-textarea uk-height-small uk-resize-vertical uk-height-max-medium' v-model='description'/> -->
                            <!-- <a class="uk-text-muted uk-float-right uk-text-small" @click="useOpenExternalLink('https://gist.github.com/ihoneymon/652be052a0727ad59601#2-%EB%A7%88%ED%81%AC%EB%8B%A4%EC%9A%B4-%EC%82%AC%EC%9A%A9%EB%B2%95%EB%AC%B8%EB%B2%95')">Markdown 형식</a> -->
                        </p>
                        <p class='uk-margin-small-top'>
                            시간 종류
                            <select class="uk-select uk-width-1-3 uk-form-small" v-model="timeType">
                                <option>날짜</option>
                                <option>날짜-시간</option>
                            </select>
                            <br/>
                            시작
                            <DatePicker v-model='startTime' v-if="timeType == '날짜'" :format="dpFormat" :preview-fromat="dpFormat" :model-type="dpFormat" locale="ko" input-class='uk-width color-input' :is-24='false' week-start="0" auto-apply/>
                            <DatePicker v-model='startTime' v-else :format="dptFormat" :preview-froma="dptFormat" :model-type="dptFormat" locale="ko" input-class='uk-width color-input' :is-24='false' week-start="0" auto-apply/>
                            
                        </p>
                        <p class='uk-margin-small-top'>
                            종료
                            <DatePicker v-model='endTime' v-if="timeType == '날짜'" :format="dpFormat" :preview-froma="dpFormat" :model-type="dpFormat" locale="ko-KR" input-class='uk-width' :is-24='false' week-start="0" auto-apply/>
                            <DatePicker v-model='endTime' v-else :format="dptFormat" :preview-froma="dptFormat" :model-type="dptFormat" locale="ko-KR" input-class='uk-width' :is-24='false' week-start="0" auto-apply/>
                        </p>
                        <p class='uk-margin-small-top'>
                            <template v-for="(color, i) in gcolor" v-bind:key="i" style="display:block">
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
import { onMounted, ref, watch, nextTick, inject, computed } from 'vue'
import { Calendar } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/vue3'
import koLocale from '@fullcalendar/core/locales/ko'
import dayGridPlugin from '@fullcalendar/daygrid'
import { CalendarOptions, DayCellMountArg } from '@fullcalendar/core'
import calendarDayjsMoment from '../../../plugin/fullcalendar-dayjs'
import UIKit from 'uikit'
// @ts-ignore
import Editor from '@toast-ui/editor'
import { 
    DesktopCalStore,
    useEnableMouse, useDisableMouse,
    useGetCalendarList,
    useOpenExternalLink,
    useSettingWindow
} from '../../../composables/util'
import popupEvent from './popupEvents.vue'

import dayjs from 'dayjs'

const mFormat = 'YYYY-MM-DD'
const mtFormat = 'yyyy-MM-DD hh:mm A'
const dpFormat = 'yyyy-MM-dd'
const dptFormat = 'yyyy-MM-dd hh:mm aa'
const ymFormat = 'YYYY년 M월'

const store = inject("DeskCalStore") as DesktopCalStore

const eventAddDrop = ref<HTMLElement>()
const eventDrop = ref<UIKit.UIkitDropElement>()

let isShow = ref(false)
let isEdit = ref(false)
let eventValue = {}
let startTime = ref((new Date()).toString())
let endTime = ref('')
let colorid = ref(1)
const buttonType = ref(store.getOptions("calendar").buttonType)
// let calendarStoreType = ref()
let showAdd = false

const Fcalendar = ref<InstanceType<typeof FullCalendar>>()
let calendarApi = ref<Calendar>()
const calendarMonth = ref("")
const eventform = ref()

const summary = ref("")
// const description = ref("")
const timeType = ref('날짜')

const calendarids = ref()
const calPrimaryID = ref('')


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
    startTime.value = ''
    endTime.value = ''
    descriptEditor.setMarkdown('')
    summary.value = ''
    colorid.value = 1
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
    // console.log(btnDrag.style.webkitAppRegion)
    // @ts-ignore
    btnDrag.style.webkitAppRegion = "none"
    useSettingWindow()
    
    window.ipcRenderer.on('setWinClosed', (_event) => {
        btn?.removeAttribute("disabled")
        
        // @ts-ignore
        btnDrag.style.webkitAppRegion = "drag"
    })
    window.ipcRenderer.on('requstReloadCalendar', async (_event) => {
        calendarids.value = await useGetCalendarList()
        calendarids.value.forEach((value:any) => {
            if (value.primary) {
                calPrimaryID.value = value.id
            }
        })
        reloadEvent()
    })
}

function insertEvent() {
    eventDrop.value?.hide()
    isEdit.value = false

    let resultHtml = descriptEditor.getHTML()

    if (endTime.value == '') {
        endTime.value = startTime.value
    }

    endTime.value = dayjs(endTime.value).add(1, 'd').format(mFormat)

    var isDay = timeType.value == '날짜'

    if (!isDay) {
        endTime.value = dayjs(endTime.value).toISOString()
        startTime.value = dayjs(startTime.value).toISOString()
    }

    eventform.value.insertEvent(calPrimaryID.value, isDay, startTime.value, endTime.value, summary.value, resultHtml, colorid.value)
    initialEventAdd()
}

function convertRGBA(rgba:any) {
    // console.log(rgba)
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

    summary.value = ev.title
    // console.log(ev)
    if (ev.extendedProps.description != null) {
        descriptEditor.setMarkdown(ev.extendedProps.description)
    } else {
        descriptEditor.setMarkdown("")
    }

    if (timeType.value == "날짜") {
        startTime.value = dayjs(ev.start).format(mFormat)
        endTime.value = dayjs(ev.end).add(-1, "d").format(mFormat)
    } else {
        startTime.value = dayjs(ev.start).format(mtFormat)
        endTime.value = dayjs(ev.end).add(-1, "d").format(mtFormat)
    }
    
    colorid.value = ev.extendedProps.e.colorId - 1
    eventValue = ev
}

function insertEditEvent() {
    eventDrop.value?.hide()
    isEdit.value = false

    let resultHtml = descriptEditor.getHTML()

    if (endTime.value == '') {
        endTime.value = startTime.value
    }

    endTime.value = dayjs(endTime.value).add(1, 'd').format(mFormat)

    var isDay = timeType.value == '날짜'

    if (!isDay) {
        endTime.value = dayjs(endTime.value).toISOString()
        startTime.value = dayjs(startTime.value).toISOString()
    }

    eventform.value.insertEvent(calPrimaryID.value, isDay, startTime.value, endTime.value, summary.value, resultHtml, colorid.value)
    eventform.value.deleteInsertEvent(eventValue)
    initialEventAdd()
}

const addEventDate = (st?:string) => {
    if (st != undefined) {
        startTime.value = st
        endTime.value = st
        isEdit.value = false
        eventDrop.value?.show()
    }
}

const addPlusBtn = (daycellargs: DayCellMountArg) => {
    const plusbtn = document.createElement('a')
    plusbtn.setAttribute('uk-icon', 'plus-circle')
    plusbtn.setAttribute('data-date', daycellargs.el.getAttribute('data-date') as string)
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
        // el.appendChild(plusbtn)
        el.prepend(plusbtn)
    })
    
    // var daynumber = el.getElementsByClassName('fc-daygrid-day-number').item(0)
    // if (daynumber) {
    //     if (daynumber.textContent) {
    //         daynumber.textContent = daynumber.textContent?.replace('일', '')
    //     }
    // }
}

const deleteDayNumberToHangul = (daycellargs: DayCellMountArg) => {
    // var daynumber = document.createElement('p')
    // daynumber.classList.add('fc-daygrid-day-number')
    // daynumber.innerHTML = daycellargs.dayNumberText.replace("일", '')
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
        '--calendar-border-color': convertRGBA(store.options.calendar.color),
        '--calendar-bg-color': convertRGBA(store.options.calendar.background)
    }
})

const calendarOptions: CalendarOptions = {
    plugins: [
        dayGridPlugin,
        calendarDayjsMoment
    ],
    initialView: store.getOptions('calendarType'),
    headerToolbar: false,
    // headerToolbar: {
    //     left: '',
    //     center: 'title',
    //     right: ''
    // },
    themeSystem: 'standard',
    locale: koLocale,
    height: "100%",
    // contentHeight: "auto",
    // expandRows: true,
    dayMaxEventRows: false,
    fixedWeekCount: false,
    views: {
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
    // dayHeaderFormat: {day: 'numeric'},
    dayCellDidMount: addPlusBtn,
    dayCellContent: deleteDayNumberToHangul,
    eventMouseEnter: (mouseinfo) => {
        if (eventform.value.isDelete) {
            return
        }
        useEnableMouse()
        const el = mouseinfo.el
        const calendarEl = Fcalendar.value?.$el as HTMLElement
        // const jsevent = mouseinfo.jsEvent
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
    // eventTimeFormat: 'AH:mm',
    eventDisplay: 'block',
    dayPopoverFormat: 'MM월 DD일 dddd',
    moreLinkText: '더보기',
    navLinks: false,
    // navLinkDayClick: ''
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
    // calendarApi.render()
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

onMounted(async () => {
    eventDrop.value = UIKit.drop(eventAddDrop.value as HTMLElement)
    // calendarStoreOption.value = store.getOptions("calendar")
    calendarids.value = await useGetCalendarList()
    calendarids.value.forEach((value:any) => {
        if (value.primary) {
            calPrimaryID.value = value.id
        }
    })
    
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
    // let cal = document.querySelector('#calendar') as HTMLElement
    // console.log(cal.style.height)
    // cal.onload = () => {
    //     console.log(cal.style.height)
    // }
    UIKit.heightViewport(document.querySelector('#calendar') as HTMLElement, { offsetTop: true })
    await nextTick()
    calendarApi.value?.updateSize()
    calendarMonth.value = dayjs(calendarApi.value?.getDate()).format(ymFormat)
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
    if (newValue == '날짜') {
        startTime.value = dayjs(startTime.value).format(mFormat)
        // endTime은 watch(startTime)에 의해 자동 변환
    } else {
        startTime.value = dayjs(startTime.value).format(mtFormat)
    }
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
    /* height: auto;
    min-height: 600px; */
}

#dragBtn {
    app-region: drag;
}

.fc button {
    height: none;
}

.fc .fc-daygrid-day.fc-day-today{
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
    /* position: absolute !important; */
    /* top: 0%; */
    left: 0%;
}

.calendar-head-right {
    /* @extend .calendar-head-left; */
    /* position: absolute !important; */
    /* top: 0%; */
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

/* .colorhighlighted {
    border: 1px black solid;
} */

.icon-custom {
    transform: translate(-12px, 7px);
    position:absolute;
    color:black;
}

.fc-event-time,
a > div.fc-event-title {
    color: var(--fc-event-text-color);
}

a.fc-daygrid-day-number,
a.fc-col-header-cell-cushion {
    color: black;
}

.fc-more-popover {
    background:white;
}

/*Allow pointer-events through*/
.fc-col-header-cell,
.fc-daygrid-day-frame{
    pointer-events:none
}
/*Turn pointer events back on*/
.fc-daygrid-bg-harness,
.fc-daygrid-event-harness{
    pointer-events:auto; /*events*/
}
.calendar-head-center, .fc-col-header-cell > div > a, .fc-daygrid-day-number, #reload-btn{
  user-select: none;
}
.fc-scrollgrid {
   overflow-y: visible !important;
}

.fc-theme-standard .fc-scrollgrid,
.fc-theme-standard td,
.fc-theme-standard th {
    border-color: var(--calendar-border-color) !important;
}

#calendar,
.calendar-head {
    background-color: var(--calendar-bg-color);
}

.fc .fc-scrollgrid-section-sticky > * {
    background-color: transparent !important;
}
</style>