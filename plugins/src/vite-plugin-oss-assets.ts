import * as path from 'node:path'
import * as fs from 'node:fs'
import OSS from 'ali-oss'
import type { PluginOption } from 'vite'
import { normalizePath } from 'vite'
import { hashFile } from 'hasha'
import * as glob from 'glob'

interface VitePluginOssAssetsOptions {
  enable: boolean
  includes: RegExp
  replace: (url: string) => { name: string, uri: string }

  accessKeyId: string
  accessKeySecret: string
  bucket: string
  bucketPath: string
  assetsPath: string
  version: boolean | string
}

export function vitePluginOssAssets(options: VitePluginOssAssetsOptions & { rootPath?: string }): PluginOption {
  const client = new OSS({
    accessKeyId: options.accessKeyId,
    accessKeySecret: options.accessKeySecret,
    bucket: options.bucket,
  })

  const list: string[] = []
  let outDir = ''
  let assetsDir = ''

  return {
    name: 'vite-plugin-oss-assets',
    config(config) {
      if (config) {
        config.publicDir = 'static'
        if (config.build) {
          config.build.assetsDir = 'assets'
        }
      }
    },
    configResolved(config) {
      outDir = config.build.outDir
      assetsDir = config.build.assetsDir
      options.rootPath = config.root
    },
    async transform(_, id) {
      if (options.enable)
        if (options.includes.test(id)) {
          list.push(id)
          const name = path.relative(options.assetsPath, id)
          const fullName = normalizePath(path.join(options.bucketPath, name))
          let version = ''
          const localFileHash = await hashFile(id, { algorithm: 'md5' })
          if (typeof options.version === 'boolean') {
            if (options.version) {
              version = `?_=${localFileHash}`
            }
          }
          else if (options.version) {
            version = `?_=${options.version}`
          }
          try {
            const res = await client.head(fullName)
            const remoteFileStat = (res.res.headers as Record<string, string>).etag as string
            if (localFileHash.toLocaleUpperCase() !== remoteFileStat.toLocaleUpperCase().replace(/"/g, '')) {
              console.info(`\n${name}：与本地不匹配`, localFileHash, remoteFileStat)
              console.info(`\n${name}：开始上传`)
              await client.put(fullName, id)
              console.info(`\n${name}：结束上传`)
            }
          }
          catch (e) {
            console.info(`\n${name}：开始上传`)
            await client.put(fullName, id)
            console.info(`\n${name}：结束上传`)
          }
          return {
            code: `export default "${options.replace(normalizePath(name)).uri}${version}"`,
            map: null,
          }
        }
      return null
    },
    closeBundle() {
      if (options.enable){
        let fList = glob.globSync(`${options.assetsPath}/**`).map(f => normalizePath(f))
        fList = fList.filter(f => !fs.statSync(f).isDirectory() && !list.includes(f))
        if (fList.length) {
          console.info('未使用的资源：\n')
          console.info(fList)
        }
        fs.rmSync(path.join(outDir, assetsDir), { recursive: true, force: true })
      }
    },
  }
}
