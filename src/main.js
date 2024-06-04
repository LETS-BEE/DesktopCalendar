import 'uikit/dist/css/uikit.min.css'
import axios from "axios";
import $ from 'jquery'
import jQueryUI from 'jquery-ui'

import { createApp } from 'vue'
import { app, getCurrentWindow } from '@electron/remote'

import Emitter from 'tiny-emitter'
import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import Vue3linkify from 'vue-3-linkify'

import { Settings } from 'luxon'

import App from './App.vue'
import router from './router'
import store from './store'

// jquery
window.$ = $
// fullcalendar datepicker 때문에 추가
window.jQuery = jQueryUI

// datepicker Locale 설정
window.defaultLocale = Settings.defaultLocale = 'ko'

const win = getCurrentWindow()
const enableMouse = function() {
    win.setIgnoreMouseEvents(false)
}
const disableMouse = function(e) {
    if (e) {
        const pos = e.currentTarget.getBoundingClientRect()
        if ( e.clientX > pos.left && e.clientY > pos.top && e.clientX < pos.left + pos.width && e.clientY < pos.top + pos.height ) {
            return true
        }
    }
    win.setIgnoreMouseEvents(true, { forward: true })
}

let Vue = createApp(App)
Vue.component('DatePicker', Datepicker)
Vue.use(Vue3linkify)

Vue.config.globalProperties.$http = axios
Vue.config.globalProperties.emitter = new Emitter()
Vue.config.globalProperties.DevMode = () => { return process.env.NODE_ENV === "development" }
Vue.config.globalProperties.setIgnore = enableMouse
Vue.config.globalProperties.disableIgnore = disableMouse

window.appdata = Vue.config.globalProperties.appdata = app.getPath('userData')
window.appVersion = Vue.config.globalProperties.appVersion = app.getVersion()

Vue.use(router)

// using Vuex
Vue.use(store)

Vue.mount("#app")