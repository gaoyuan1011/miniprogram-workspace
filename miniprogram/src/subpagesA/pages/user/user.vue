<script setup lang="ts">
import { nav } from '@/nav'
import { Router } from '@/router'
import { ref } from 'vue'

const title = ref('Hello')

function onClick() {
  nav.navigateTo({
    url: Router.INDEX
  })
}

</script>

<template>
  <view
    class="flex flex-col items-center justify-center bg-black"
    @click="onClick"
  >
    <image
      class="w-[200rpx] h-[200rpx] mb-[50rpx] mx-auto"
      src="@/assets/logo.png"
    />
    <view class="flex justify-center">
      <text class="text-[36rpx] text-[#8f8f94] hover:text-white">
        {{ title }}
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>

</style>
