<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')
</script>

<template>
  <view class="flex flex-col">
    <input
      v-model="value"
      auto-focus
      placeholder="将会获取焦点111"
    >
  </view>
</template>
