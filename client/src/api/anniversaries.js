import request from './request'

export function getAnniversariesByPerson(personId) {
  return request({
    url: `/api/anniversaries/person/${personId}`,
    method: 'get'
  })
}

export function addAnniversary(data) {
  return request({
    url: '/api/anniversaries',
    method: 'post',
    data
  })
}

export function updateAnniversary(id, data) {
  return request({
    url: `/api/anniversaries/${id}`,
    method: 'put',
    data
  })
}

export function deleteAnniversary(id) {
  return request({
    url: `/api/anniversaries/${id}`,
    method: 'delete'
  })
}

export function getUpcomingAnniversaries(limit = 0) {
  return request({
    url: '/api/anniversaries/upcoming',
    method: 'get',
    params: { limit }
  })
}

export function getCalendarAnniversaries(year, month) {
  return request({
    url: `/api/anniversaries/calendar/${year}/${month}`,
    method: 'get'
  })
}
