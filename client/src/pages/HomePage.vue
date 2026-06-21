<template>
  <div class="page-container">
    <div class="page-header">
      <div class="date-selector">
        <select v-model="currentYear" @change="loadCalendarData" class="select-input">
          <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}年</option>
        </select>
        <select v-model="currentMonth" @change="loadCalendarData" class="select-input">
          <option v-for="month in 12" :key="month" :value="month">{{ month }}月</option>
        </select>
      </div>
      <div class="today-btn" @click="goToToday">今天</div>
    </div>

    <div class="calendar-container">
      <div class="weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      <div class="days-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="day-cell"
          :class="{
            'other-month': !day.currentMonth,
            'today': day.isToday
          }"
          @click="selectDay(day)"
        >
          <span class="day-number">{{ day.day }}</span>
          <div class="day-anniversaries" v-if="day.anniversaries && day.anniversaries.length > 0">
            <div
              v-for="(item, idx) in day.anniversaries.slice(0, 3)"
              :key="idx"
              class="mini-avatar"
              :title="item.name"
            >
              <Avatar :name="item.name" :avatar="item.avatar" size="sm" />
            </div>
            <div v-if="day.anniversaries.length > 3" class="more-indicator">
              +{{ day.anniversaries.length - 3 }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedDay && selectedDay.anniversaries && selectedDay.anniversaries.length > 0" class="day-detail">
      <div class="detail-title">
        {{ currentYear }}年{{ currentMonth }}月{{ selectedDay.day }}日 的纪念日
      </div>
      <div
        v-for="item in selectedDay.anniversaries"
        :key="item.id"
        class="detail-item"
        @click="goToPersonDetail(item.person_id)"
      >
        <Avatar :name="item.name" :avatar="item.avatar" size="md" />
        <div class="detail-info">
          <div class="detail-name">{{ item.name }}</div>
          <div class="detail-title-text">{{ item.title }}</div>
        </div>
      </div>
    </div>
    <div v-else-if="selectedDay" class="day-detail-empty">
      <div class="detail-title">
        {{ currentYear }}年{{ currentMonth }}月{{ selectedDay.day }}日
      </div>
      <div class="empty-state-text">暂无纪念日</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getCalendarAnniversaries } from '../api/anniversaries'
import Avatar from '../components/Avatar.vue'

const router = useRouter()

const now = new Date()
const currentYear = ref(now.getFullYear())
const currentMonth = ref(now.getMonth() + 1)
const selectedDay = ref(null)
const anniversariesMap = ref({})

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const yearOptions = computed(() => {
  const years = []
  const current = now.getFullYear()
  for (let i = current - 10; i <= current + 10; i++) {
    years.push(i)
  }
  return years
})

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)
  const firstDayWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const prevMonth = currentMonth.value === 1 ? 12 : currentMonth.value - 1
  const prevYear = currentMonth.value === 1 ? currentYear.value - 1 : currentYear.value
  const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate()

  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      currentMonth: false,
      date: new Date(prevYear, prevMonth - 1, prevMonthLastDay - i),
      anniversaries: []
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const today = new Date()
    const isToday = today.getFullYear() === currentYear.value &&
      today.getMonth() + 1 === currentMonth.value &&
      today.getDate() === i
    days.push({
      day: i,
      currentMonth: true,
      isToday,
      date: new Date(currentYear.value, currentMonth.value - 1, i),
      anniversaries: anniversariesMap.value[i] || []
    })
  }

  const remainingDays = 42 - days.length
  const nextMonth = currentMonth.value === 12 ? 1 : currentMonth.value + 1
  const nextYear = currentMonth.value === 12 ? currentYear.value + 1 : currentYear.value
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      currentMonth: false,
      date: new Date(nextYear, nextMonth - 1, i),
      anniversaries: []
    })
  }

  return days
})

async function loadCalendarData() {
  try {
    const res = await getCalendarAnniversaries(currentYear.value, currentMonth.value)
    anniversariesMap.value = res.data || {}
  } catch (e) {
    console.error(e)
  }
}

function goToToday() {
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth() + 1
  const todayDay = calendarDays.value.find(d => d.isToday)
  if (todayDay) {
    selectedDay.value = todayDay
  }
  loadCalendarData()
}

function selectDay(day) {
  if (day.currentMonth) {
    selectedDay.value = day
  } else {
    const targetDate = day.date
    currentYear.value = targetDate.getFullYear()
    currentMonth.value = targetDate.getMonth() + 1
    loadCalendarData()
  }
}

function goToPersonDetail(personId) {
  router.push(`/people/${personId}`)
}

onMounted(() => {
  goToToday()
})
</script>

<style scoped>
.date-selector {
  display: flex;
  gap: 8px;
  align-items: center;
}

.select-input {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--white);
  font-size: 14px;
  color: var(--text-color);
  outline: none;
}

.today-btn {
  padding: 6px 14px;
  background-color: var(--primary-color);
  color: var(--white);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.today-btn:active {
  opacity: 0.85;
}

.calendar-container {
  background-color: var(--white);
  margin: 16px;
  border-radius: 12px;
  padding: 12px;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday {
  text-align: center;
  font-size: 13px;
  color: var(--text-color-2);
  padding: 8px 0;
  font-weight: 500;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 6px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
}

.day-cell:active {
  background-color: var(--background-color);
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.today .day-number {
  background-color: var(--primary-color);
  color: var(--white);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.day-number {
  font-size: 14px;
  line-height: 1.4;
}

.day-anniversaries {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  margin-top: 4px;
  flex-wrap: wrap;
  max-width: 100%;
}

.mini-avatar {
  width: 16px;
  height: 16px;
}

.more-indicator {
  font-size: 10px;
  color: var(--text-color-3);
}

.day-detail {
  margin: 0 16px 16px;
  background-color: var(--white);
  border-radius: 12px;
  padding: 16px;
}

.day-detail-empty {
  margin: 0 16px 16px;
  background-color: var(--white);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
}

.detail-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-color);
}

.detail-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-info {
  margin-left: 12px;
  flex: 1;
}

.detail-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 2px;
}

.detail-title-text {
  font-size: 13px;
  color: var(--text-color-2);
}

.empty-state-text {
  color: var(--text-color-3);
  font-size: 14px;
  padding: 20px 0;
}
</style>
