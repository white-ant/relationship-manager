<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">纪念</div>
    </div>

    <div v-if="loading" class="empty-state">
      <div class="empty-state-text">加载中...</div>
    </div>

    <div v-else-if="anniversaryList.length === 0" class="empty-state">
      <div class="empty-state-icon">🎂</div>
      <div class="empty-state-text">暂无纪念日</div>
      <div class="empty-state-tip">去人物页面添加亲友吧</div>
    </div>

    <div v-else class="page-content">
      <div
        v-for="item in anniversaryList"
        :key="item.id"
        class="anniversary-item"
        @click="goToPersonDetail(item.person_id)"
      >
        <div class="item-left">
          <Avatar :name="item.name" :avatar="item.avatar" size="lg" />
          <div class="person-info">
            <div class="person-name">{{ item.name }}</div>
            <div class="person-birthday">🎂 {{ formatBirthday(item.birthday) }}</div>
          </div>
        </div>
        <div class="item-right">
          <div class="days-badge" :class="{ today: item.daysUntil === 0 }">
            {{ item.daysUntil === 0 ? '今天' : `${item.daysUntil}天` }}
          </div>
          <div class="anniv-title">{{ item.title }}</div>
          <div class="anniv-date">{{ formatDate(item.date) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUpcomingAnniversaries } from '../api/anniversaries'
import Avatar from '../components/Avatar.vue'

const router = useRouter()
const loading = ref(true)
const anniversaryList = ref([])

function formatBirthday(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

async function loadData() {
  try {
    loading.value = true
    const res = await getUpcomingAnniversaries()
    anniversaryList.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function goToPersonDetail(personId) {
  router.push(`/people/${personId}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.empty-state-tip {
  font-size: 13px;
  color: var(--text-color-3);
  margin-top: 8px;
}

.anniversary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--white);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
}

.anniversary-item:active {
  background-color: #f5f5f5;
}

.item-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.person-info {
  margin-left: 12px;
  overflow: hidden;
}

.person-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.person-birthday {
  font-size: 13px;
  color: var(--text-color-2);
}

.item-right {
  text-align: right;
  margin-left: 12px;
  flex-shrink: 0;
}

.days-badge {
  display: inline-block;
  padding: 4px 12px;
  background-color: #e8f3ff;
  color: var(--primary-color);
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.days-badge.today {
  background-color: #fff0e6;
  color: #ff6034;
}

.anniv-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.anniv-date {
  font-size: 12px;
  color: var(--text-color-3);
}
</style>
