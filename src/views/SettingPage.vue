<template>
  <div id="setting-main">
    <setting-header />
    <setting-timer :set="settings" />
    <setting-calendar :set="settings" :parent="parents" />
    <setting-program :set="settings" />
  </div>
</template>

<script>
import SettingHeader from '../components/Settings/Header.vue'
import SettingTimer from '../components/Settings/SettingTimer.vue'
import SettingCalendar from '../components/Settings/SettingCalendar.vue'
import SettingProgram from '../components/Settings/SettingProgram.vue'
import * as remote from '@electron/remote'
import { ipcRenderer } from 'electron'

export default {
    name: 'setting-page',
    components: {
        'setting-header': SettingHeader,
        'setting-timer': SettingTimer,
        'setting-calendar': SettingCalendar,
        'setting-program': SettingProgram
    },
    data() {
        return {
            settings: this.$store.getters.getAll,
            parents: remote.getCurrentWindow().getParentWindow().webContents
        }
    },
    mounted() {
        ipcRenderer.on('init-options', (event, store) => {
            this.settings = store
            this.settings.changeOption = function(key, value) {
              console.log(key)
              console.log(value)
                remote
                  .getCurrentWindow()
                  .getParentWindow()
                  .webContents.send('setOption', {
                    key: key,
                    value: value
                  })
                this[key] = value
            }
        })
    }
}

</script>