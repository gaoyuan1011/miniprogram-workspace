<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { onNavigate } from '@miniprogram/navigate'
import { Router } from '@/router'
import { nav } from '@/nav'

const title = ref('Hello')

function onBack() {
  nav.back({ a: 1 })
}

async function onClick() {
  console.info('我进去了 user')
  const aa = await nav.navigate(
    {
      url: Router.USER,
      query: { key: '1' },
    },
    {
      a: 1,
    },
  )
  console.info('我出来了 user', aa)
}

onLoad((query) => {
  onNavigate(query, (event) => {
    console.info(event)
  })
})
</script>

<template>
  <view class="flex flex-col items-center justify-center">
    <image
      class="w-[200rpx] h-[200rpx] mb-[50rpx] mx-auto"
      src="@/assets/logo.png"
      @click="onClick"
    />
    <view class="flex justify-center">
      <text class="text-[36rpx] text-[#8f8f94] hover:text-white">
        {{ title }}
      </text>
    </view>
    <button @click="onBack">
      退出
    </button>
  </view>
</template>

<style lang="scss" scoped></style>
