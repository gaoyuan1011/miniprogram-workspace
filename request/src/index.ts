import { generateUUID, concurrentQueue } from '@miniprogram/utils'

export class RequestError extends Error { 
    constructor(message?: string) {
        super(message)
    }
}

interface Handlers<T> {
    fulfilled: (value: T) => T | Promise<T>;
    rejected?: (error?: unknown) => unknown;
}

interface BaseOption {
    baseURL: string;
}

class Callback<T> {
    #handlers: Handlers<T>[] = []
    use(
        onFulfilled: Handlers<T>["fulfilled"],
        onRejected?: Handlers<T>["rejected"]
    ) {
        this.#handlers.push({
            fulfilled: onFulfilled,
            rejected: onRejected,
        })
    }
    forEach(fn: (handled: Handlers<T>) => void) {
        for (let index = 0; index < this.#handlers.length; index++) {
            const handler = this.#handlers[index]
            fn(handler)
        }
    }
}

class Interceptors<T, F, Q = never, B = never> {
    request = new Callback<T>()
    response = new Callback<F>()
    fileRequest = new Callback<Q>()
    fileResponse = new Callback<B>()
}

const TaskRequestMap = new Map<AbortController['signal'], UniApp.RequestTask | UniApp.UploadTask>()

export class AbortController {
    abort() {
        const task = TaskRequestMap.get(this.signal)
        if (task) {
            TaskRequestMap.delete(this.signal)
            task.abort()
        }
    }
    signal: string
    constructor() {
        this.signal = generateUUID()
        console.info(this.signal)
    }
}

type RequestOptions = UniApp.RequestOptions & { callback?: (task: UniApp.RequestTask) => void, signal?: AbortController['signal'] }
type UploadOptions = UniApp.UploadFileOption & { callback?: (task: UniApp.UploadTask) => void, signal?: AbortController['signal'], onProgressUpdate?: (result: UniApp.OnProgressUpdateResult) => void, onHeadersReceived?: (result: Record<string, string>) => void }

function baseRequest(options: RequestOptions) {
    return new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
        const complete = options.complete
        options.complete = (result: UniApp.GeneralCallbackResult) => {
            complete && complete(result)
            if (options.signal) {
                TaskRequestMap.delete(options.signal)
            }
        }
        const fail = options.fail
        options.fail = (result: UniApp.GeneralCallbackResult) => {
            reject(new RequestError(result.errMsg))
            fail && fail(result)
            if (options.signal) {
                TaskRequestMap.delete(options.signal)
            }
        }
        const success = options.success
        options.success = (result: UniApp.RequestSuccessCallbackResult) => {
            resolve(result)
            success && success(result)
            if (options.signal) {
                TaskRequestMap.delete(options.signal)
            }
        }
        try {
            const task = uni.request(options) as unknown as UniApp.RequestTask
            if (options.signal) {
                TaskRequestMap.set(options.signal, task)
            }
            options.callback && options.callback(task)
        } catch (error) {
            if (options.signal) {
                TaskRequestMap.delete(options.signal)
            }
            if (error instanceof Error) {
                reject(new RequestError(error.message))
            } else {
                reject(new RequestError('Unknown error'))
            }
        }
    })
}

