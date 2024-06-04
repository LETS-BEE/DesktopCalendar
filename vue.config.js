const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        "productName": "desktop-calendar",
        "appId": "com.ingmagine.deskcal",
        "directories": {
          "buildResources": "public"
        },
        "nsis": {
          "oneClick": false,
          "allowToChangeInstallationDirectory": true
        }
      }
    }
  },
  configureWebpack: {
    resolve: {
      fallback: {
        'path': false,
        'fs': false,
        'stream': require.resolve('stream-browserify'),
        'crypto': require.resolve('crypto-browserify'),
        'zlib': false,
        'https': require.resolve('https-browserify'),
        'os': require.resolve('os-browserify'),
        'net': false,
        'child_process': false,
        'tls': false,
        'http2': false,
        'http': require.resolve('stream-http')
      }
    }
  }
})