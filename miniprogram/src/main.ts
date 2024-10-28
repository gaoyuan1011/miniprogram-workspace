import { navigatePlugin } from '@miniprogram/navigate'
import App from './App.vue'
import { createSSRApp } from "vue"

export function createApp() {
  const app = createSSRApp(App)
  app.use(navigatePlugin())
  return {
    app
  }
}
