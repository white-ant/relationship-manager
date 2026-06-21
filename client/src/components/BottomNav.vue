<template>
  <div class="bottom-nav">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <span class="nav-icon">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/', label: '首页', icon: '📅' },
  { path: '/people', label: '人物', icon: '👥' },
  { path: '/anniversaries', label: '纪念', icon: '🎂' }
]

function isActive(path) {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ffffff;
  display: flex;
  border-top: 1px solid var(--border-color);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--text-color-3);
  transition: color 0.2s;
}

.nav-item.active {
  color: var(--primary-color);
}

.nav-icon {
  font-size: 22px;
  line-height: 1;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 11px;
  line-height: 1;
}
</style>
