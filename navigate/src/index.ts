import type { App } from "vue"

type SwitchTabOptions<T> = Omit<UniApp.SwitchTabOptions, "url"> & {
    query?: Record<string, string>;
    url: T;
};
type ReLaunchOptions<T> = Omit<UniApp.ReLaunchOptions, "url"> & {
    query?: Record<string, string>;
    url: T;
};
type RedirectToOptions<T> = Omit<UniApp.RedirectToOptions, "url"> & {
    query?: Record<string, string>;
    url: T;
};
type NavigateToOptions<T> = Omit<UniApp.NavigateToOptions, "events" | "url"> & {
    query?: Record<string, string>;
    url: T;
};
type UrlResultType = string | number

const EVENT_GET = "miniprogram-event-get-key"
const EVENT_SET = "miniprogram-event-set-key"

export class RouterInterruptError extends Error { 
    constructor(message?: string) {
        super(message)
    }
}


function parseUrl(url: string, query?: Record<string, UrlResultType>) {
    if (query) {
        const q = []
        for (const [key, value] of Object.entries(query)) {
            q.push(`${key}=${decodeURIComponent(`${value}`)}`)
        }
        if (url.indexOf("?") !== -1) {
            return `${url}&${q.join("&")}`
        }
        return `${url}?${q.join("&")}`
    }
    return url
}

const map = new WeakMap()


function switchTab<T extends string>(options: SwitchTabOptions<T>) {
    return uni.switchTab(options)
}

function reLaunch<T extends string>(options: ReLaunchOptions<T>) {
    return uni.reLaunch(options)
}

function redirectTo<T extends string>(options: RedirectToOptions<T>) {
    return uni.redirectTo(options)
}

function navigateTo<T extends string>(options: NavigateToOptions<T>) {
    Reflect.deleteProperty(options, "events")
    return uni.navigateTo(options)
}

function navigateBack(options?: UniApp.NavigateBackOptions) {
    return uni.navigateBack(options)
}

function back(result?: Record<string, UrlResultType>) {
    const page = currentPage()
    if (page) {
        const data = map.get(page)
        map.delete(page)
        if (data && data.query) {
            const instance = currentInstance()
            if (instance) {
                const eventChannel = instance.getOpenerEventChannel() as UniApp.EventChannel
                eventChannel.emit(data.query[EVENT_GET], result)
            }
        }
    }
    uni.navigateBack()
}

function navigate<T extends string>(options: NavigateToOptions<T>, data?: Record<string, UrlResultType>) {
    Reflect.deleteProperty(options, "events")
    return new Promise((resolve, reject) => {
        const getEventName = `event-get-${Math.floor(Math.random() * 10000000) + Date.now()}`
        const setEventName = `event-set-${Math.floor(Math.random() * 10000000) + Date.now()}`
        if (!options.query) {
            options.query = {}
        }
        if (options.query[EVENT_GET]) {
            console.warn("query[EVENT_GET] is exists")
        }
        if (options.query[EVENT_SET]) {
            console.warn("query[EVENT_SET] is exists")
        }
        Object.assign(options.query, {
            [EVENT_GET]: getEventName,
            [EVENT_SET]: setEventName,
        })
        uni.navigateTo({
            url: parseUrl(options.url, options.query),
            animationType: options.animationType,
            animationDuration: options.animationDuration,
            events: {
                [getEventName](result: Record<string, UrlResultType>) {
                    resolve(result)
                },
            },
            success(res) {
                res.eventChannel.emit(setEventName, data)
                options.success && options.success(res)
            },
            fail(res) {
                options.fail && options.fail(res)
                reject(res)
            },
            complete(res) {
                options.complete && options.complete(res)
            },
        })
    })
}

export function onNavigate(query?: AnyObject, fn?: (result?: Record<string, UrlResultType>) => void) {
    if (query) {
        const setEventName = query[EVENT_SET]
        const instance = currentInstance()
        if (instance) {
            const eventChannel = instance.getOpenerEventChannel() as UniApp.EventChannel
            eventChannel.once(setEventName, (event) => {
                fn && fn(event)
            })
            return
        }
    }
    fn && fn()
}

