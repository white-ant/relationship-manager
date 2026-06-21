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

      <div class="section-title">分析数据</div>
      <div class="stats-grid">
        <div class="stat-item stat-gift">
          <div class="stat-icon">🎁</div>
          <div class="stat-value">{{ statistics.gift_count }}</div>
          <div class="stat-label">礼物往来(次)</div>
        </div>
        <div class="stat-item stat-income">
          <div class="stat-icon">💰</div>
          <div class="stat-value">￥{{ statistics.money_income }}</div>
          <div class="stat-label">收入</div>
        </div>
        <div class="stat-item stat-expense">
          <div class="stat-icon">💸</div>
          <div class="stat-value">￥{{ statistics.money_expense }}</div>
          <div class="stat-label">支出</div>
        </div>
        <div class="stat-item" :class="parseFloat(statistics.money_net) >= 0 ? 'stat-net-positive' : 'stat-net-negative'">
          <div class="stat-icon">📊</div>
          <div class="stat-value">{{ parseFloat(statistics.money_net) >= 0 ? '+' : '' }}￥{{ statistics.money_net }}</div>
          <div class="stat-label">净额</div>
        </div>
        <div class="stat-item stat-anniv">
          <div class="stat-icon">📅</div>
          <div class="stat-value">{{ statistics.anniversary_count }}</div>
          <div class="stat-label">纪念日(个)</div>
        </div>
      </div>

      <div class="section-header">
        <div class="section-title">人情往来</div>
        <div class="add-record-btn" @click="openAddForm">+ 新增</div>
      </div>

      <div v-if="recordsLoading" class="empty-tip">加载中...</div>
      <div v-else-if="records.length === 0" class="empty-tip">
        暂无人情往来记录
      </div>

      <div v-else>
        <div
          v-for="record in records"
          :key="record.id"
          class="record-card"
        >
          <div class="record-header">
            <span class="record-type-tag" :class="getRecordTagClass(record)">{{ record.type_name }}</span>
            <span class="record-date">{{ formatDateForDisplay(record.record_date) }}</span>
          </div>
          <div class="record-body">
            <template v-if="record.category === 'money'">
              <span class="record-amount" :class="record.direction === 'income' ? 'amount-income' : 'amount-expense'">
                {{ record.direction === 'income' ? '+' : '-' }}￥{{ record.amount }}
              </span>
            </template>
            <template v-else>
              <span class="record-gift-name">
                🎁 {{ record.gift_name || '(无名称)' }}
              </span>
              <img v-if="record.gift_image" :src="record.gift_image" class="record-gift-thumb" @click.stop="previewImage(record.gift_image)" />
            </template>
          </div>
          <div v-if="record.remark" class="record-remark">{{ record.remark }}</div>
          <div class="record-actions">
            <span class="record-action-btn edit" @click.stop="openEditForm(record)">编辑</span>
            <span class="record-action-btn delete" @click.stop="handleDeleteRecord(record)">删除</span>
          </div>
        </div>

        <div v-if="pagination.totalPages > 1" class="pagination">
          <button class="page-btn" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">上一页</button>
          <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button class="page-btn" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">下一页</button>
        </div>
      </div>

      <div class="section-title" style="margin-top: 24px;">所有纪念日</div>

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

    <div v-if="showForm" class="form-mask" @click.self="closeForm">
      <div class="form-sheet">
        <div class="form-sheet-header">
          <span class="form-sheet-cancel" @click="closeForm">取消</span>
          <span class="form-sheet-title">{{ isEditing ? '编辑人情往来' : '新增人情往来' }}</span>
          <span class="form-sheet-confirm" @click="handleSubmit">确定</span>
        </div>

        <div class="form-sheet-body">
          <div class="form-item-wrap">
            <label class="form-item-label"><span class="required">*</span> 类型</label>
            <div class="form-item-value picker-value" @click="onTypeOpen">
              {{ form.type_name || '请选择类型' }}
              <span class="picker-arrow">›</span>
            </div>
          </div>

          <div class="form-item-wrap">
            <label class="form-item-label"><span class="required">*</span> 日期</label>
            <div class="form-item-value picker-value" @click="onDateOpen">
              {{ form.record_date || '请选择日期' }}
              <span class="picker-arrow">›</span>
            </div>
          </div>

          <div v-if="formCategory === 'money'" class="form-item-wrap">
            <label class="form-item-label"><span class="required">*</span> 金额</label>
            <div class="form-item-value">
              <span class="amount-prefix">￥</span>
              <input
                type="number"
                class="form-input-inline"
                v-model="form.amount"
                placeholder="请输入金额"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div v-if="formCategory === 'gift'" class="form-item-wrap">
            <label class="form-item-label"><span class="required">*</span> 礼物名称</label>
            <div class="form-item-value">
              <input
                type="text"
                class="form-input-inline"
                v-model="form.gift_name"
                placeholder="请输入礼物名称"
                maxlength="50"
              />
            </div>
          </div>

          <div v-if="formCategory === 'gift'" class="form-item-wrap">
            <label class="form-item-label">礼物图片</label>
            <div class="form-item-value">
              <div class="gift-image-upload">
                <div v-if="form.gift_image" class="gift-image-preview">
                  <img :src="form.gift_image" class="gift-image-thumb" />
                  <span class="gift-image-remove" @click="removeGiftImage">×</span>
                </div>
                <button v-else type="button" class="upload-btn" @click="triggerFileInput">上传图片</button>
                <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileChange" />
              </div>
            </div>
          </div>

          <div class="form-item-wrap">
            <label class="form-item-label">备注</label>
            <div class="form-item-value">
              <textarea
                class="form-textarea"
                v-model="form.remark"
                placeholder="请输入备注（可选）"
                rows="2"
                maxlength="500"
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showTypePicker" class="form-mask" @click.self="showTypePicker = false">
      <div class="picker-sheet">
        <div class="picker-header">
          <span class="picker-cancel" @click="showTypePicker = false">取消</span>
          <span class="picker-title">选择类型</span>
          <span class="picker-confirm" @click="confirmTypePicker">确定</span>
        </div>
        <div class="picker-body">
          <div class="picker-columns">
            <div class="picker-column">
              <div
                v-for="(group, gi) in typeColumns"
                :key="gi"
                class="picker-option"
                :class="{ active: tempTypeGroup === gi }"
                @click="tempTypeGroup = gi; tempTypeValue = group.children[0]?.value"
              >
                {{ group.text }}
              </div>
            </div>
            <div class="picker-column">
              <div
                v-for="opt in typeColumns[tempTypeGroup]?.children"
                :key="opt.value"
                class="picker-option"
                :class="{ active: tempTypeValue === opt.value }"
                @click="tempTypeValue = opt.value"
              >
                {{ opt.text }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDatePicker" class="form-mask" @click.self="showDatePicker = false">
      <div class="picker-sheet">
        <div class="picker-header">
          <span class="picker-cancel" @click="showDatePicker = false">取消</span>
          <span class="picker-title">选择日期</span>
          <span class="picker-confirm" @click="confirmDatePicker">确定</span>
        </div>
        <div class="picker-body">
          <div class="date-picker-wrap">
            <input
              type="date"
              ref="nativeDateInput"
              class="native-date-input"
              :value="form.record_date"
              @change="onNativeDateChange"
              style="display:none"
            />
            <div class="date-selectors">
              <select class="date-select" v-model="tempDateYear">
                <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}年</option>
              </select>
              <select class="date-select" v-model="tempDateMonth">
                <option v-for="m in 12" :key="m" :value="String(m).padStart(2,'0')">{{ m }}月</option>
              </select>
              <select class="date-select" v-model="tempDateDay">
                <option v-for="d in daysInMonth" :key="d" :value="String(d).padStart(2,'0')">{{ d }}日</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showConfirmDialog, showLoadingToast, closeToast, showImagePreview } from 'vant'
