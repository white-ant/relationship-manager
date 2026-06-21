<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">人物</div>
      <div class="header-action" @click="goToAdd">
        <span class="add-icon">+</span>
      </div>
    </div>

    <div v-if="loading" class="empty-state">
      <div class="empty-state-text">加载中...</div>
    </div>

    <div v-else-if="peopleList.length === 0" class="empty-state">
      <div class="empty-state-icon">👥</div>
      <div class="empty-state-text">还没有添加人物</div>
      <div class="empty-state-tip">点击右下角按钮添加第一个人物</div>
    </div>

    <div v-else class="page-content">
      <div
        v-for="person in peopleList"
        :key="person.id"
        class="person-card"
        @click="goToDetail(person.id)"
      >
        <Avatar :name="person.name" :avatar="person.avatar" size="lg" />
        <div class="person-info">
          <div class="person-name">{{ person.name }}</div>
          <div class="person-meta">
            <span class="relation-tag">{{ person.relation }}</span>
          </div>
          <div class="person-birthday">
            🎂 {{ formatBirthday(person.birthday) }}
          </div>
          <div v-if="person.contact" class="person-contact">
            📞 {{ person.contact }}
          </div>
        </div>
        <div class="arrow">›</div>
      </div>
    </div>

    <button class="fab" @click="goToAdd">+</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPeopleList } from '../api/people'
import Avatar from '../components/Avatar.vue'

const router = useRouter()
const peopleList = ref([])
const loading = ref(true)

function formatBirthday(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

async function loadData() {
  try {
    loading.value = true
    const res = await getPeopleList()
    peopleList.value = res.data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function goToAdd() {
  router.push('/people/add')
}

function goToDetail(id) {
  router.push(`/people/${id}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.header-action {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: var(--background-color);
  cursor: pointer;
}

.add-icon {
  font-size: 24px;
  color: var(--primary-color);
  line-height: 1;
}

.header-action:active {
  opacity: 0.7;
}

.empty-state-tip {
  font-size: 13px;
  color: var(--text-color-3);
  margin-top: 8px;
}

.person-card {
  display: flex;
  align-items: center;
  background-color: var(--white);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
}

.person-card:active {
  background-color: #f5f5f5;
}

.person-info {
  flex: 1;
  margin-left: 14px;
  overflow: hidden;
}

.person-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 6px;
}

.person-meta {
  margin-bottom: 6px;
}

.relation-tag {
  display: inline-block;
  padding: 2px 10px;
  background-color: var(--primary-color);
  color: var(--white);
  border-radius: 12px;
  font-size: 12px;
}

.person-birthday {
  font-size: 13px;
  color: var(--text-color-2);
  margin-bottom: 4px;
}

.person-contact {
  font-size: 13px;
  color: var(--text-color-2);
}

.arrow {
  font-size: 24px;
  color: var(--text-color-3);
  margin-left: 8px;
}
</style>
