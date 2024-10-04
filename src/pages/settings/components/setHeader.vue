<template>
    <div class="uk-card uk-card-default" uk-sticky>
        <div class="uk-card uk-card-small uk-card-default uk-padding-small setting-header" type="default" uk-grid>
            <img :src="`icon.png`" alt="Desktop Calendar" id="main-icon" />
            <span class="uk-h2 uk-card-body">
                Desktop Calendar 설정
                <span class="uk-h3">{{ currentVersion }}</span>
            </span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGetAppVersion } from '../../../composables/util'

const currentVersion = ref("")

onMounted(async () => {
    currentVersion.value = await useGetAppVersion()
})

</script>
  
<style>
#main-icon {
    width: 100px;
}
.setting-header {
    box-shadow: none !important;
    user-select: none;
}
</style>
  