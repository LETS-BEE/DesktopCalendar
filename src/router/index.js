import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

const router = createRouter({
    base: process.env.BASE_URL,
    history: process.env.IS_ELECTRON ? createWebHashHistory() : createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'MainPage',
            component: () => import('../views/MainPage.vue')
        },
        {
            path: '/setting',
            name: 'SettingPage',
            component: () => import('../views/SettingPage.vue')
        },
        {
            path: '/setup',
            name: 'SetupPage',
            component: () => import('../views/SetupPage.vue')
        }
    ]
})

export default router