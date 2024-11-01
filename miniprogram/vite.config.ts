import * as path from 'node:path'
import { URL, fileURLToPath } from 'node:url'
// import * as process from 'node:process'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import nested from 'tailwindcss/nesting'
import tailwindcss from 'tailwindcss'
import uvtw from '@uni-helper/vite-plugin-uni-tailwind'
import postcssPresetEnv from 'postcss-preset-env'
import { vitePluginMiniPages, vitePluginUniCssTailwind, vitePluginUniTailwind } from '@miniprogram/plugins'
import tailwindcssConfig from './tailwind.config'

export default defineConfig(() => {
  // const env = loadEnv(result.mode, process.cwd(), '')
  return {
    css: {
      postcss: {
        plugins: [
          nested(),
          tailwindcss({
            config: tailwindcssConfig,
          }),
          postcssPresetEnv({
            stage: 3,
            features: { 'nesting-rules': false },
          }),
        ],
      },
    },
    plugins: [
      vitePluginUniTailwind(),
      vitePluginUniCssTailwind(),
      (uni as unknown as { default: () => Plugin[] }).default(),
      uvtw(),
      vitePluginMiniPages({
        paths: path.join(__dirname, 'src/pages'),
        tabsPaths: path.join(__dirname, 'src/tabs'),
        subPaths: [path.join(__dirname, 'src/sub*')],
        pagesFile: path.join(__dirname, 'src/pages.json'),
        routerFile: path.join(__dirname, 'src/router.ts'),
        rootPath: path.join(__dirname, 'src'),
      }),
      // vitePluginOssAssets({
      //   accessKeyId: '*********************************',
      //   accessKeySecret: '*****************************',
      //   bucket: 'miniprogram-public',
      //   bucketPath: env.VITE_APP_OSS_BUCKET_PATH,
      //   includes: /\.svg$|\.png$|\.jpg$/,
      //   assetsPath: path.join(__dirname, 'src/assets'),
      //   version: true,
      //   enable: env.NODE_ENV !== 'development',
      //   replace(url: string) {
      //     return {
      //       name: url,
      //       uri: new URL(url, `${env.VITE_APP_OSS_PREFIX}${env.VITE_APP_OSS_BUCKET_PATH}`).href,
      //     }
      //   },
      // }),
      // vitePluginMiniCiUpload({
      //   enable: result.mode === 'production',
      //   appid: '***************************',
      //   privateKeyPath: path.join(__dirname, 'ci/private.key'),
      //   version: '0.0.1',
      //   setting: {
      //     es6: false,
      //     minify: true,
      //   },
      // }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
