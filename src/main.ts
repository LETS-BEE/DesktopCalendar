// base import
import { createApp } from 'vue'
import './style.css'
import 'uikit/dist/css/uikit.min.css'
import App from './App.vue'

// router import
import { createRouter, createWebHashHistory, /* createWebHistory */ } from 'vue-router'
import MainView from './pages/main/index.vue'
import SettingsView from './pages/settings/index.vue'
import SetupView from './pages/setup/index.vue'

import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// pinia import ==> window id
import { createPinia } from 'pinia'
import { useDeskCalStore } from './composables/util'

const pinia = createPinia()

const router = createRouter({
    // base: process.env.BASE_URL,
    history: createWebHashHistory(), // import.meta.env.IS_ELECTRON ? createWebHashHistory() : createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'MainPage',
            component: MainView
        },
        {
            path: '/setting',
            name: 'SettingPage',
            component: SettingsView
        },
        {
            path: '/setup',
            name: 'SetupPage',
            component: SetupView
        }
    ]
})

const app = createApp(App)
app.component('DatePicker', Datepicker)
app.use(router)
app.use(pinia)

app.mount('#app').$nextTick(() => {
  // Use contextBridge
  // window.ipcRenderer.on('main-process-message', (_event, message) => {
  //   console.log(message)
  // })
    const store = useDeskCalStore()
    app.provide('DeskCalStore', store)
    window.ipcRenderer.on('getSettingData', (_event, key, value) => {
        // console.log(key, value)
        store.setOption(key, JSON.parse(value))
    })
})