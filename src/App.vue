<script setup lang="ts">
// Use UIkit
import UIkit from 'uikit'
import Icons from 'uikit/dist/js/uikit-icons'

import dayjs from 'dayjs'
import 'dayjs/locale/ko'
import dayjs_localizedFormat from 'dayjs/plugin/localizedFormat'

UIkit.use(Icons)

dayjs.locale('ko')
dayjs.extend(dayjs_localizedFormat)

</script>

<template>
  <div class="uk-height-1-1">
    <RouterView></RouterView>
  </div>
</template>

<style>
/* CSS - 배경 투명화 */
html, body {
  background: none;
  height: 100%;
}
</style>
