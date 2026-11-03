<template>
    <div class="uk-padding-large uk-padding-remove-top">
        <h2>Calendar 설정</h2>
        <span class="uk-text-muted">
            <h6>달력 크기 조절(가로)</h6>
            <input class="uk-range uk-width-1-2" type="range" v-model.number="calendarWidth" min="1024" :max="calendarMaxSize[0]" step="1" :disabled="!windowSizeReady" @change="flushWindowSize">
            <h6 style="margin-top: 20px;">달력 크기 조절(세로)</h6>
            <input class="uk-range uk-width-1-2" type="range" v-model.number="calendarHeight" min="576" :max="calendarMaxSize[1]" step="1" :disabled="!windowSizeReady" @change="flushWindowSize">
            
            <h4>달력 보기 타입 변경</h4>
            <p>
                <input type="radio" v-model="calendarType" class="uk-radio" value="week" @change="changeView"> 3주 보기 <br>
                <input type="radio" v-model="calendarType" class="uk-radio" value="month" @change="changeView"> 한달 보기
            </p>
            <table>
                <thead>
                    <tr class="uk-text-center">
                        <td><h6>캘린더 색 설정</h6></td>
                        <td><h6>배경 색 설정</h6></td>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <Sketch v-model="borderColor" />
                        </td>
                        <td>
                            <Sketch v-model="backgroundColor" />
                        </td>
                    </tr>
                </tbody>
            </table>
            <h4>버튼 색 설정</h4>
            <p>
                <button class="uk-button uk-button-small uk-button-primary" @click="changeButton('primary')">파랑</button>
                <button class="uk-button uk-button-small uk-button-secondary" @click="changeButton('secondary')">검정</button>
                <button class="uk-button uk-button-small uk-button-danger" @click="changeButton('danger')">빨강</button>
            </p>
        </span>
        <div>
        <button class="uk-button uk-button-small uk-button-primary" @click="deleteToken">
            다른 계정으로 로그인
        </button>
        <div class="uk-width-1-1 uk-margin-top" v-if="calendarList.length > 0">
            <h4>사용할 달력 <button class="uk-button uk-button-small uk-button-primary" @click="saveCalendar">적용</button></h4>
            <ul class="uk-list uk-list-divider uk-width-1-1 uk-text-left itemlist">
                <li v-for="(key) in calendarList" :key="key.id">
                    <input type="checkbox" class="uk-checkbox" v-model="key.checked" :disabled="key.isprimary">
                    <span  class="uk-margin-small-left" :uk-tooltip="[key.isprimary? '기본 달력입니다': null]">{{key.summary}}</span>
                </li>
            </ul>
        </div>
        <div v-else-if="calendarList.length == 0">
            목록 불러오는 중 <div uk-spinner />
        </div>
        </div>
    </div>
</template>
  
<script setup lang="ts">
import { ref, inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Sketch } from '@ckpack/vue-color'
import type { DesktopCalStore } from '../../../stores/desktopCalendar'
import {
    desktopApi,
    type CalendarListEntry,
    type Cleanup
} from '../../../services/desktopApi'
import { convertColor } from '../../../shared/color'

const store = inject("DeskCalStore") as DesktopCalStore

const calendarWidth = ref(1024)
const calendarHeight = ref(903)
const calendarMaxSize = ref([1024, 903])
const windowSizeReady = ref(false)
let resizeFrame: number | undefined
let disposed = false

const calendarList = ref<CalendarListEntry[]>([])
const calendarType = ref(store.getOptions("calendarType"))
const calendarStyle = ref(store.getOptions("calendar"))
const borderColor = ref<any>(convertColor("hex", calendarStyle.value.color))
const backgroundColor = ref<any>(convertColor("hex", calendarStyle.value.background))

function updateWindowSize() {
    if (!windowSizeReady.value) {
        return
    }
    if (576 <= calendarHeight.value && calendarHeight.value <= calendarMaxSize.value[1]) {
        if (1024 <= calendarWidth.value && calendarWidth.value <= calendarMaxSize.value[0]) {
            desktopApi.setProgramSize(calendarWidth.value, calendarHeight.value)
        }
    }
}

function queueWindowSize() {
    if (!windowSizeReady.value || resizeFrame !== undefined) {
        return
    }
    resizeFrame = requestAnimationFrame(() => {
        resizeFrame = undefined
        updateWindowSize()
    })
}

function flushWindowSize() {
    if (resizeFrame !== undefined) {
        cancelAnimationFrame(resizeFrame)
        resizeFrame = undefined
        updateWindowSize()
    }
}

async function saveCalendar() {
    await desktopApi.saveCalendarList(calendarList.value)
    desktopApi.requestReloadCalendar()
}

async function deleteToken() {
    calendarList.value = []
    await desktopApi.saveCalendarList(calendarList.value)
    desktopApi.deleteToken()
}

function save (key:string, value:any) {
    // console.log(key, value)
    desktopApi.sendMainSettingData(key, value)
}

function updateCalendarColor() {
    save('calendar', calendarStyle.value)
}

function changeButton(type:string) {
    calendarStyle.value.buttonType = type
    save('calendar', calendarStyle.value)
}

function changeView() {
    if (calendarType.value == '') {
        return
    }
    save('calendarType', calendarType.value)
}

let stopCalendarListReset: Cleanup | undefined

onMounted(async () => {
    stopCalendarListReset = desktopApi.onCalendarListReset((value) => {
        calendarList.value = value
    })
    const calendarListRequest = desktopApi.getCalendarList().then((value) => {
        if (!disposed) {
            calendarList.value = value
        }
    })
    const windowSizeRequest = desktopApi.getProgramSize().then(async (size) => {
        if (disposed) {
            return
        }
        calendarMaxSize.value = size.displayArea
        await nextTick()
        if (disposed) {
            return
        }
        calendarWidth.value = size.window[0]
        calendarHeight.value = size.window[1]
        // Let the initial values settle without resizing the main window.
        await nextTick()
        if (!disposed) {
            windowSizeReady.value = true
        }
    })
    await Promise.all([calendarListRequest, windowSizeRequest])
})

onBeforeUnmount(() => {
    disposed = true
    flushWindowSize()
    stopCalendarListReset?.()
})

watch([calendarWidth, calendarHeight], queueWindowSize)

watch(borderColor, (newValue) => {
    if ((typeof newValue) == "string") {
        return
    }
    calendarStyle.value.color = borderColor.value.rgba
    updateCalendarColor()
})

watch(backgroundColor, (newValue) => {
    if ((typeof newValue) == "string") {
        return
    }
    calendarStyle.value.background = backgroundColor.value.rgba
    updateCalendarColor()
})

</script>

<style>
.itemlist {
    height: 300px;
    overflow: auto;
}
</style>
