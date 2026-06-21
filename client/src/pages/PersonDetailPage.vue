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

      <div v-if="records.length === 0" class="empty-tip">
        暂无人情往来记录
      </div>

      <div v-else>
        <div
          v-for="record in records"
          :key="record.id"
          class="record-card"
          @click="openEditForm(record)"
        >
          <div class="record-header">
            <span class="record-type-tag" :class="getRecordTagClass(record)">{{ record.type_name }}</span>
            <span class="record-date">{{ formatDateShort(record.record_date) }}</span>
          </div>
          <div class="record-body">
            <template v-if="record.category === 'money'">
              <span class="record-amount" :class="record.direction === 'income' ? 'amount-income' : 'amount-expense'">
                {{ record.direction === 'income' ? '+' : '-' }}￥{{ record.amount }}
              </span>
            </template>
            <template v-else>
              <span class="record-gift-name">
                🎁 {{ record.gift_name }}
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
          <van-button size="small" :disabled="pagination.page <= 1" @click="changePage(pagination.page - 1)">上一页</van-button>
          <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <van-button size="small" :disabled="pagination.page >= pagination.totalPages" @click="changePage(pagination.page + 1)">下一页</van-button>
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

    <van-popup v-model:show="showForm" position="bottom" round :style="{ maxHeight: '90vh' }" closeable>
      <div class="form-container">
        <div class="form-title">{{ isEditing ? '编辑人情往来' : '新增人情往来' }}</div>

        <van-form @submit="handleSubmit" ref="formRef">
          <van-cell-group inset>
            <van-field
              v-model="form.type_name"
              is-link
              readonly
              required
              label="类型"
              placeholder="请选择类型"
              @click="showTypePicker = true"
              :rules="[{ required: true, message: '请选择类型' }]"
            />
            <van-field
              v-model="form.record_date"
              is-link
              readonly
              required
              label="日期"
              placeholder="请选择日期"
              @click="showDatePicker = true"
              :rules="[{ required: true, message: '请选择日期' }]"
            />

            <template v-if="formCategory === 'money'">
              <van-field
                v-model="form.amount"
                type="number"
                required
                label="金额"
                placeholder="请输入金额"
                :rules="[{ required: true, message: '请输入金额' }, { validator: validateAmount, message: '金额必须大于0' }]"
              >
                <template #left-icon>
                  <span>￥</span>
                </template>
              </van-field>
            </template>

            <template v-if="formCategory === 'gift'">
              <van-field
                v-model="form.gift_name"
                required
                label="礼物名称"
                placeholder="请输入礼物名称"
                :rules="[{ required: true, message: '请输入礼物名称' }]"
              />
              <van-field label="礼物图片">
                <template #input>
                  <div class="gift-image-upload">
                    <div v-if="form.gift_image" class="gift-image-preview">
                      <img :src="form.gift_image" class="gift-image-thumb" />
                      <span class="gift-image-remove" @click="removeGiftImage">×</span>
                    </div>
                    <van-button v-else size="small" type="primary" @click="triggerFileInput">上传图片</van-button>
                    <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleFileChange" />
                  </div>
                </template>
              </van-field>
            </template>

            <van-field
              v-model="form.remark"
              label="备注"
              type="textarea"
              placeholder="请输入备注（可选）"
              rows="2"
              autosize
            />
          </van-cell-group>

          <div class="form-footer">
            <van-button block type="primary" native-type="submit" :loading="submitting">
              {{ isEditing ? '保存修改' : '确认新增' }}
            </van-button>
          </div>
        </van-form>
      </div>
    </van-popup>

    <van-popup v-model:show="showTypePicker" position="bottom" round>
      <van-picker
        :columns="typeColumns"
        @confirm="onTypeConfirm"
        @cancel="showTypePicker = false"
        title="选择类型"
      />
    </van-popup>

    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="datePickerValue"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
        title="选择日期"
        :min-date="new Date(2000, 0, 1)"
      />
    </van-popup>
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
const submitting = ref(false)
const formRef = ref(null)
const fileInput = ref(null)

const showTypePicker = ref(false)
const showDatePicker = ref(false)

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

