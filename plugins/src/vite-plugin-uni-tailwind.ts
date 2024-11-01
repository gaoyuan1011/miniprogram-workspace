import { isApp } from '@uni-helper/uni-env'
import type { PluginOption } from 'vite'
import MagicString from 'magic-string'
import {
  cssLangRE,
} from '@dcloudio/uni-cli-shared'
import { isStyleFile, transformStyle, transformTemplate } from '@uni-helper/vite-plugin-uni-tailwind'

/**
 * app打包将tailwindcss插值写法改成 -- 的写法 w-[12px] ==> w--12px- text-[#ccc] ==> text--h-ccc-
 * @returns 
 */
export function vitePluginUniTailwind(): PluginOption {
  return {
    name: 'vite-plugin-uni-tailwind',
    transform(code, id) {
      if (!isApp) return
      let s = new MagicString(code)
      if (cssLangRE.test(id)) {
        // tailwindcss 会识别text标签，并加一个这个样式，需要替换掉
        s.replace('color: rgb(var(--text-color));', 'color: #000000;')
        s = new MagicString(transformStyle(s.toString()))
      }
      if (id.endsWith('.nvue') || id.endsWith('.vue')) {
        s = new MagicString(transformTemplate(s.toString()))
      }
      return {
        code: s.toString(),
        map: s.generateMap()
      }
    }
  }
}

/** app打包 替换不是 tailwindcss 产生的样式，全局样式 */
export function vitePluginUniCssTailwind(): PluginOption {
  return {
    name: 'vite-plugin-uni-css-tailwind',
    // enforce: 'post',
    generateBundle(_, bundle) {
      if (!isApp) return
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (asset.type === 'asset') {
          const { source } = asset
          if (source && typeof source === 'string') {
            let newSource = ''
            if (isStyleFile(fileName)) {
              newSource = transformStyle(source)
            }
            asset.source = newSource || source
          }
        }
      }
    }
  }
}