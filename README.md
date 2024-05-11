[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## 缝合怪

采用多种技术框架，搭建的小程序解决方案，降低开发阶段的心智成本，提高研发效率。

## monorepo

此架构采用`monorepo`理念设计的，不了解的可以看这个大神写的文章《[pnpm + workspace + changesets 构建你的 monorepo 工程](https://juejin.cn/post/7098609682519949325)》，非常不错，给我提供了一些帮助。

## 项目结构

- miniprogram-workspace
    - icon （具体实现可以使用字体图标库、或者使用svg，建议封装成vue组件）
    - miniprogram（小程序主项目）
    - mui（公共组件库）
    - navigate（路由导航，支持页面间以promise的方式传递数据，支持拦截器）
    - plugins（vite相关插件）
    - request（网络请求封装，支持拦截器，支持文件上传，并发上传）
    - utils（公共函数库）

## 创建uniapp项目

[使用@vue/cli创建，模版选择使用vite+ts](https://uniapp.dcloud.net.cn/quickstart-cli.html)，`npx degit dcloudio/uni-preset-vue#vite-ts 项目名称`  ，创建模版的命令，名称暂用`miniprogram`代替，下载完毕后需要修改地方。

```json
// package.json
{
	"type": "module"
}
```

```jsx
import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import type { Plugin } from 'vite'

// vite.config.ts 
export default defineConfig({
  plugins: [(uni as unknown as { default: () => Plugin[] }).default()],
  // 按理不应该这样处理，估计@dcloudio/vite-plugin-uni打包有问题，看官方是否会修复这个问题
});
```

此项目是依赖`monorepo` 设计的，需要将uniapp项目作为子目录，`pnpm-workspace.yaml` 加入配置即可。（主目录暂用`miniprogram-workspace` （工程目录）代替）。

## 插件配置

### vitePluginMiniPages

这个插件的作用是自动生成pages.json文件，支持每个页面独立的json配置文件。插件源码[查看](https://github.com/gaoyuan1011/miniprogram-workspace/blob/main/plugins/src/vite-plugin-mini-pages.ts)

```json
// index.jso，和index.vue 同级目录
{
  "style": {
    "navigationBarTitleText": "测试"
  },
  "order": -1, // 排序 生序
  "name": "路由名称"
}
```

可以在指定的路径生成router.ts文件，包含所有页面的路由信息，路由跳转具体页面可以使用这个枚举。

```jsx
export const router = {
  /** /pages/index/index */
  INDEX: '/pages/index/index',
  /** /subpagesB/pages/user/user */
  SUBPAGESB_USER: '/subpagesB/pages/user/user',
}

export enum Router {
  /** /pages/index/index */
  INDEX = '/pages/index/index',
  /** /subpagesB/pages/user/user */
  SUBPAGESB_USER = '/subpagesB/pages/user/user',
}
```

插件配置项，添加到`miniprogram` 项目`vite.config.ts`内。

```jsx
import { vitePluginMiniPages } from '@miniprogram/plugins'

vitePluginMiniPages({
  paths: path.join(__dirname, 'src/pages'), // 主包路径
  subPaths: glob.globSync(path.join(__dirname, 'src/sub*')), // 分包路径
  pagesFile: path.join(__dirname, 'src/pages.json'), // pages.json文件路径
  routerFile: path.join(__dirname, 'src/router.ts'), // router.ts文件路径
  rootPath: path.join(__dirname, 'src'), // 监听根目录
})
```

### vitePluginOssAssets

这个插件的作用是自动把assets资源引用的资源文件自动上传到ali-oss，打包后的路径替换成oss资源地址，自动删除上传的资源文件，插件配置项，添加到`miniprogram` 项目`vite.config.ts`内。插件源码[查看](https://github.com/gaoyuan1011/miniprogram-workspace/blob/main/plugins/src/vite-plugin-oss-assets.ts)

```jsx
// vite.config.ts

import { vitePluginOssAssets } from '@miniprogram/plugins'

{
  plugins: [
	  vitePluginOssAssets({
        accessKeyId: '*********************************',
        accessKeySecret: '*****************************',
        bucket: 'bucket', // 桶
        bucketPath: 'dev/public/', // 子目录，主要区分环境路径
        includes: /\.svg$|\.png$|\.jpg$/, // 需要处理的资源类型
        assetsPath: path.join(__dirname, 'src/assets'), // 资源文件路径
        version: true, // 是否自动添加文件版本（默认添加文件hash），boolean | string
        enable: true, // 是否启动插件 
        replace(url: string) {
          // 将本地文件路径替换成oss地址
          return {
            name: url,
            uri: new URL(url, `${'https://www.aliyuncs.com/'}${'dev/public/'}`).href,
          }
        },
      })
  ],
	resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}
```

```html

<image
  class="w-[200rpx] h-[200rpx] mb-[50rpx] mx-auto"
  src="@/assets/logo.png"
/>
```

### vitePluginMiniCiUpload

这个插件的作用是打包自动发布小程序到体验。具体官方文档查看[这里](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)。插件源码[查看](https://github.com/gaoyuan1011/miniprogram-workspace/blob/main/plugins/src/vite-plugin-mini-ci-upload.ts)

```jsx
// vite.config.ts

import { vitePluginMiniCiUpload } from '@miniprogram/plugins'

{
	plugins: [
		vitePluginMiniCiUpload({
        enable: result.mode === 'production',
        appid: '***************************',
        privateKeyPath: path.join(__dirname, 'ci/private.key'), // 私钥文件路径，小程序的私钥文件
        version: '0.0.1',
        setting: {
          es6: false,
          minify: true,
        },
      })
	]
}
```

## @miniprogram/navigate 说明文档

源码[查看](https://github.com/gaoyuan1011/miniprogram-workspace/tree/main/navigate)

```tsx
export declare class Nav<T extends string> {
    switchTab(options: SwitchTabOptions<T>): Promise<any>;
    reLaunch(options: ReLaunchOptions<T>): Promise<any>;
    redirectTo(options: RedirectToOptions<T>): Promise<any>;
    navigateTo(options: NavigateToOptions<T>): Promise<UniApp.NavigateToSuccessOptions>;
    navigateBack(options?: UniApp.NavigateBackOptions): Promise<any>;
    back(result?: NavigateResultObject): void;
    navigate(options: NavigateToOptions<T>, data?: NavigateResultObject): Promise<NavigateResultObject>;
    beforeEach(fn: Handlers<T>['fulfilled']): void;
}
export declare function onNavigate(query?: AnyObject, fn?: (result?: NavigateResultObject) => void): void;
export declare function navigatePlugin(): {
    install(app: App): void;
};
export declare function currentPage(): Page.PageInstance<AnyObject, {}> | null;
export declare function currentInstance(): any;
```

switchTab, reLaunch, redirectTo, navigateTo，重写了options参数，url类型为T范型，新增query参数，会自动拼接到地址url上

初始化Nav类，传入范型`Router` 类达到约束url的目的。

```tsx
import { Nav } from '@miniprogram/navigate'
import { Router } from '@/router'

export const nav = new Nav<Router>()

// 拦截器用法
nav.beforeEach(async (to, from) => {
	  // 1、重定向路由，继续下一个拦截器
    return {
       url: Router.SUBPAGESA_HOME,
       query: { a: 1 }
    }
    // 2、继续下一个拦截器
    return true
    
    // 3、终止 之后的拦截器都不执行
    return false
})
```

navigate、back、onNavigate方法配套使用

```tsx
// index.vue

console.info('我进去了 home')
const data = await nav.navigate(
	  {
	    url: Router.HOME,
	    query: { key: '1' },
	  },
	  {
	    test: 1,
	  },
)
console.info('我出来了 home', data) // { a: 1 }
```

```tsx
// home.vue

onLoad((query) => {
  onNavigate(query, (event) => {
    console.info(event) // { test: 1 }
  })
})

function onBack() {
  nav.back({ a: 1 })
}
```

为了处理不是通过back出栈的操作，防止内存溢出，需要在app实例使用插件`navigatePlugin`

```tsx
import { navigatePlugin } from '@miniprogram/navigate'

app.use(navigatePlugin())

// 监听页面卸载事件，来处理上个页面的promise
```

## @miniprogram/request 文档说明

源码[查看](https://github.com/gaoyuan1011/miniprogram-workspace/tree/main/request)

```tsx
export declare class Request {
    static create(option?: BaseOption): Request;
    interceptors: Interceptors<UniApp.RequestOptions, UniApp.RequestSuccessCallbackResult, UniApp.UploadFileOption, UniApp.UploadFileSuccessCallbackResult>;
    request(options: RequestOptions): Promise<UniApp.RequestSuccessCallbackResult>;
    get(options: RequestOptions): Promise<UniApp.RequestSuccessCallbackResult>;
    post(options: RequestOptions): Promise<UniApp.RequestSuccessCallbackResult>;
    upload(options: UploadOptions): Promise<UniApp.UploadFileSuccessCallbackResult>;
    uploadQueue(files: string | string[], options: Omit<UploadOptions, 'filePath'>, queue?: number): Promise<UniApp.UploadFileSuccessCallbackResult[]>;
}
```

参考`axios` 实现方式封装`uni.request` 

```tsx
import { AbortController, Request } from '@miniprogram/request'

// 初始化请求实例
const request = Request.create({
  baseURL: 'https://www.baidu.com',
})

// 定义请求拦截器
request.interceptors.request.use((config) => {
  return config
})
// 定义响应拦截器
request.interceptors.response.use(
  (result) => {
    if (result.statusCode === 404) {
      return Promise.reject(404)
    }
    return result
  },
  (error) => {
    return Promise.reject(error)
  },
)
// 定义响应拦截器
request.interceptors.response.use(
  (result) => {
    return result
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 定义上传响应拦截器
request.interceptors.fileResponse.use(
  (result) => {
    if (result.statusCode === 404) {
      return Promise.reject(404)
    }
    return result
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 中断请求
const abortController = new AbortController()
const data = await request.get({
  url: '/s?wd=a',
  signal: abortController.signal,
})
abortController.abort()

// 上传文件，并发上传
uni.chooseImage({
  count: 9,
  success: (res) => {
	  // 单个文件上传
    request.upload({
      url: '/upload',
      name: 'file',
      filePath: res.tempFilePaths[0]
    })
    
    // 并发上传 
    request.uploadQueue(res.tempFilePaths, {
      url: '/upload',
      name: 'file',
    }, 9)
  }
})
```

## 引入tailwindcss

直接采用[@uni-helper/vite-plugin-uni-tailwind](https://www.npmjs.com/package/@uni-helper/vite-plugin-uni-tailwind)解决方案。

```tsx
// vite.config.ts

import { defineConfig } from 'vite'
import nested from 'tailwindcss/nesting'
import tailwindcss from 'tailwindcss'
import tailwindcssConfig from './tailwind.config'
import postcssPresetEnv from 'postcss-preset-env'
import uni from '@dcloudio/vite-plugin-uni'
import uniTailwind from '@uni-helper/vite-plugin-uni-tailwind'

export default defineConfig({
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
    uni(),
    uniTailwind(),
  ],
})

// tailwind.config.ts

/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

import { basePreset, elementPlusPreset, miniprogramBasePreset } from 'tailwind-extensions'
import { isMp, isQuickapp } from '@uni-helper/uni-env'

const presets: Config['presets'] = [basePreset]
if (isMp || isQuickapp) {
  presets.push(
    elementPlusPreset({
      baseSelectors: [':root', 'page'],
    }),
    miniprogramBasePreset,
  )
}
else {
  presets.push(elementPlusPreset())
}

const theme: Config['theme'] = {}
if (isMp || isQuickapp)
  theme.screens = {}

const config: Config = {
  content: [
    'src/**/*.{vue,ts}',
    'src/main.ts',
    'src/App.vue',
    './index.html',
  ],
  corePlugins: {
    preflight: false,
    space: false,
    divideWidth: false,
  },
  divideColor: false,
  divideStyle: false,
  divideOpacity: false,
  presets,
  theme,
  plugins: [],
}

export default config
```

添加`tailwind.css`文件

```css
// tailwind.css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
```

在App.vue导入`tailwind.css`

```html
<style lang="scss">
@import "./styles/tailwind.css";
</style>
```

## 引入Eslint

```bash
npm init @eslint/config
# 选择 To check syntax and find problems
# 选择 JavaScript modules (import/export)
# 选择 Vue
# 选择 Does your project use TypeScript? yes
# 选择 Where does your code run? Browser
# 选择 Would you like to install them now? yes
# 选择 Which package manager do you want to use? pnpm
```

打开eslint.config.js文件

```jsx
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

/**
 * @type { import("eslint").Linter.Config[]}
 */
export default [
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'], // 更为严格的模式
  // ...pluginVue.configs["flat/essential"],
  {
    rules: {
      "vue/multi-word-component-names": "off",
      "no-undef": "off",
    },
	  // 添加自定义规则
  },
  {
	  ignores: [
      "**/dist/**/*.js",
      "**/dist/**/*.d.ts",
      "**/build/**/*.js",
      "**/build/**/*.d.ts",
      "**/node_modules/**/*.js",
      "**/node_modules/**/*.d.ts"
    ],
  }
];
```

`eslint-plugin-vue` 内包含多种预设项，具体请查看[这里](https://eslint.vuejs.org/rules/) 

修改`miniprogram-workspace` 下的`package.json`，添加两个命令后执行看是否有效果。

```json
{
	"scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  },
}
```

主流编辑器`vscode`配置`eslint` ，参考https://github.com/antfu/eslint-config。

```json
// .code-workspace 模式
{
	"settings": {
		"editor.formatOnSave": true,
		"eslint.experimental.useFlatConfig": true,
		"eslint.format.enable": true,
		"editor.codeActionsOnSave": {
			"source.fixAll.eslint": "explicit",
			"source.organizeImports": "never"
		},
		"prettier.enable": false,
		"eslint.rules.customizations": [
			{ "rule": "style/*", "severity": "off" },
			{ "rule": "format/*", "severity": "off" },
			{ "rule": "*-indent", "severity": "off" },
			{ "rule": "*-spacing", "severity": "off" },
			{ "rule": "*-spaces", "severity": "off" },
			{ "rule": "*-order", "severity": "off" },
			{ "rule": "*-dangle", "severity": "off" },
			{ "rule": "*-newline", "severity": "off" },
			{ "rule": "*quotes", "severity": "off" },
			{ "rule": "*semi", "severity": "off" }
		],
		"eslint.validate": [
			"javascript",
			"javascriptreact",
			"typescript",
			"typescriptreact",
			"vue",
			"html",
			"markdown",
			"json",
			"jsonc",
			"yaml",
			"toml",
			"gql",
			"graphql"
		],
	}
}

// .vscode/settings.json 模式
{
  "eslint.experimental.useFlatConfig": true,
  "prettier.enable": false,
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "eslint.rules.customizations": [
    { "rule": "style/*", "severity": "off" },
    { "rule": "format/*", "severity": "off" },
    { "rule": "*-indent", "severity": "off" },
    { "rule": "*-spacing", "severity": "off" },
    { "rule": "*-spaces", "severity": "off" },
    { "rule": "*-order", "severity": "off" },
    { "rule": "*-dangle", "severity": "off" },
    { "rule": "*-newline", "severity": "off" },
    { "rule": "*quotes", "severity": "off" },
    { "rule": "*semi", "severity": "off" }
  ],
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "html",
    "markdown",
    "json",
    "jsonc",
    "yaml",
    "toml",
    "gql",
    "graphql",
    "astro"
  ]
}
```

## 使用**commitlint**规范提交

约束`git commit`提交规范，工程目录执行以下命令。有需要了解[husky](https://typicode.github.io/husky/)这里查看。

```bash
pnpm install -wD @commitlint/cli @commitlint/config-conventional husky
```

`package.json` 添加脚本

```json
// package.json 添加脚本
{
	"scripts": {
	  "preinstall": "npx only-allow pnpm", // 强制使用pnpm
	  "postinstall": "husky install", // 初始化 husky
	  "commitlint": "commitlint --edit"
	}
}
```

创建`commitlint.config.js`配置文件

```jsx
/**
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
    extends: ['@commitlint/config-conventional'],
};
```

然后执行以下命令，`husky` 添加`commit-msg` 钩子。

```bash
echo "pnpm commitlint \${1}" > .husky/commit-msg 
```

控制台执行 `git commit -m 'test'` ，会发现无法提交成功。

由于添加提交规范，使用起来会比较麻烦，所以需要引入`commitizen` ，来简化`git commit`操作。

工程目录执行以下命令。

```bash
pnpm install -wD cz-conventional-changelog commitizen
```

`package.json` 添加脚本

```json
// package.json 添加脚本
{
	"scripts": {
	  "commit": "cz"
	},
	"config": {
	  "commitizen": {
	    "path": "cz-conventional-changelog"
	  }
	}
}
```

工程目录执行以下命令。

```bash
echo "exec < /dev/tty && pnpm commit --hook || true" > .husky/prepare-commit-msg
```

控制台执行 `git commit` ，就会出现可交互的命令行操作。

确保提交的代码风格一致，提交前用`eslint`检查。

```bash
pnpm install -wD lint-staged
```

```json
// package.json 添加脚本

{
	"scripts": {
	  "lint": "eslint .",
    "lint:fix": "eslint . --fix",
	  "lint-staged": "lint-staged"
	},
	"lint-staged": {
	  "**/*.{js,ts,jsx,tsx,vue}": [
	    "eslint --fix"
	  ]
	}
}
```

```bash
echo 'pnpm lint-staged' > .husky/pre-commit
```

命令行运行`pnpm lint-staged` ，只会检测需提交的文件。如果需要全量检测，执行`pnpm lint:fix` 。

写了这么多，都是一步一步实践来的，也算是对工作上对技术的总结吧！希望大家使用这个模版开发可以增加研发效率，有更多的时间去专研自己喜欢的东西。

这个模版不限于小程序，可以扩展到其他项目中，主要学习的是编程思维，让技术为自己所用。

也感谢大佬们的开源精神，我也奉上我这套模版的 https://github.com/gaoyuan1011/miniprogram-workspace 地址，有需求的可以通过 https://github.com/gaoyuan1011/miniprogram-workspace/issues 联系我，欢迎一起交流技术。