import { getPersonDetail, deletePerson } from '../api/people'
import {
  getRelationshipRecords,
  addRelationshipRecord,
  updateRelationshipRecord,
  deleteRelationshipRecord,
  getPersonStatistics,
  uploadFile
} from '../api/relationshipRecords'
import Avatar from '../components/Avatar.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const recordsLoading = ref(false)
const person = ref(null)
const statistics = ref({
  gift_count: 0,
  money_income: '0.00',
  money_expense: '0.00',
  money_net: '0.00',
  anniversary_count: 0
})
const records = ref([])
const pagination = ref({ page: 1, pageSize: 5, total: 0, totalPages: 0 })

const showForm = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const fileInput = ref(null)
const nativeDateInput = ref(null)

const showTypePicker = ref(false)
const showDatePicker = ref(false)
const tempTypeGroup = ref(0)
const tempTypeValue = ref('')
const tempDateYear = ref('')
const tempDateMonth = ref('')
const tempDateDay = ref('')

const form = ref({
  type: '',
  type_name: '',
  record_date: '',
  amount: '',
  gift_name: '',
  gift_image: '',
  remark: ''
})

const typeColumns = [
  {
    text: '资金往来',
    children: [
      { text: '转账', value: 'transfer' },
      { text: '收款', value: 'receive' },
      { text: '借出', value: 'lend' },
      { text: '还入', value: 'return_in' },
      { text: '代付', value: 'pay_for' },
      { text: '报销', value: 'reimburse' },
      { text: '红包支出', value: 'red_packet_out' },
      { text: '红包收入', value: 'red_packet_in' }
    ]
  },
  {
    text: '礼物/人情往来',
    children: [
      { text: '收礼', value: 'gift_in' },
      { text: '送礼', value: 'gift_out' },
      { text: '请客', value: 'treat' },
      { text: '被请客', value: 'treated' },
      { text: '帮忙', value: 'help' },
      { text: '被帮忙', value: 'helped' }
    ]
  }
]

