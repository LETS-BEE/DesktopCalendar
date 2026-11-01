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

import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// pinia import ==> window id
import { createPinia } from 'pinia'
import {
    useDeskCalStore,
    type DesktopCalendarOptions
} from './stores/desktopCalendar'
import { desktopApi } from './services/desktopApi'

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
app.component('VueDatePicker', VueDatePicker)
app.use(router)
app.use(pinia)

const store = useDeskCalStore(pinia)
app.provide('DeskCalStore', store)
desktopApi.onSettingData((key, value) => {
    store.setOption(
        key as keyof DesktopCalendarOptions,
        JSON.parse(value)
    )
})
app.mount('#app')
