<template>
    <div class="uk-flex" style="height: 15%;">
        <h1
        class="uk-text-center uk-margin-auto uk-margin-auto-vertical"
        :style="{
        'font-size': timeStyle.size,
        'font-weight': timeStyle.weight,
        'color': timeStyle.color,
        }"
        style="user-select:none"
        >
        {{ datenow }}
        </h1>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, inject } from 'vue'
import dayjs from 'dayjs'
import { DesktopCalStore } from '../../../composables/util'

const store = inject("DeskCalStore") as DesktopCalStore

let datenow = ref("")
let interval:NodeJS.Timeout | undefined
let timeStyle = ref<any>()
timeStyle.value = store.getOptions('timerStyle')

function time() {
    datenow.value = dayjs().format(store.getOptions('timeMoment'))
}

onMounted(() => {
    time()
    setTimeout(() => {
        interval = setInterval(time, 1000)
    }, 1000 - (new Date()).getMilliseconds())
})

onBeforeUnmount(() => {
    clearInterval(interval)
})

watch(store.$state, (newValue) => {
    timeStyle.value = newValue.options.timerStyle
})

</script>

<style></style>
