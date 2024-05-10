主包写在pages下

分包采用格式，添加分包需要在 [vite.config.ts](vite.config.ts) `rollupPluginMiniPages::subPaths` 添加路径
可以考虑采用约定sub开头的文件夹视为分包

  - 主包名称
    - pages
    - static

每个页面下都需要有个[name].json文件
  style是小程序属性
  order为排序（生序）