function baseFileRequest(options: UploadOptions) {
    return new Promise<UniApp.UploadFileSuccessCallbackResult>((resolve, reject) => {
        let task: UniApp.UploadTask
        const complete = options.complete
        options.complete = (result: UniApp.GeneralCallbackResult) => {
            complete && complete(result)
            if (options.signal) {
                TaskRequestMap.delete(options.signal)
            }
            if (task) {
                if (options.onHeadersReceived) {
                    task.offHeadersReceived(options.onHeadersReceived)
                }
                if (options.onProgressUpdate) {
                    task.offProgressUpdate(options.onProgressUpdate)
                }
            }
        }
        const fail = options.fail
        options.fail = (result: UniApp.GeneralCallbackResult) => {
            reject(new RequestError(result.errMsg))
            fail && fail(result)
            if (options.signal) {
                TaskRequestMap.delete(options.signal)
            }
        }
        const success = options.success
        options.success = (result: UniApp.UploadFileSuccessCallbackResult) => {
            resolve(result)
            success && success(result)
            if (options.signal) {
                TaskRequestMap.delete(options.signal)
            }
        }
        try {
            task = uni.uploadFile(options) as unknown as UniApp.UploadTask
            if (options.onProgressUpdate) {
                task.onProgressUpdate(options.onProgressUpdate)
            }
            if (options.onHeadersReceived) {
                task.onHeadersReceived(options.onHeadersReceived)
            }

            if (options.signal) {
                TaskRequestMap.set(options.signal, task)
            }
            options.callback && options.callback(task)
        } catch (error) {
            if (options.signal) {
                TaskRequestMap.delete(options.signal)
            }
            if (error instanceof Error) {
                reject(new RequestError(error.message))
            } else {
                reject(new RequestError('Unknown error'))
            }
        }
    })
}

export class Request {
    #option?: BaseOption

    private constructor(option?: BaseOption) {
        this.#option = option
    }

    static create(option?: BaseOption) {
        if (!uni) {
            throw new Error("请在uniapp环境中使用 @miniprogram/request")
        }
        return new Request(option)
    }

    interceptors = new Interceptors<
        UniApp.RequestOptions,
        UniApp.RequestSuccessCallbackResult,
        UniApp.UploadFileOption,
        UniApp.UploadFileSuccessCallbackResult
    >()

    request(
        options: RequestOptions
    ) {
        if (this.#option) {
            if (this.#option.baseURL) {
                options.url = this.#option.baseURL + options.url
            }
        }

        this.interceptors.request.forEach((handler) => {
            const { rejected, fulfilled } = handler
            try {
                fulfilled(options)
            } catch (error) {
                rejected?.(error)
            }
        })

        try {
            let result = baseRequest(options)
            this.interceptors.response.forEach((handler) => {
                const { rejected, fulfilled } = handler
                result = result.then(fulfilled, rejected) as Promise<UniApp.RequestSuccessCallbackResult>
            })
            return result
        } catch (error) {
            return Promise.reject(error)
        }
    }

    get(options: RequestOptions) {
        options.method = 'GET'
        return this.request(options)
    }

    post(options: RequestOptions) {
        options.method = 'POST'
        return this.request(options)
    }


    #fileRequest(options: UploadOptions) {
        if (this.#option) {
            if (this.#option.baseURL) {
                options.url = this.#option.baseURL + options.url
            }
        }

        this.interceptors.fileRequest.forEach((handler) => {
            const { rejected, fulfilled } = handler
            try {
                fulfilled(options)
            } catch (error) {
                rejected?.(error)
            }
        })

        try {
            let result = baseFileRequest(options)
            this.interceptors.fileResponse.forEach((handler) => {
                const { rejected, fulfilled } = handler
                result = result.then(fulfilled, rejected) as Promise<UniApp.UploadFileSuccessCallbackResult>
            })
            return result
        } catch (error) {
            return Promise.reject(error)
        }
    }

    upload(options: UploadOptions) {
        return this.#fileRequest(options)
    }

    uploadQueue(files: string | string[], options: Omit<UploadOptions, 'filePath'>, queue = 5) {
        return new Promise<boolean>((resolve) => {
            const concurrent = concurrentQueue({
                taskNum: queue,
                done: () => {
                    console.info('done')
                    resolve(true)
                }
            })
            let _files: string[] = []
            if (Object.prototype.toString.call(files) === '[object String]') {
                _files = [files as string]
            }
            if (files instanceof Array) {
                _files = files
            }
            if (_files.length) {
                for (let index = 0; index < _files.length; index++) {
                    const file = _files[index]
                    concurrent.push(() => {
                        this.upload({
                            ...options,
                            filePath: file
                        }).finally(() => {
                            concurrent.done()
                            concurrent.next()
                        })
                    })
                }
                concurrent.run()
            } else {
                concurrent.done()
            }
        })
    }
}