const formCategory = computed(() => {
  if (!form.value.type) return ''
  const moneyTypes = ['transfer', 'receive', 'lend', 'return_in', 'pay_for', 'reimburse', 'red_packet_out', 'red_packet_in']
  return moneyTypes.includes(form.value.type) ? 'money' : 'gift'
})

const datePickerValue = computed(() => {
  const d = form.value.record_date ? new Date(form.value.record_date) : new Date()
  return [String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')]
})

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

function formatDateShort(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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

function openAddForm() {
  isEditing.value = false
  editingId.value = null
  form.value = {
    type: '',
    type_name: '',
    record_date: formatDateShort(new Date().toISOString()),
    amount: '',
    gift_name: '',
    gift_image: '',
    remark: ''
  }
  showForm.value = true
}

function openEditForm(record) {
  isEditing.value = true
  editingId.value = record.id
  form.value = {
    type: record.type,
    type_name: record.type_name,
    record_date: formatDateShort(record.record_date),
    amount: record.amount ? String(record.amount) : '',
    gift_name: record.gift_name || '',
    gift_image: record.gift_image || '',
    remark: record.remark || ''
  }
  showForm.value = true
}

function onTypeConfirm({ selectedValues, selectedOptions }) {
  const value = selectedValues[selectedValues.length - 1]
  form.value.type = value
  form.value.type_name = TYPE_NAME_MAP[value] || value
  if (formCategory.value === 'money') {
    form.value.gift_name = ''
    form.value.gift_image = ''
  } else {
    form.value.amount = ''
  }
  showTypePicker.value = false
}

function onDateConfirm({ selectedValues }) {
  form.value.record_date = selectedValues.join('-')
  showDatePicker.value = false
}

function validateAmount(val) {
  return parseFloat(val) > 0
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
    showToast('上传失败')
  } finally {
    closeToast()
  }
  e.target.value = ''
}

function removeGiftImage() {
  form.value.gift_image = ''
}

async function handleSubmit() {
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('type', form.value.type)
    formData.append('record_date', form.value.record_date)
    formData.append('remark', form.value.remark || '')

    if (formCategory.value === 'money') {
      formData.append('amount', form.value.amount)
    } else {
      formData.append('gift_name', form.value.gift_name)
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
    await refreshData()
  } catch (err) {
    console.error(err)
  } finally {
    submitting.value = false
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
    await deleteRelationshipRecord(record.id)
    showToast('删除成功')
    await refreshData()
  } catch (err) {
    console.error(err)
  }
}

function changePage(page) {
  loadRecords(page)
}

async function loadRecords(page = 1) {
  try {
    const res = await getRelationshipRecords(route.params.id, page, 5)
    records.value = res.data.list
    pagination.value = res.data.pagination
  } catch (e) {
    console.error(e)
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

.stat-income .stat-value {
  color: #07c160;
}

.stat-expense .stat-value {
  color: #ee0a24;
}

.stat-net-positive .stat-value {
  color: #07c160;
}

.stat-net-negative .stat-value {
  color: #ee0a24;
}

.stat-anniv .stat-value {
  color: #ff976a;
}

.stat-gift .stat-value {
  color: #1989fa;
}

.record-card {
  background-color: var(--white);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
}

.record-card:active {
  background-color: #f5f5f5;
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

.tag-income {
  background-color: #e8f8ee;
  color: #07c160;
}

.tag-expense {
  background-color: #fef0f0;
  color: #ee0a24;
}

.tag-receive {
  background-color: #e8f3ff;
  color: #1989fa;
}

.tag-give {
  background-color: #fff7e8;
  color: #ff976a;
}

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

.amount-income {
  color: #07c160;
}

.amount-expense {
  color: #ee0a24;
}

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

.record-action-btn.edit {
  color: var(--primary-color);
}

.record-action-btn.delete {
  color: var(--danger-color);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 0;
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

.form-container {
  padding: 20px 0 30px;
}

.form-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  padding: 0 16px 16px;
  color: var(--text-color);
}

.form-footer {
  padding: 16px;
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
</style>
