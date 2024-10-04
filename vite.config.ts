import { defineConfig } from 'vite'
// import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [
//     vue(),
//     electron({
//       main: {
//         // Shortcut of `build.lib.entry`.
//         entry: 'electron/main.ts',
//       },
//       preload: {
//         // Shortcut of `build.rollupOptions.input`.
//         // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
//         input: path.join(__dirname, 'electron/preload.ts'),
//       },
//       // Ployfill the Electron and Node.js API for Renderer process.
//       // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
//       // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
//       renderer: process.env.NODE_ENV === 'test'
//         // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
//         ? undefined
//         : {},
//     }),
//   ],
// })

import fs from 'node:fs'
import pkg from './package.json'

export default defineConfig(({ command }) => {
  fs.rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    plugins: [
      vue(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: 'electron/main.ts',
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
            } else {
              startup()
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron',
              rollupOptions: {
                // Some third-party Node.js libraries may not be built correctly by Vite, especially `C/C++` addons, 
                // we can use `external` to exclude them to ensure they work correctly.
                // Others need to put them in `dependencies` to ensure they are collected into `app.asar` after the app is built.
                // Of course, this is not absolute, just this way is relatively simple. :)
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: 'electron/preload.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: {},
      }),
    ],
    clearScreen: false,
  }
})