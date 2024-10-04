<template>
    <div class="uk-margin-large-top uk-text-center">
        <button
            class="uk-button uk-button-danger uk-button-small uk-position-medium uk-position-top-left"
            uk-slideshow-item="3"
        >이전</button>
        <p class="uk-text-lead">프로그램 세부 설정</p>
        <p>
            시작시 프로그램 자동 실행
            <input
            type="checkbox"
            class="uk-checkbox"
            v-model="autoStart"
            @change="changeMode"
            />
        </p>
        <p>
            달력 갱신 시간
            <select class="uk-select uk-width-1-6" @change="setTime">
                <option value="60">1분</option>
                <option value="300">5분</option>
                <option value="600" selected>10분</option>
                <option value="1800">30분</option>
                <option value="3600">1시간</option>
                <option value="10800">3시간</option>
            </select>
        </p>
        <button
            class="uk-button uk-button-primary uk-button-small uk-position-medium uk-position-top-right"
            uk-slideshow-item="5"
            >다음</button
        >
    </div>
</template>
  
<script setup lang="ts">
import { onMounted, ref, inject } from 'vue'
import { useSetAutoStartProgram, useGetAutoStartProgram, DesktopCalStore } from '../../../composables/util'

const autoStart = ref(false)
const store = inject("DeskCalStore") as DesktopCalStore

function changeMode() {
    useSetAutoStartProgram(autoStart.value)
}

function setTime(e:any) {
    store.setOptions({
        key: "refreshTime",
        value: e.target.value
    })
}

onMounted(async () => {
    autoStart.value = await useGetAutoStartProgram()
})
</script>
  
<style></style>
  