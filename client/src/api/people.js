import request from './request'

export function getPeopleList() {
  return request({
    url: '/api/people',
    method: 'get'
  })
}

export function getPersonDetail(id) {
  return request({
    url: `/api/people/${id}`,
    method: 'get'
  })
}

export function addPerson(data) {
  return request({
    url: '/api/people',
    method: 'post',
    data
  })
}

export function updatePerson(id, data) {
  return request({
    url: `/api/people/${id}`,
    method: 'put',
    data
  })
}

export function deletePerson(id) {
  return request({
    url: `/api/people/${id}`,
    method: 'delete'
  })
}

export function uploadAvatar(formData) {
  return request({
    url: '/api/people/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
