<template>
  <router-view />
  <BottomNav v-if="showBottomNav" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'

const route = useRoute()
const showBottomNav = computed(() => route.meta?.showNav !== false)
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
