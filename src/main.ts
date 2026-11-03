// base import
import { createApp } from 'vue'
import './style.css'
import 'uikit/dist/css/uikit.min.css'
import App from './App.vue'

// router import
import { createRouter, createWebHashHistory, /* createWebHistory */ } from 'vue-router'
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
            component: () => import('./pages/main/index.vue')
        },
        {
            path: '/setting',
            name: 'SettingPage',
            component: () => import('./pages/settings/index.vue')
        },
        {
            path: '/setup',
            name: 'SetupPage',
            component: () => import('./pages/setup/index.vue')
        }
    ]
})

const app = createApp(App)
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
