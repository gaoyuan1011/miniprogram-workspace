import { navigatePlugin } from '@miniprogram/navigate'
import Appp from './App.vue'
import { createSSRApp } from "vue"

export function createApp() {
  const app = createSSRApp(Appp)
  app.use(navigatePlugin())
  return {
    app
  }
}
