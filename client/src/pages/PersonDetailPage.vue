<template>
  <div class="page-container">
    <div class="page-header">
      <div class="back-btn" @click="goBack">‹</div>
      <div class="page-title">人物详情</div>
      <div class="header-actions">
        <span class="action-btn" @click="goToEdit">编辑</span>
        <span class="action-btn danger" @click="handleDelete">删除</span>
      </div>
    </div>

    <div v-if="loading" class="empty-state">
      <div class="empty-state-text">加载中...</div>
    </div>

    <div v-else-if="!person" class="empty-state">
      <div class="empty-state-icon">😕</div>
      <div class="empty-state-text">人物不存在</div>
    </div>

    <div v-else class="page-content">
      <div class="profile-card">
        <Avatar :name="person.name" :avatar="person.avatar" size="lg" class="profile-avatar" />
        <div class="profile-name">{{ person.name }}</div>
        <div class="profile-relation">{{ person.relation }}</div>
      </div>

      <div class="info-card">
        <div class="info-item">
          <span class="info-label">🎂 生日</span>
          <span class="info-value">{{ formatDate(person.birthday) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">📞 联系方式</span>
          <span class="info-value">{{ person.contact || '未填写' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">🕐 创建时间</span>
          <span class="info-value">{{ formatDateTime(person.created_at) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">✏️ 更新时间</span>
          <span class="info-value">{{ formatDateTime(person.updated_at) }}</span>
        </div>
      </div>

      <div class="section-title">所有纪念日</div>

      <div v-if="!person.anniversaries || person.anniversaries.length === 0" class="empty-tip">
        暂无纪念日
      </div>

      <div v-else>
        <div
          v-for="anniv in person.anniversaries"
          :key="anniv.id"
          class="anniv-card"
        >
          <div class="anniv-type-tag" :class="anniv.type">
            {{ anniv.type === 'birthday' ? '🎂 生日' : '📅 纪念日' }}
          </div>
          <div class="anniv-title">{{ anniv.title }}</div>
          <div class="anniv-date">{{ formatDate(anniv.date) }}</div>
          <div class="anniv-days">距离还有 {{ getDaysUntil(anniv.date) }} 天</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast } from 'vant'
import { getPersonDetail, deletePerson } from '../api/people'
import Avatar from '../components/Avatar.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const person = ref(null)

function goBack() {
  router.back()
}

function goToEdit() {
  router.push(`/people/edit/${route.params.id}`)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getDaysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(dateStr)
  targetDate.setFullYear(today.getFullYear())
  targetDate.setHours(0, 0, 0, 0)
  if (targetDate < today) {
    targetDate.setFullYear(today.getFullYear() + 1)
  }
  const diffTime = targetDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

async function handleDelete() {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '删除后无法恢复，确定要删除该人物吗？',
      confirmButtonColor: '#ee0a24'
    })
  } catch {
    return
  }

  try {
    showLoadingToast({ message: '删除中...', forbidClick: true })
    await deletePerson(route.params.id)
    showToast('删除成功')
    setTimeout(() => {
      router.replace('/people')
    }, 500)
  } catch (err) {
    console.error(err)
  } finally {
    closeToast()
  }
}

async function loadData() {
  try {
    loading.value = true
    const res = await getPersonDetail(route.params.id)
    person.value = res.data
  } catch (e) {
    console.error(e)
    showToast('加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: var(--text-color);
  cursor: pointer;
  line-height: 1;
}

.header-actions {
  display: flex;
  gap: 16px;
}

.action-btn {
  font-size: 14px;
  color: var(--primary-color);
  cursor: pointer;
}

.action-btn.danger {
  color: var(--danger-color);
}

.profile-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  color: var(--white);
  margin-bottom: 16px;
}

.profile-avatar {
  margin: 0 auto 12px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.profile-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 4px;
}

.profile-relation {
  font-size: 14px;
  opacity: 0.9;
}

.info-card {
  background-color: var(--white);
  border-radius: 12px;
  padding: 4px 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: var(--text-color-2);
}

.info-value {
  font-size: 14px;
  color: var(--text-color);
  max-width: 60%;
  text-align: right;
  word-break: break-all;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  padding: 0 4px;
}

.empty-tip {
  text-align: center;
  color: var(--text-color-3);
  font-size: 14px;
  padding: 40px;
  background-color: var(--white);
  border-radius: 12px;
}

.anniv-card {
  background-color: var(--white);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.anniv-type-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  margin-bottom: 8px;
}

.anniv-type-tag.birthday {
  background-color: #fff0e6;
  color: #ff6034;
}

.anniv-type-tag.custom {
  background-color: #e8f3ff;
  color: #1989fa;
}

.anniv-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 6px;
}

.anniv-date {
  font-size: 13px;
  color: var(--text-color-2);
  margin-bottom: 4px;
}

.anniv-days {
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 500;
}
</style>
