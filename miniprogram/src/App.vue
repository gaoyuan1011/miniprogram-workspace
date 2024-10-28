<script setup lang="ts">
import { onHide, onLaunch, onShow, onUnload } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')
})
onShow(() => {
  console.log('App Show')
})
onHide(() => {
  console.log('App Hide')
})
onUnload(() => {
  console.log('App Unload')
})
</script>

<style lang="scss">

</style>
