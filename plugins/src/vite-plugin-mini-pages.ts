import type { PluginOption } from 'vite'
import chokidar from 'chokidar'
import * as glob from 'glob'
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Options {
    paths: string
    routerFile?: string
    subPaths: string[]
    pagesFile: string
    rootPath: string
}

type PageConfig = { path: string, root: string, style: Record<string, string>, order: number }

let isWatch = false
async function watchFile(options: Options) {
    if (isWatch) return
    isWatch = true
    try {

        const router: {annotation:string, text: string, enum: string}[] = []
        const pagesStr = fs.readFileSync(options.pagesFile).toString()
        const pagesObj = JSON.parse(pagesStr)
        const map = new Map<string, Partial<PageConfig>>()
        function getItem(key: string) {
            if (!map.has(key)) {
                map.set(key, {})
            }
            return map.get(key)
        }

        const fList = await glob.glob(`${options.paths}/**/*.{vue,json}`)
        for (let index = 0; index < fList.length; index++) {
            const fItem = fList[index]
            const p = path.relative(options.rootPath, fItem)
            if (p.endsWith('.vue')) {
                const key = p.replace('.vue', '')
                const obj = getItem(key)
                if (obj) {
                    obj.path = key
                }
            }
            if (p.endsWith('.json')) {
                const style = JSON.parse(fs.readFileSync(fItem).toString())
                const key = p.replace('.json', '')
                const obj = getItem(key)
                if (obj) {
                    Object.assign(obj, style)
                }
                router.push({
                    text: `${style.name ?? key.split('/')[1].toLocaleUpperCase()}: '/${key}'`,
                    annotation: `/** /${key} */`,
                    enum: `${style.name ?? key.split('/')[1].toLocaleUpperCase()} = '/${key}'`,
                })
            }
        }

        for (let index = 0; index < options.subPaths.length; index++) {
            const sub = options.subPaths[index]
            const subList = await glob.glob(`${sub}/**/*.{vue,json}`)
            for (let index = 0; index < subList.length; index++) {
                const subItem = subList[index]
                const p = path.relative(options.rootPath, subItem)
                if (p.endsWith('.vue')) {
                    const key = p.replace('.vue', '')
                    const obj = getItem(key)
                    const keys = key.split('/')
                    if (obj) {
                        obj.root = keys[0]
                        obj.path = keys.slice(1).join('/')
                    }
                }
                if (p.endsWith('.json')) {
                    const style = JSON.parse(fs.readFileSync(subItem).toString())
                    const key = p.replace('.json', '')
                    const obj = getItem(key)
                    if (obj) {
                        Object.assign(obj, style)
                    }
                    
                    const keys = key.split('/')

                    router.push({
                        text: `${style.name ?? [keys[0], keys[2]].join('_').toLocaleUpperCase()}: '/${key}'`,
                        annotation: `/** /${key} */`,
                        enum: `${style.name ?? [keys[0], keys[2]].join('_').toLocaleUpperCase()} = '/${key}'`
                    })
                }
            }
        }

        const pagesList = [...map.values()]
        const pages: Partial<PageConfig>[] = []
        const subPackages = new Map()
        for (let index = 0; index < pagesList.length; index++) {
            const item = pagesList[index]
            if (item.root) {
                if (!subPackages.has(item.root)) {
                    subPackages.set(item.root, {
                        root: item.root,
                        pages: []
                    })
                }
                const sub = subPackages.get(item.root)
                sub.pages.push({
                    path: item.path,
                    style: item.style
                })
            } else {
                pages.push(item)
            }
        }

        pages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        for (let index = 0; index < pages.length; index++) {
            const p = pages[index]
            Reflect.deleteProperty(p, 'order')
        }
        pagesObj.pages = pages
        pagesObj.subPackages = [...subPackages.values()]
        fs.writeFileSync(options.pagesFile, JSON.stringify(pagesObj, null, 2))

        if (options.routerFile) {
            let routerText = ''
            let routerEnum = ''
            for (let index = 0; index < router.length; index++) {
                const r = router[index]
                if (r.annotation) {
                    routerText += `  ${r.annotation}\n`
                    routerEnum += `  ${r.annotation}\n`
                }
                if (r.text) {
                    routerText += `  ${r.text},`
                }
                if (r.enum) {
                    routerEnum += `  ${r.enum},`
                }
                if (router.length - 1 !== index) {
                    routerText += '\n'
                    routerEnum += '\n'
                }
            }
            const routerStr = `export const router = {\n${routerText}\n}\n\nexport enum Router {\n${routerEnum}\n}\n`
            fs.writeFileSync(options.routerFile, routerStr)
        }
    } finally {
        isWatch = false
    }
}

export function vitePluginMiniPages(options: Options): PluginOption {
    return {
        name: "vite-plugin-mini-pages",
        config() {
            const wPath = []
            if (options.paths) {
                wPath.push(options.paths)
            }
            if (options.subPaths) {
                wPath.push(...options.subPaths)
            }
            chokidar.watch(wPath).on('all', (event, _path) => {
                switch (event) {
                    case 'add':
                    case 'addDir':
                    case 'unlink':
                    case 'unlinkDir':
                        watchFile(options)
                        break
                    case 'change':
                        if (_path.endsWith('.json')) {
                            watchFile(options)
                        }
                }
            })
        },
    }
}