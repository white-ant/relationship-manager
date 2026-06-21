import axios from 'axios'
import { showToast } from 'vant'

const service = axios.create({
  baseURL: '/',
  timeout: 15000
})

service.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0) {
      showToast(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res
  },
  (error) => {
    let msg = error.message || '网络错误'
    if (error.response && error.response.data && error.response.data.message) {
      msg = error.response.data.message
    }
    showToast(msg)
    return Promise.reject(new Error(msg))
  }
)

export default service
