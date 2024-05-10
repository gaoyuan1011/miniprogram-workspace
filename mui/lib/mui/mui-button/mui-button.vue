<script lang="ts" setup>

</script>

<template>
  <view class="flex flex-col w-[100%]">
    <button
      auto-focus
      placeholder="将会获取焦点"
    >
      <slot />
    </button>
  </view>
</template>
