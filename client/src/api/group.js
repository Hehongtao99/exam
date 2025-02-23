import request from '@/utils/request'

export const createGroup = (data) => {
  return request({
    url: '/api/group/create',
    method: 'post',
    data
  })
}

export const getGroupList = () => {
  return request({
    url: '/api/group/list',
    method: 'get'
  })
}

export const sendGroupMessage = (data) => {
  return request({
    url: '/api/group/message',
    method: 'post',
    data
  })
}

export const getGroupMessages = (groupId) => {
  return request({
    url: `/api/group/messages/${groupId}`,
    method: 'get'
  })
}
