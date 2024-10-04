/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string
    /** /dist/ or /public/ */
    VITE_PUBLIC: string
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import('electron').IpcRenderer
}

// https://stackoverflow.com/questions/76493066/uncaught-error-dynamic-require-of-child-process-is-not-supported
// https://www.google.com/search?q=dynamic+require+of+child_process+is+not+supported&sca_esv=fbe9ccf2a9e6ed60&ei=ihx9Zs_5KpuTvr0PoYyU4Ao&oq=Dynamic+require+of+%22child_process%22+is+not+supported&gs_lp=Egxnd3Mtd2l6LXNlcnAiM0R5bmFtaWMgcmVxdWlyZSBvZiAiY2hpbGRfcHJvY2VzcyIgaXMgbm90IHN1cHBvcnRlZCoCCAAyBxAAGIAEGBMyCBAAGIAEGKIEMggQABiABBiiBDIIEAAYgAQYogQyCBAAGIAEGKIEMggQABiABBiiBEivElAAWABwAHgBkAEAmAFuoAFuqgEDMC4xuAEByAEA-AEC-AEBmAIBoAJ1mAMAkgcDMC4xoAeEBg&sclient=gws-wiz-serp