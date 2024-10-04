<script setup lang="ts">
import setHeader from './components/setHeader.vue'
import setTimer from './components/setTimer.vue'
import setCalendar from './components/setCalendar.vue'
import setStartup from './components/setStartup.vue'
</script>

<template>
    <div style="user-select:none">
        <setHeader />
        <setTimer />
        <setCalendar />
        <setStartup />
    </div>
</template>