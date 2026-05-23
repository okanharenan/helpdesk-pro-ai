import api from './api'

export async function loginRequest(data) {
  const response = await api.post('/auth/login', data)
  return response.data
}