const TYPE_NAME_MAP = {}
typeColumns.forEach(group => {
  group.children.forEach(item => {
    TYPE_NAME_MAP[item.value] = item.text
  })
})

const TYPE_GROUP_MAP = {}
typeColumns.forEach((group, gi) => {
  group.children.forEach(item => {
    TYPE_GROUP_MAP[item.value] = gi
  })
})

const formCategory = computed(() => {
  if (!form.value.type) return ''
  const moneyTypes = ['transfer', 'receive', 'lend', 'return_in', 'pay_for', 'reimburse', 'red_packet_out', 'red_packet_in']
  return moneyTypes.includes(form.value.type) ? 'money' : 'gift'
})

const currentYear = new Date().getFullYear()
const yearOptions = computed(() => {
  const arr = []
  for (let y = currentYear; y >= 2000; y--) arr.push(y)
  return arr
})

const daysInMonth = computed(() => {
  const y = parseInt(tempDateYear.value) || currentYear
  const m = parseInt(tempDateMonth.value) || 1
  return new Date(y, m, 0).getDate()
})

function formatDateForInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10)
  }
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDateForDisplay(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10)
  }
  return formatDateForInput(value)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return String(dateStr).slice(0, 10)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return String(dateStr).slice(0, 10)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getDaysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(dateStr)
  if (Number.isNaN(targetDate.getTime())) return 0
  targetDate.setFullYear(today.getFullYear())
  targetDate.setHours(0, 0, 0, 0)
  if (targetDate < today) {
    targetDate.setFullYear(today.getFullYear() + 1)
  }
  const diffTime = targetDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getRecordTagClass(record) {
  if (record.category === 'money') {
    return record.direction === 'income' ? 'tag-income' : 'tag-expense'
  }
  if (['gift_in', 'treated', 'helped'].includes(record.type)) {
    return 'tag-receive'
  }
  return 'tag-give'
}

