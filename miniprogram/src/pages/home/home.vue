<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { nav } from '@/nav'
const isLoad = ref(false)
const webViewSrc = ref('/hybrid/html/index.html')
// const webViewSrc = ref('https://uniapp.dcloud.io/static/web-view.html')
console.info('webViewSrc', webViewSrc.value)
function onWebLoad() {
	console.info('1111')
}

function onMessage(e) {
	console.info(e.detail)
	nav.back(e.detail.data[0])
}

onLoad((query) => {
	if (query?.resolutions) {
		webViewSrc.value += `?resolutions=${query?.resolutions}`
	}
	isLoad.value = true
})
</script>

<template>
  <web-view
    v-if="isLoad"
    class="flex-[1]"
    :src="webViewSrc"
    update-title="false"
    :fullscreen="true"
    @load="onWebLoad"
    @message="onMessage"
    @on-post-message="onMessage"
  />
</template>

<style lang="scss" scoped></style>
