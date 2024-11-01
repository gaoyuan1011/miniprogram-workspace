<script lang="ts" setup>

</script>

<template>
  <view class="flex flex-col">
    <button
      auto-focus
      placeholder="将会获取焦点"
    >
      <slot />
    </button>
  </view>
</template>
