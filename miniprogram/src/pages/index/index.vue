<script setup lang="ts">
import { ref } from 'vue'
import { AbortController, Request } from '@miniprogram/request'
import { Router } from '@/router'
import { nav } from '@/nav'
import { RouterInterruptError } from '@miniprogram/navigate'

const title = ref('Hello')

async function onClick() {
  console.info('我进去了 home')
  const aa = await nav.navigate(
    {
      url: Router.HOME,
      query: { key: '1' },
    },
    {
      a: 1,
    },
  ).catch(error => {
	  console.info('error', error)
    if (error instanceof RouterInterruptError) {
      console.info('1')
    }
    return Promise.reject()
  })

  console.info('我出来了 home', aa)
}

const request = Request.create({
  baseURL: 'https://www.baidu.com',
})

request.interceptors.request.use((config) => {
  return config
})
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
request.interceptors.response.use(
  (result) => {
    return result
  },
  (error) => {
    return Promise.reject(error)
  },
)

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

async function test() {
  try {
    const abortController = new AbortController()
    const data = await request.get({
      url: '/s?wd=a',
      signal: abortController.signal,
    })
    console.info(data)
  }
  catch (error) {
    console.info('error', error)
  }
  finally {
    console.info('finally')
  }
}
test()

const value = ref('')

function onUpload() {
  uni.chooseImage({
    count: 9,
    success: (res) => {
      request.uploadQueue(res.tempFilePaths, {
        url: '/upload',
        name: 'file',
      })
      request.upload({
        url: '/upload',
        name: 'file',
        filePath: res.tempFilePaths[0]
      })
    }
  })
}
</script>

<template>
  <view class="flex flex-col items-center justify-center">
    <image
      class="w-[200rpx] h-[200rpx] mb-[50rpx] mx-auto"
      src="@/assets/logo.png"
      @click="onClick()"
    />
    <view class="flex justify-center">
      <text class="text-[36rpx] text-[#8f8f94] hover:text-white">
        {{ title }}
      </text>
    </view>
  </view>
  <view @click="onUpload">
    <mui-button>上传</mui-button>
  </view>
  <mui-button>12312312</mui-button>
  <mui-input />
  {{ value }}
  <input
    v-model="value"
    auto-focus
    placeholder="将会获取焦点"
  >
</template>

<style lang="scss" scoped></style>
