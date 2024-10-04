<template>
    <div class="uk-text-center">
        <button
            class="uk-button uk-button-danger uk-button-small uk-position-medium uk-position-top-left"
            uk-slideshow-item="2"
        >이전</button>
        <span class="uk-text-lead">달력 종류 선택 </span>
        <br />
        <table class="uk-table uk-margin-remove-top">
            <thead>
                <tr>
                    <th class="uk-text-center">
                        <input
                            type="radio"
                            v-model="types"
                            class="uk-radio"
                            name="Views"
                            id="monthView"
                            value="month"
                        />
                        <label class="uk-margin-small-left" for="monthView">한 달</label>
                    </th>
                    <th class="uk-text-center">
                        <input
                            type="radio"
                            v-model="types"
                            class="uk-radio"
                            name="Views"
                            id="weekView"
                            value="week"
                        />
                        <label class="uk-margin-small-left" for="weekView">3주</label>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                    <img class="uk-width-4-5" :src="`month.png`" />
                    </td>
                    <td>
                    <img class="uk-width-4-5" :src="`black.png`" />
                    </td>
                </tr>
            </tbody>
        </table>
        <button class="uk-button uk-button-primary uk-button-small uk-position-medium uk-position-top-right" uk-slideshow-item="4">
        다음
        </button>
    </div>
</template>
  
<script setup lang="ts">
import { onMounted, ref, watch, inject } from 'vue'
import { DesktopCalStore } from '../../../composables/util'

const types = ref("")
const store = inject("DeskCalStore") as DesktopCalStore

watch(types, (newVal) => {
    store.setOptions({
        key: "calendarType",
        value: newVal
    })
})

onMounted(() => {
    types.value = store.getOptions("calendarType")
})
</script>

<style></style>
