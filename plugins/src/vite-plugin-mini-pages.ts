import type { PluginOption } from 'vite'
import chokidar from 'chokidar'
import * as glob from 'glob'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { normalizePath } from 'vite'

interface Options {
    paths: string
    tabsPaths?: string
    routerFile?: string
    subPaths: string[]
    pagesFile: string
    rootPath: string
}

type PageConfig = { path: string, root?: string, style: Record<string, string>, order: number, tab?:string }
type RouterData = { annotation:string, text: string, enum: string }

let isWatch = false
async function watchFile(options: Options) {
    if (isWatch) return
    isWatch = true
    try {

        const router: RouterData[] = []
        const pagesStr = fs.readFileSync(options.pagesFile).toString()
        const pagesObj = JSON.parse(pagesStr)
        const map = new Map<string, PageConfig>()
        const routerMap = new Map<string, RouterData>()
        function getItem(key: string) {
            if (!map.has(key)) {
                map.set(key, {
                    path: '',
                    style: {},
                    order: 0,
                })
            }
            return map.get(key)
        }

        const fList = await glob.glob(`${normalizePath(options.paths)}/**/*.{vue,nvue,json}`)
        for (let index = 0; index < fList.length; index++) {
            const fItem = fList[index]
            const p = normalizePath(path.relative(options.rootPath, fItem))
            if (p.endsWith('.vue') || p.endsWith('.nvue')) {
                const key = p.replace(/\.vue|\.nvue/, '')
                const obj = getItem(key)
                if (obj) {
                    obj.path = key
                }

                const rItem = {
                    text: `${key.split('/')[1].toLocaleUpperCase()}: '/${key}'`,
                    annotation: `/** /${key} */`,
                    enum: `${key.split('/')[1].toLocaleUpperCase()} = '/${key}'`,
                }
                routerMap.set(key, rItem)
                router.push(rItem)
            }
            if (p.endsWith('.json')) {
                const style = JSON.parse(fs.readFileSync(fItem).toString())
                const key = p.replace('.json', '')
                const obj = getItem(key)
                if (obj) {
                    Object.assign(obj, style)
                }
                const rItem = routerMap.get(key)
                if (rItem) {
                    rItem.text = `${style.name ?? key.split('/')[1].toLocaleUpperCase()}: '/${key}'`
                    rItem.annotation = `/** /${key} */`
                    rItem.enum = `${style.name ?? key.split('/')[1].toLocaleUpperCase()} = '/${key}'`
                }
            }
        }

        if (options.tabsPaths) {
            const tList = await glob.glob(`${normalizePath(options.tabsPaths)}/**/*.{vue,nvue,json}`)
            for (let index = 0; index < tList.length; index++) {
                const tItem = tList[index]
                const p = normalizePath(path.relative(options.rootPath, tItem))
                if (p.endsWith('.vue') || p.endsWith('.nvue')) {
                    const key = p.replace(/\.vue|\.nvue/, '')
                    const obj = getItem(key)
                    if (obj) {
                        obj.path = key
                        obj.tab = key
                    }
    
                    const rItem = {
                        text: `${key.split('/')[1].toLocaleUpperCase()}: '/${key}'`,
                        annotation: `/** /${key} */`,
                        enum: `${key.split('/')[1].toLocaleUpperCase()} = '/${key}'`,
                    }
                    routerMap.set(key, rItem)
                    router.push(rItem)
                }
                if (p.endsWith('.json')) {
                    const style = JSON.parse(fs.readFileSync(tItem).toString())
                    const key = p.replace('.json', '')
                    const obj = getItem(key)
                    if (obj) {
                        Object.assign(obj, style)
                    }
                    const rItem = routerMap.get(key)
                    if (rItem) {
                        rItem.text = `${style.name ?? key.split('/')[1].toLocaleUpperCase()}: '/${key}'`
                        rItem.annotation = `/** /${key} */`
                        rItem.enum = `${style.name ?? key.split('/')[1].toLocaleUpperCase()} = '/${key}'`
                    }
                }
            }
        }

        const subPaths = options.subPaths.map(s => normalizePath(s))
        for (let index = 0; index < subPaths.length; index++) {
            const subPathItem = subPaths[index]
            const fSubList = await glob.glob(normalizePath(subPathItem))
            for (let index = 0; index < fSubList.length; index++) {
                const sub = normalizePath(fSubList[index])
                const subList = await glob.glob(`${sub}/**/*.{vue,nvue,json}`)
                for (let index = 0; index < subList.length; index++) {
                    const subItem = subList[index]
                    const p = normalizePath(path.relative(options.rootPath, subItem))
                    if (p.endsWith('.vue') || p.endsWith('.nvue')) {
                        const key = p.replace(/\.vue|\.nvue/, '')
                        const obj = getItem(key)
                        const keys = key.split('/')
                        if (obj) {
                            obj.root = keys[0]
                            obj.path = keys.slice(1).join('/')
                        }

                        const rItem = {
                            text: `${[keys[0], keys[2]].join('_').toLocaleUpperCase()}: '/${key}'`,
                            annotation: `/** /${key} */`,
                            enum: `${[keys[0], keys[2]].join('_').toLocaleUpperCase()} = '/${key}'`
                        }
                        routerMap.set(key, rItem)
                        router.push(rItem)
                    }
                    if (p.endsWith('.json')) {
                        const style = JSON.parse(fs.readFileSync(subItem).toString())
                        const key = p.replace('.json', '')
                        const obj = getItem(key)
                        if (obj) {
                            Object.assign(obj, style)
                        }
                        
                        const keys = key.split('/')

                        const rItem = routerMap.get(key)
                        if (rItem) {
                            rItem.text = `${style.name ?? [keys[0], keys[2]].join('_').toLocaleUpperCase()}: '/${key}'`
                            rItem.annotation = `/** /${key} */`
                            rItem.enum = `${style.name ?? [keys[0], keys[2]].join('_').toLocaleUpperCase()} = '/${key}'`
                        }
                    }
                }
            }
        }

        const pagesList = [...map.values()].sort((a, b) => a.path.localeCompare(b.path)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        const pages: Partial<PageConfig>[] = []
        const subPackages = new Map()
        const tabBarList: { pagePath: string }[] = []
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
            }
            else {
                if (item.tab) {
                    tabBarList.push({ pagePath: item.path })
                }
                pages.push(item)
            }
        }

        pages.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        for (let index = 0; index < pages.length; index++) {
            const p = pages[index]
            Reflect.deleteProperty(p, 'order')
            Reflect.deleteProperty(p, 'tab')
        }

        if (!pagesObj.tabBar) {
            pagesObj.tabBar = {}
        }
        if (!pagesObj.tabBar.list) {
            pagesObj.tabBar.list = []
        }
        for (let index = 0; index < tabBarList.length; index++) {
            const item = tabBarList[index]
            const ind = pagesObj.tabBar.list.findIndex((t:{ pagePath: string }) => t.pagePath === item.pagePath)
            if (ind === -1) {
                pagesObj.tabBar.list.push(item)
            }
        }
        const _list = []
        for (let index = 0; index < pagesObj.tabBar.list.length; index++) {
            const item = pagesObj.tabBar.list[index]
            if (tabBarList.find(t => t.pagePath === item.pagePath)) {
                _list.push(item)
            }
        }
        pagesObj.tabBar.list = _list
        
        pagesObj.pages = pages
        pagesObj.subPackages = [...subPackages.values()]
        fs.writeFileSync(options.pagesFile, JSON.stringify(pagesObj, null, 2))

        const _router = router.sort((a, b) => a.text.localeCompare(b.text))
        if (options.routerFile) {
            let routerText = ''
            let routerEnum = ''
            for (let index = 0; index < _router.length; index++) {
                const r = _router[index]
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
                if (_router.length - 1 !== index) {
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
            if (options.tabsPaths) {
                wPath.push(options.tabsPaths)
            }
            if (options.subPaths) {
                const subPaths = options.subPaths.map(s => normalizePath(s))
                for (let index = 0; index < subPaths.length; index++) {
                    const sub = subPaths[index]
                    const fSubList = glob.globSync(normalizePath(sub))
                    wPath.push(...fSubList)
                }
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