function previewImage(url) {
  showImagePreview([url])
}

function goBack() {
  router.back()
}

function goToEdit() {
  router.push(`/people/edit/${route.params.id}`)
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
    const msg = err?.message || '删除失败'
    showToast(msg)
  } finally {
    closeToast()
  }
}

function resetForm() {
  form.value = {
    type: '',
    type_name: '',
    record_date: '',
    amount: '',
    gift_name: '',
    gift_image: '',
    remark: ''
  }
}

function openAddForm() {
  isEditing.value = false
  editingId.value = null
  resetForm()
  form.value.record_date = formatDateForInput(new Date())
  showForm.value = true
}

function openEditForm(record) {
  isEditing.value = true
  editingId.value = record.id
  resetForm()
  form.value = {
    type: record.type,
    type_name: record.type_name,
    record_date: formatDateForInput(record.record_date),
    amount: record.amount ? String(record.amount) : '',
    gift_name: record.gift_name || '',
    gift_image: record.gift_image || '',
    remark: record.remark || ''
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  resetForm()
}

function onTypeOpen() {
  if (form.value.type) {
    tempTypeGroup.value = TYPE_GROUP_MAP[form.value.type] ?? 0
    tempTypeValue.value = form.value.type
  } else {
    tempTypeGroup.value = 0
    tempTypeValue.value = typeColumns[0].children[0].value
  }
  showTypePicker.value = true
}

function confirmTypePicker() {
  if (!tempTypeValue.value) {
    showToast('请选择类型')
    return
  }
  form.value.type = tempTypeValue.value
  form.value.type_name = TYPE_NAME_MAP[tempTypeValue.value] || tempTypeValue.value
  if (formCategory.value === 'money') {
    form.value.gift_name = ''
    form.value.gift_image = ''
  } else {
    form.value.amount = ''
  }
  showTypePicker.value = false
}

function onDateOpen() {
  const dateStr = form.value.record_date || formatDateForInput(new Date())
  const parts = dateStr.split('-')
  tempDateYear.value = parts[0] || String(currentYear)
  tempDateMonth.value = parts[1] || '01'
  tempDateDay.value = parts[2] || '01'
  showDatePicker.value = true
}

function confirmDatePicker() {
  const y = tempDateYear.value
  const m = tempDateMonth.value
  let d = tempDateDay.value
  const maxDay = new Date(parseInt(y), parseInt(m), 0).getDate()
  if (parseInt(d) > maxDay) d = String(maxDay).padStart(2, '0')
  form.value.record_date = `${y}-${m}-${d}`
  showDatePicker.value = false
}

function onNativeDateChange(e) {
  form.value.record_date = e.target.value
}

function validateRecordForm() {
  if (!form.value.type) {
    showToast('请选择人情往来类型')
    return false
  }
  if (!form.value.record_date) {
    showToast('请选择日期')
    return false
  }
  if (formCategory.value === 'money') {
    if (!form.value.amount || form.value.amount === '') {
      showToast('请输入金额')
      return false
    }
    const amt = parseFloat(form.value.amount)
    if (Number.isNaN(amt) || amt <= 0) {
      showToast('金额必须大于0')
      return false
    }
  }
  if (formCategory.value === 'gift') {
    if (!form.value.gift_name || !form.value.gift_name.trim()) {
      showToast('请输入礼物名称')
      return false
    }
  }
  return true
}

function triggerFileInput() {
  fileInput.value && fileInput.value.click()
}

async function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    showLoadingToast({ message: '上传中...', forbidClick: true })
    const formData = new FormData()
    formData.append('file', file)
    const res = await uploadFile(formData)
    form.value.gift_image = res.data.url
    showToast('上传成功')
  } catch (err) {
    console.error(err)
    const msg = err?.message || '上传失败'
    showToast(msg)
  } finally {
    closeToast()
  }
  e.target.value = ''
}

