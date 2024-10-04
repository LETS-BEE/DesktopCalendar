<template>
    <div class="uk-padding-large uk-padding-remove-top uk-margin-small-top">
        <h2>Time 설정</h2>
        <span class="uk-text-muted">
            표시되는 시간의 형식을 변경합니다. &nbsp;
            <input
                type="text"
                id="Timer"
                class="uk-input uk-width-1-5"
                v-model="exampleDayjs"
                @input="changeTime"
            />
            미리보기: <span v-text="exampleDayjsText"></span>
            <div>
            <button class="uk-button uk-button-primary uk-button-small" @click="saveTimerDayjs">
                적용하기
            </button>
            <button class="uk-button uk-button-secondary uk-button-small" @click="showHelp = !showHelp">
                문법 설명
            </button>
            <transition name="fade">
                <table
                    v-if="showHelp"
                    class="uk-table uk-table-striped uk-overflow-auto uk-table-small uk-margin-remove-top time-example"
                >
                    <thead>
                        <tr>
                            <th width="13%">문법</th>
                            <th width="18%">설명</th>
                            <th width="18%">예시</th>
                            <th width="15%">문법</th>
                            <th width="15%">설명</th>
                            <th width="*">예시</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>LT[S]</td>
                            <td>로컬 타임 [초]</td>
                            <td>{{ met("LTS") }}</td>
                            <td>YYYY-MM/DD</td>
                            <td>년-월/일</td>
                            <td>{{ met("YYYY-MM/DD") }}</td>
                        </tr>
                        <tr>
                            <td>LL</td>
                            <td>년월일</td>
                            <td>{{ met("LL") }}</td>
                            <td>LLLL</td>
                            <td>모든 시간</td>
                            <td>{{ met("LLLL") }}</td>
                        </tr>
                        <tr>
                            <td>hh:mm:ss</td>
                            <td>시분초(24시)</td>
                            <td>{{ met("hh:mm:ss") }}</td>
                            <td>A h:mm:ss</td>
                            <td>시분초(12시)</td>
                            <td>{{ met("A h:mm:ss") }}</td>
                        </tr>
                    </tbody>
                </table>
            </transition>
            </div>
            <p>
            고급 스타일 설정
            <input type="checkbox" class="uk-checkbox" v-model="expertMode" />
            </p>
            <p>
            표시되는 시간의 텍스트 크기를 변경합니다.
            <span v-if="expertMode">(css style)</span>&nbsp;
            <input
                type="text"
                v-if="expertMode"
                class="uk-input uk-width-1-6 uk-form-small"
                v-model="timerSize"
                @input="updateTimerSize"
            />
            <select
                v-else
                v-model="timerSize"
                @change="updateTimerSize"
                class="uk-select uk-width-1-6 uk-form-small"
            >
                <option value="0em">0%</option>
                <option value="0.5em">50%</option>
                <option value="1em">100%</option>
                <option value="2em">200%</option>
                <option value="3em">300%</option>
                <option value="4em">400%</option>
                <option value="5em">500%</option>
                <option value="6em">600%</option>
            </select>
            </p>
            <p>
                표시되는 시간의 텍스트 굵기를 변경합니다.
                <span v-if="expertMode">(css style)</span>&nbsp;
                <input
                    type="text"
                    v-if="expertMode"
                    class="uk-input uk-width-1-6 uk-form-small"
                    v-model="timerWeight"
                    @input="updateTimerFontWeight"
                />
                <select
                    v-else
                    v-model="timerWeight"
                    @change="updateTimerFontWeight"
                    class="uk-select uk-width-1-6 uk-form-small"
                >
                    <option>100</option>
                    <option>200</option>
                    <option>300</option>
                    <option>400</option>
                    <option>500</option>
                    <option>600</option>
                    <option>700</option>
                    <option>800</option>
                </select>
            </p>
            <p>
                표시되는 시간의 텍스트 색을 변경합니다.
                <Sketch v-if="expertMode"
                    v-model="timerColorPicker"
                />
                <select
                    v-else
                    v-model="timerColorSelect"
                    @change="updateTimerColor"
                    class="uk-select uk-width-1-6 uk-form-small"
                >
                    <option>black</option>
                    <option>white</option>
                    <option>red</option>
                    <option>green</option>
                    <option>blue</option>
                    <option>lightblue</option>
                    <option>aqua</option>
                    <option>brown</option>
                    <option v-if="!useSelector">{{ timerColor }}</option>
                </select>
            </p>
        </span>
    </div>
</template>
  
<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, inject } from 'vue'
import { DesktopCalStore, useSendMainSettingData } from '../../../composables/util'
import dayjs from 'dayjs'
import { Sketch } from '@ckpack/vue-color'

var interval:any

const showHelp = ref(false)
const expertMode = ref(false)
const useSelector = ref(true)
const store = inject('DeskCalStore') as DesktopCalStore

var exampleTime =  new Date()
const exampleDayjs = ref("")
const exampleDayjsText = ref("")

interface timerStyleif {
    color: string,
    weight: string,
    size: string
}
const timerStyle = ref<timerStyleif>()
const timerSize = ref("")
const timerWeight = ref("")
const timerColorSelect = ref("")
const timerColorPicker = ref()
const timerColor = ref("")

function changeTime() {
    exampleDayjsText.value = dayjs(exampleTime)
    .format(exampleDayjs.value)
}
    
function time() {
    exampleTime = new Date()
    changeTime()
}

function met(format:string) {
    return dayjs(exampleTime)
        .format(format);
}

function save(key:string, value:any) {
    // store.setOption(key, value)
    useSendMainSettingData(key, value)
}

function saveTimerDayjs() {
    save("timeMoment", exampleDayjs.value)
}

function updateTimerSize() {
    if (timerStyle.value == undefined) {
        return
    }
    timerStyle.value.size = timerSize.value
    save("timerStyle", timerStyle.value)
}

function updateTimerFontWeight() {
    if (timerStyle.value == undefined) {
        return
    }
    timerStyle.value.weight = timerWeight.value
    save("timerStyle", timerStyle.value)
}

function updateTimerColor() {
    if (timerStyle.value == undefined) {
        return
    }
    
    timerColor.value = timerColorSelect.value
    timerStyle.value.color = timerColor.value
    useSelector.value = true
    save("timerStyle", timerStyle.value)
}

onMounted(() => {
    exampleDayjs.value = store.getOptions("timeMoment")
    changeTime()
    setTimeout(() => {
        interval = setInterval(time, 1000)
    }, 1000 - new Date().getMilliseconds()) // Millisecond 맞춤

    // { color, weight, size }
    timerStyle.value = store.getOptions("timerStyle")
    if (timerStyle.value) {
        timerSize.value = timerStyle.value.size
        timerWeight.value = timerStyle.value.weight
        timerColor.value = timerColorPicker.value = timerColorSelect.value = timerStyle.value.color
    }
})

onBeforeUnmount(() => {
    if (interval) {
        clearInterval(interval)
    }
})

watch(timerColorPicker, (newValue) => {
    if (timerStyle.value) {
        if (timerStyle.value?.color == newValue) {
            return
        }
        timerColor.value = newValue.hex8
        timerColorSelect.value = newValue.hex8
        timerStyle.value.color = newValue.hex8
        useSelector.value = false
        save("timerStyle", timerStyle.value)
    }
})

</script>
  
<style>
.time-example > tbody > tr > td {
    word-break: keep-all;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0;
}
</style>
  