<template>
  <div class="page-container">
    <div class="page-header">
      <div class="back-btn" @click="goBack">‹</div>
      <div class="page-title">添加人物</div>
      <div class="save-btn" @click="handleSave">保存</div>
    </div>

    <div class="form-container">
      <div class="avatar-section">
        <div class="avatar-preview" @click="triggerUpload">
          <Avatar v-if="!form.avatar" :name="form.name || '?' " size="lg" />
          <img v-else :src="form.avatar" alt="avatar" class="avatar-img" />
          <div class="avatar-hint">点击更换头像</div>
        </div>
        <input type="file" ref="fileInput" accept="image/*" @change="handleFileChange" style="display:none" />
      </div>

      <div class="form-section">
        <div class="form-item">
          <label class="form-label"><span class="required">*</span> 姓名</label>
          <input
            type="text"
            v-model="form.name"
            class="form-input"
            placeholder="请输入姓名"
            maxlength="20"
          />
        </div>

        <div class="form-item">
          <label class="form-label"><span class="required">*</span> 关系</label>
          <select v-model="form.relation" class="form-input">
            <option value="">请选择关系</option>
            <option v-for="rel in relationOptions" :key="rel" :value="rel">{{ rel }}</option>
          </select>
        </div>

        <div class="form-item">
          <label class="form-label"><span class="required">*</span> 生日</label>
          <input
            type="date"
            v-model="form.birthday"
            class="form-input"
          />
        </div>

        <div class="form-item">
          <label class="form-label">联系方式</label>
          <input
            type="text"
            v-model="form.contact"
            class="form-input"
            placeholder="请输入联系方式（选填）"
            maxlength="50"
          />
        </div>
      </div>

      <div class="section-title">
        <span>其他纪念日</span>
        <button class="add-anniv-btn" @click="addAnniversary">
          <span class="plus">+</span> 添加
        </button>
      </div>

      <div v-if="form.anniversaries.length === 0" class="empty-tip">
        暂无其他纪念日，点击上方按钮添加
      </div>

      <div v-for="(item, index) in form.anniversaries" :key="index" class="anniversary-item">
        <div class="anniv-header">
          <span class="anniv-index">纪念日 {{ index + 1 }}</span>
          <span class="anniv-delete" @click="removeAnniversary(index)">删除</span>
        </div>
        <div class="form-item">
          <label class="form-label"><span class="required">*</span> 纪念日名称</label>
          <input
            type="text"
            v-model="item.title"
            class="form-input"
            placeholder="例如：结婚纪念日"
            maxlength="30"
          />
        </div>
        <div class="form-item">
          <label class="form-label"><span class="required">*</span> 纪念日日期</label>
          <input
            type="date"
            v-model="item.date"
            class="form-input"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showLoadingToast, closeToast } from 'vant'
import { addPerson, uploadAvatar } from '../api/people'
import Avatar from '../components/Avatar.vue'

const router = useRouter()
const fileInput = ref(null)

const relationOptions = ['家人', '亲戚', '朋友', '同学', '同事', '邻居']

const form = ref({
  name: '',
  avatar: '',
  birthday: '',
  relation: '',
  contact: '',
  anniversaries: []
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

function goBack() {
  router.back()
}

function triggerUpload() {
  fileInput.value?.click()
}

async function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    showToast('图片大小不能超过5MB')
    return
  }

  try {
    showLoadingToast({ message: '上传中...', forbidClick: true })
    const formData = new FormData()
    formData.append('avatar', file)
    const res = await uploadAvatar(formData)
    form.value.avatar = res.data.url
    showToast('上传成功')
  } catch (err) {
    console.error(err)
    showToast('上传失败')
  } finally {
    closeToast()
    e.target.value = ''
  }
}

function addAnniversary() {
  form.value.anniversaries.push({
    title: '',
    date: ''
  })
}

function removeAnniversary(index) {
  form.value.anniversaries.splice(index, 1)
}

function validateForm() {
  if (!form.value.name.trim()) {
    showToast('请输入姓名')
    return false
  }
  if (!form.value.relation) {
    showToast('请选择关系')
    return false
  }
  if (!form.value.birthday) {
    showToast('请选择生日')
    return false
  }
  for (let i = 0; i < form.value.anniversaries.length; i++) {
    const item = form.value.anniversaries[i]
    if (!item.title.trim()) {
      showToast(`请输入纪念日 ${i + 1} 的名称`)
      return false
    }
    if (!item.date) {
      showToast(`请选择纪念日 ${i + 1} 的日期`)
      return false
    }
  }
  return true
}

async function handleSave() {
  if (!validateForm()) return

  try {
    showLoadingToast({ message: '保存中...', forbidClick: true })
    await addPerson(form.value)
    showToast('添加成功')
    setTimeout(() => {
      router.replace('/people')
    }, 500)
  } catch (err) {
    console.error(err)
    const msg = err?.message || '保存失败，请重试'
    showToast(msg)
  } finally {
    closeToast()
  }
}
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

.save-btn {
  padding: 6px 16px;
  background-color: var(--primary-color);
  color: var(--white);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.save-btn:active {
  opacity: 0.85;
}

.form-container {
  padding: 16px;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.avatar-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-hint {
  font-size: 12px;
  color: var(--text-color-3);
  margin-top: 8px;
}

.form-section {
  background-color: var(--white);
  border-radius: 12px;
  padding: 4px 16px;
  margin-bottom: 24px;
}

.form-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.form-item:last-child {
  border-bottom: none;
}

.form-label {
  display: block;
  font-size: 14px;
  color: var(--text-color-2);
  margin-bottom: 6px;
}

.required {
  color: var(--danger-color);
  margin-right: 2px;
}

.form-input {
  width: 100%;
  padding: 8px 0;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--text-color);
  background: transparent;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;
}

.section-title span {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.add-anniv-btn {
  padding: 6px 12px;
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
}

.add-anniv-btn:active {
  opacity: 0.85;
}

.plus {
  font-size: 16px;
  line-height: 1;
}

.empty-tip {
  text-align: center;
  color: var(--text-color-3);
  font-size: 14px;
  padding: 24px;
  background-color: var(--white);
  border-radius: 12px;
}

.anniversary-item {
  background-color: var(--white);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.anniv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.anniv-index {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.anniv-delete {
  font-size: 13px;
  color: var(--danger-color);
  cursor: pointer;
}
</style>
