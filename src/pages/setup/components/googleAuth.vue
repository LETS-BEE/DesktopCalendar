<template>
    <div class="uk-text-center">
        <div v-if="!isAuthed">
            <p class="uk-text-lead">
            동기화하려면 Google 계정 로그인이 필요합니다.
            </p>
            <button class="uk-button-primary uk-button-small" @click="auth">로그인</button>
        </div>
        <div v-else-if="!calendarList.length">
            목록 불러오는 중 <div uk-spinner />
        </div>
        <div class="uk-width-large uk-align-center" v-else>
            <p class="uk-text-lead">
                사용할 달력을 선택하세요.
                <button
                    class="uk-position-medium uk-position-top-right uk-button-primary uk-button-small"
                    uk-slideshow-item="2"
                    @click="save"
                >
                다음
                </button>
            </p>
            <ul class="uk-list uk-list-divider uk-width-1-1 uk-text-left itemlist">
                <li v-for="key in calendarList" :key="key">
                    <input
                        type="checkbox"
                        class="uk-checkbox"
                        v-model="key.checked"
                        :disabled="key.isprimary"
                    />
                    <span class="uk-margin-small-left" :uk-tooltip="[key.isprimary ? '기본 달력입니다' : null]">{{
                    key.summary
                    }}</span>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGoogleAuth, useSaveCalendar } from '../../../composables/util';

let isAuthed = ref<boolean>(false)
let calendarList = ref<Array<any>>([])

function auth() {
    useGoogleAuth(isAuthed, calendarList)
}

function save() {
    useSaveCalendar(calendarList)
}

</script>

<style scoped>
.itemlist {
  /* height: 300px; */
  overflow: scroll;
}
</style>