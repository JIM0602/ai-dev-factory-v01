import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { adminLogin, refreshToken, type LoginParams, type LoginResult } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('admin_token') || '')
  const username = ref<string>(localStorage.getItem('admin_username') || '')
  const role = ref<string>(localStorage.getItem('admin_role') || '')
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  async function login(params: LoginParams): Promise<void> {
    loading.value = true
    try {
      const res = await adminLogin(params)
      const data: LoginResult = res.data
      token.value = data.token
      username.value = data.username
      role.value = data.role

      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('admin_username', data.username)
      localStorage.setItem('admin_role', data.role)
    } finally {
      loading.value = false
    }
  }

  async function tryRefreshToken(): Promise<boolean> {
    try {
      const res = await refreshToken()
      token.value = res.data.token
      localStorage.setItem('admin_token', res.data.token)
      return true
    } catch {
      return false
    }
  }

  function logout(): void {
    token.value = ''
    username.value = ''
    role.value = ''
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_username')
    localStorage.removeItem('admin_role')
  }

  return {
    token,
    username,
    role,
    loading,
    isAuthenticated,
    login,
    tryRefreshToken,
    logout,
  }
})
