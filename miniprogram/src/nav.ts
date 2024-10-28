import { Nav } from '@miniprogram/navigate'
import { Router } from '@/router'

export const nav = new Nav<Router>()

nav.beforeEach((to, from) => {
    console.info(to, from)
    // return {
    //     url: Router.SUBPAGESA_HOME,
    //     query: { a: 1 }
    // }
    // 如果没有登录，不允许进入
    // uni.showModal({
    //     title: '提示',
    //     content: '路由被拦截了'
    // })
    // return false
	return true
})

nav.beforeEach((to, from) => {
    console.info(to, from)
    // return {
    //     url: Router.SUBPAGESA_HOME,
    //     query: { a: 1 }
    // }
	return true
    // 如果没有登录，不允许进入
    // uni.showModal({
    //     title: '提示',
    //     content: '路由被拦截了'
    // })
    // return false
})
