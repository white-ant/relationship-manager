import request from './request'

export function getRelationshipRecords(personId, page = 1, pageSize = 5) {
  return request({
    url: `/api/people/${personId}/relationship-records`,
    method: 'get',
    params: { page, pageSize }
  })
}

export function addRelationshipRecord(personId, data) {
  return request({
    url: `/api/people/${personId}/relationship-records`,
    method: 'post',
    data,
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  })
}

export function getRelationshipRecordDetail(id) {
  return request({
    url: `/api/relationship-records/${id}`,
    method: 'get'
  })
}

export function updateRelationshipRecord(id, data) {
  return request({
    url: `/api/relationship-records/${id}`,
    method: 'put',
    data,
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  })
}

export function deleteRelationshipRecord(id) {
  return request({
    url: `/api/relationship-records/${id}`,
    method: 'delete'
  })
}

export function getPersonStatistics(personId) {
  return request({
    url: `/api/people/${personId}/statistics`,
    method: 'get'
  })
}

export function uploadFile(formData) {
  return request({
    url: '/api/upload',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
