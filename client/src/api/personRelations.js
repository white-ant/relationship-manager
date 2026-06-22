import request from './request'

export function getPersonRelations(personId) {
  return request({
    url: `/api/people/${personId}/relations`,
    method: 'get'
  })
}

export function addPersonRelation(personId, data) {
  return request({
    url: `/api/people/${personId}/relations`,
    method: 'post',
    data
  })
}

export function updatePersonRelation(id, data) {
  return request({
    url: `/api/person-relations/${id}`,
    method: 'put',
    data
  })
}

export function deletePersonRelation(id) {
  return request({
    url: `/api/person-relations/${id}`,
    method: 'delete'
  })
}

export function getRelationGraph() {
  return request({
    url: '/api/relation-graph',
    method: 'get'
  })
}