function removeGiftImage() {
  form.value.gift_image = ''
}

async function handleSubmit() {
  if (!validateRecordForm()) return

  try {
    showLoadingToast({ message: '保存中...', forbidClick: true })

    const formData = new FormData()
    formData.append('type', form.value.type)
    formData.append('record_date', form.value.record_date)
    formData.append('remark', form.value.remark || '')

    if (formCategory.value === 'money') {
      formData.append('amount', String(parseFloat(form.value.amount).toFixed(2)))
    } else {
      formData.append('gift_name', form.value.gift_name.trim())
      if (form.value.gift_image && !form.value.gift_image.startsWith('data:')) {
        formData.append('gift_image', form.value.gift_image)
      }
    }

    if (isEditing.value) {
      await updateRelationshipRecord(editingId.value, formData)
      showToast('修改成功')
    } else {
      await addRelationshipRecord(route.params.id, formData)
      showToast('新增成功')
    }

    showForm.value = false
    resetForm()
    await refreshData()
  } catch (err) {
    console.error(err)
    const msg = err?.message || '保存失败，请重试'
    showToast(msg)
  } finally {
    closeToast()
  }
}

async function handleDeleteRecord(record) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除该${record.category === 'money' ? '资金' : '礼物'}往来记录吗？`,
      confirmButtonColor: '#ee0a24'
    })
  } catch {
    return
  }
  try {
    showLoadingToast({ message: '删除中...', forbidClick: true })
    await deleteRelationshipRecord(record.id)
    closeToast()
    showToast('删除成功')
    await refreshData()
  } catch (err) {
    closeToast()
    console.error(err)
    const msg = err?.message || '删除失败'
    showToast(msg)
  }
}

function changePage(page) {
  loadRecords(page)
}

async function loadRecords(page = 1) {
  try {
    recordsLoading.value = true
    const res = await getRelationshipRecords(route.params.id, page, 5)
    records.value = res.data.list
    pagination.value = res.data.pagination
  } catch (e) {
    console.error(e)
    const msg = e?.message || '加载人情往来记录失败'
    showToast(msg)
  } finally {
    recordsLoading.value = false
  }
}

async function loadStatistics() {
  try {
    const res = await getPersonStatistics(route.params.id)
    statistics.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function refreshData() {
  await Promise.all([loadRecords(pagination.value.page), loadStatistics()])
}

async function loadData() {
  try {
    loading.value = true
    const res = await getPersonDetail(route.params.id)
    person.value = res.data
    await Promise.all([loadRecords(1), loadStatistics()])
  } catch (e) {
    console.error(e)
    const msg = e?.message || '加载失败'
    showToast(msg)
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  padding: 0 4px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.add-record-btn {
  font-size: 14px;
  color: var(--primary-color);
  cursor: pointer;
  font-weight: 500;
}

.empty-tip {
  text-align: center;
  color: var(--text-color-3);
  font-size: 14px;
  padding: 40px;
  background-color: var(--white);
  border-radius: 12px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.stat-item {
  background-color: var(--white);
  border-radius: 12px;
  padding: 14px 10px;
  text-align: center;
}

.stat-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 2px;
  word-break: break-all;
}

.stat-label {
  font-size: 11px;
  color: var(--text-color-3);
}

.stat-income .stat-value { color: #07c160; }
.stat-expense .stat-value { color: #ee0a24; }
.stat-net-positive .stat-value { color: #07c160; }
.stat-net-negative .stat-value { color: #ee0a24; }
.stat-anniv .stat-value { color: #ff976a; }
.stat-gift .stat-value { color: #1989fa; }

.record-card {
  background-color: var(--white);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
}

.record-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.record-type-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.tag-income { background-color: #e8f8ee; color: #07c160; }
.tag-expense { background-color: #fef0f0; color: #ee0a24; }
.tag-receive { background-color: #e8f3ff; color: #1989fa; }
.tag-give { background-color: #fff7e8; color: #ff976a; }

.record-date {
  font-size: 12px;
  color: var(--text-color-3);
}

.record-body {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.record-amount {
  font-size: 18px;
  font-weight: 600;
}

.amount-income { color: #07c160; }
.amount-expense { color: #ee0a24; }

.record-gift-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-color);
}

.record-gift-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
}

.record-remark {
  font-size: 13px;
  color: var(--text-color-3);
  margin-top: 4px;
}

.record-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.record-action-btn {
  font-size: 13px;
  cursor: pointer;
}

.record-action-btn.edit { color: var(--primary-color); }
.record-action-btn.delete { color: var(--danger-color); }

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
}

.page-btn {
  padding: 6px 14px;
  background-color: var(--white);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-color);
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: var(--text-color-2);
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

.anniv-type-tag.birthday { background-color: #fff0e6; color: #ff6034; }
.anniv-type-tag.custom { background-color: #e8f3ff; color: #1989fa; }

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

.form-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.form-sheet {
  background-color: var(--background-color);
  border-radius: 16px 16px 0 0;
  max-height: 85vh;
  overflow-y: auto;
}

.form-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--white);
  border-radius: 16px 16px 0 0;
}

.form-sheet-cancel {
  font-size: 15px;
  color: var(--text-color-3);
  cursor: pointer;
}

.form-sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.form-sheet-confirm {
  font-size: 15px;
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
}

.form-sheet-body {
  padding: 8px 0 24px;
}

.form-item-wrap {
  background-color: var(--white);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.form-item-label {
  display: block;
  font-size: 14px;
  color: var(--text-color-2);
  margin-bottom: 6px;
}

.required {
  color: var(--danger-color);
  margin-right: 2px;
}

.form-item-value {
  display: flex;
  align-items: center;
  font-size: 15px;
  color: var(--text-color);
  min-height: 28px;
}

.picker-value {
  cursor: pointer;
  justify-content: space-between;
}

.picker-arrow {
  color: var(--text-color-3);
  font-size: 18px;
  transform: rotate(90deg);
}

.form-input-inline {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--text-color);
  background: transparent;
  padding: 0;
}

.amount-prefix {
  color: var(--text-color);
  margin-right: 4px;
  font-size: 15px;
}

.form-textarea {
  width: 100%;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--text-color);
  background: transparent;
  resize: none;
  padding: 0;
  font-family: inherit;
}

.gift-image-upload {
  display: flex;
  align-items: center;
}

.gift-image-preview {
  position: relative;
  display: inline-block;
}

.gift-image-thumb {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.gift-image-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  background: var(--danger-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
}

.upload-btn {
  padding: 6px 14px;
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
}

.picker-sheet {
  background-color: var(--white);
  border-radius: 16px 16px 0 0;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-color);
}

.picker-cancel {
  font-size: 15px;
  color: var(--text-color-3);
  cursor: pointer;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.picker-confirm {
  font-size: 15px;
  color: var(--primary-color);
  font-weight: 500;
  cursor: pointer;
}

.picker-body {
  padding: 8px 0 24px;
  max-height: 50vh;
  overflow-y: auto;
}

.picker-columns {
  display: flex;
}

.picker-column {
  flex: 1;
  max-height: 300px;
  overflow-y: auto;
  border-right: 1px solid var(--border-color);
}

.picker-column:last-child {
  border-right: none;
}

.picker-option {
  padding: 12px 16px;
  font-size: 15px;
  color: var(--text-color-2);
  text-align: center;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
}

.picker-option.active {
  color: var(--primary-color);
  background-color: #e8f3ff;
  font-weight: 500;
}

.date-picker-wrap {
  padding: 16px;
}

.date-selectors {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.date-select {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 15px;
  background-color: var(--white);
  color: var(--text-color);
  outline: none;
}
</style>
