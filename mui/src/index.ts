import type { PluginAPI } from 'tailwindcss/types/config'

export default function plugin(options: PluginAPI) {
    const c = 'node_modules/@miniprogram/mui/**/*.{vue,ts}'
    const config = options.config()
    if (!config) return
    if (config.content instanceof Array) {
        if (!config.content.includes(c)) {
            config.content.push(c)
        }
    } else if (config.content instanceof Object) {
        if (!config.content.files.includes(c)) {
            config.content.files.push(c)
        }
    }
}