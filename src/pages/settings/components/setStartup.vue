<template>
    <div class="uk-padding-large uk-padding-remove-top">
        <h2>프로그램 세부 설정</h2>
        시작 시 프로그램 자동 실행
        <input
            type="checkbox"
            class="uk-checkbox"
            v-model="onstartup"
            @change="changeMode"
        />
        <p>
            달력 갱신 시간
            <select
            class="uk-select uk-width-1-6"
            v-model="refreshTime"
            @change="setTime"
            >
            <option
                v-for="item, index in refreshTimeList"
                :key="index"
                :value="item.key"
            >{{ item.value }}</option>
            </select>
        </p>
        <p>
            <button class="uk-button uk-button-small uk-button-danger" @click="restartApp">
                초기화
            </button>
        </p>
    </div>
</template>
  
<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import {
    DesktopCalStore,
    useSetAutoStartProgram, useGetAutoStartProgram,
    useRestartApp
} from '../../../composables/util'

const store = inject("DeskCalStore") as DesktopCalStore
const onstartup = ref(false)
const refreshTime = ref(600)
const refreshTimeList = ref([
    { key: 60, value:  "1분"},
    { key: 300, value:  "5분"},
    { key: 600, value:  "10분"},
    { key: 1800, value:  "30분"},
    { key: 3600, value:  "1시간"},
    { key: 5400, value:  "2시간"},
])

onMounted(async () => {
    onstartup.value =  await useGetAutoStartProgram()
    refreshTime.value = store.getOptions("refreshTime")
})

function changeMode() {
    if (onstartup.value) {
        useSetAutoStartProgram(true)
    } else {
        useSetAutoStartProgram(false)
    }
}

function restartApp() {
    localStorage.clear()
    useRestartApp()
}

function setTime() {
    store.setOption("refreshTime", refreshTime.value)
}


</script>