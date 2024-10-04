<template>
    <div class="uk-flex uk-height-1-1">
      <div class="uk-width-1-4">
        <NoteMemo />
      </div>
      <div class="uk-width-3-4">
        <Timer />
        <Calendar />
      </div>
    </div>
  </template>
  
<script setup lang="ts">
import Timer from './components/timer.vue'
import Calendar from './components/calendar.vue'
// @ts-ignore
import NoteMemo from './components/memo.vue'

import { onMounted } from 'vue'
import { useEnableMouse, useDisableMouse } from '../../composables/util'

onMounted(() => {
  useEnableMouse()
  useDisableMouse()
})
</script>