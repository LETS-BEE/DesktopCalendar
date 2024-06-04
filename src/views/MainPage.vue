<template>
  <div class="uk-flex uk-flex-wrap-stretch">
    <div class="uk-width-1-5">
      <main-note />
    </div>
    <div class="uk-width-4-5">
      <main-timer />
      <main-calendar />
    </div>
  </div>
</template>

<script>
import Timer from '../components/Status/Timer.vue'
import calender from '../components/Calendar'
import Memo from '../components/Note/NoteMemo.vue'

export default {
  name: 'main-page',
  components: {
    'main-timer': Timer,
    'main-note': Memo,
    'main-calendar': calender
  },
  mounted() {
    this.setIgnore()
    this.disableIgnore()
    const { ipcRenderer } = window.require('electron')
    ipcRenderer.on('setOption', (event, message) => {
      this.$store.commit('setOptions', message)
    })
  }

}

</script>

<style lang="scss"></style>