export function navigatePlugin() {
    return {
        install(app: App) {
            app.mixin({
                onUnload() {
                    // 处理不是使用nav.back退出的页面
                    const page = currentPage()
                    if (page && map.has(page)) {
                        const data = map.get(page)
                        map.delete(page)
                        const instance = currentInstance()
                        if (instance) {
                            const eventChannel = instance.getOpenerEventChannel() as UniApp.EventChannel
                            eventChannel.emit(data.query[EVENT_GET])
                        }
                    }
                },
                onLoad(query?: AnyObject) {
                    if (query) {
                        const setEventName = query[EVENT_SET]
                        if (setEventName) {
                            const page = currentPage()
                            if (page) {
                                map.set(page, {
                                    query
                                })
                            }
                        }
                    }
                }
            })
        },
    }
}

export function currentPage() {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    if (page) {
        return page
    }
    return null
}

export function currentInstance() {
    const page = currentPage()
    if (page) {
        return page.$vm
    }
    return null
}

type NextOption<T> = { url: T; query?: Record<string, string | number> }
type ToOption = { url: string; query?: Record<string, string | number> }
type FromOption = { url?: string; query?: Record<string, string | number> }

interface Handlers<T>{
    fulfilled: ( to: ToOption, from: FromOption ) => (boolean | NextOption<T>) | Promise<boolean | NextOption<T>>
}

export class Nav<T extends string> {

    fulfilled: Handlers<T>['fulfilled'][] = []

    #assignNext(options: SwitchTabOptions<T> | ReLaunchOptions<T> | RedirectToOptions<T> | NavigateToOptions<T>, next: NextOption<T>) {
        Object.assign(options, next)
    }

    async switchTab(options: SwitchTabOptions<T>) {
        const next = await this.execFulfilled( { url: options.url, query: options.query } )
        if (next === false) 
            throw new RouterInterruptError('Routing jump interrupt')
        this.#assignNext(options, next)
        return switchTab(options)
    }

    async reLaunch(options: ReLaunchOptions<T>) {
        const next = await this.execFulfilled( { url: options.url, query: options.query } )
        if (next === false) 
            throw new RouterInterruptError('Routing jump interrupt')
        this.#assignNext(options, next)
        return reLaunch(options)
    }

    async redirectTo(options: RedirectToOptions<T>) {
        const next = await this.execFulfilled( { url: options.url, query: options.query } )
        if (next === false) 
            throw new RouterInterruptError('Routing jump interrupt')
        this.#assignNext(options, next)
        return redirectTo(options)
    }

    async navigateTo(options: NavigateToOptions<T>) {
        const next = await this.execFulfilled( { url: options.url, query: options.query } )
        if (next === false) 
            throw new RouterInterruptError('Routing jump interrupt')
        this.#assignNext(options, next)
        return navigateTo(options)
    }

    navigateBack(options?: UniApp.NavigateBackOptions) {
        return navigateBack(options)
    }

    back(result?: Record<string, UrlResultType>) {
        return back(result)
    }

    async navigate(options: NavigateToOptions<T>, data?: Record<string, UrlResultType>) {
        const next = await this.execFulfilled( { url: options.url, query: options.query } )
        if (next === false) 
            throw new RouterInterruptError('Routing jump interrupt')
        this.#assignNext(options, next)
        return navigate(options, data)
    }

    async execFulfilled(to: Parameters<Handlers<T>['fulfilled']>[0]): Promise<NextOption<T> | false> {
        const page = currentPage()
        const from: Parameters<Handlers<T>['fulfilled']>[1] = { url: page?.route }
        let _to = to
        for (let index = 0; index < this.fulfilled.length; index++) {
            const func = this.fulfilled[index]
            const next = await func(_to, from)
            if (next === false) {
                return false
            }
            if (next && next !== true) {
                _to = next
            }
        }
        return _to as NextOption<T>
    }

    beforeEach(fn: Handlers<T>['fulfilled']) {
        this.fulfilled.push(fn)
    }
}
