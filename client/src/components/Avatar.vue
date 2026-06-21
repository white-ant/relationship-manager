<template>
  <div class="avatar" :class="sizeClass" :style="bgStyle">
    <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" />
    <span v-else>{{ firstChar }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md'
  }
})

const colors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
]

const sizeClass = computed(() => `avatar-${props.size}`)

const firstChar = computed(() => {
  if (!props.name) return '?'
  return props.name.charAt(0)
})

const bgStyle = computed(() => {
  const index = props.name ? props.name.charCodeAt(0) % colors.length : 0
  return { background: colors[index] }
})

const avatarUrl = computed(() => {
  if (!props.avatar) return ''
  if (props.avatar.startsWith('http')) return props.avatar
  return props.avatar
})
</script>
