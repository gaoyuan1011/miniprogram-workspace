import { PluginOption } from "vite"
import ci from 'miniprogram-ci'

interface Setting {
  es6?: boolean
  es7?: boolean
  minifyJS?: boolean
  minifyWXML?: boolean
  minifyWXSS?: boolean
  minify?: boolean
  codeProtect?: boolean
  autoPrefixWXSS?: boolean
}

interface VitePluginMiniUploadOptions {
  enable: boolean
  appid: string
  projectPath?: string
  privateKeyPath: string
  type?: 'miniProgram'|'miniProgramPlugin'|'miniGame'|'miniGamePlugin'
  ignores?: string[]
  version: string
  desc?: string
  setting?: Setting
  robot?: number
  threads?: number
}

export function vitePluginMiniCiUpload(options: VitePluginMiniUploadOptions): PluginOption {
  let outDir = ''
  return {
    name: 'vite-plugin-mini-ci-upload',
    configResolved(config) {
      outDir = config.build.outDir
    },
    async closeBundle() {
      if (!options.enable) {
        return
      }
      const project = new ci.Project({
        appid: options.appid,
        type: options.type ?? 'miniProgram',
        projectPath: options.projectPath ?? outDir,
        privateKeyPath: options.privateKeyPath,
        ignores: options.ignores,
      })
      const result = await ci.upload({
        project,
        version: options.version,
        desc: options.desc,
        setting: options.setting,
        robot: options.robot,
        threads: options.threads,
      })
      console.info(result)
    },
  }
}