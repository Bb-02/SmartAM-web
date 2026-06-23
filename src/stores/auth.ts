import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, register as registerApi } from '@/api/auth'
import { getStorage, setStorage, removeStorage } from '@/utils/storage'
import type { UserInfo, RegisterRequest } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const userId = ref<number | null>(null)
  const username = ref('')
  const role = ref('')
  const realName = ref('')

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(t: string, info: UserInfo) {
    token.value = t
    userId.value = info.userId
    username.value = info.username
    role.value = info.role
    realName.value = info.realName

    setStorage('token', t)
    setStorage('user', info)
  }

  function hydrateFromStorage() {
    const savedToken = getStorage<string>('token')
    const savedUser = getStorage<UserInfo>('user')
    if (savedToken && savedUser) {
      token.value = savedToken
      userId.value = savedUser.userId
      username.value = savedUser.username
      role.value = savedUser.role
      realName.value = savedUser.realName
    }
  }

  async function login(form: { companyCode: string; username: string; password: string }) {
    const res = await loginApi(form)
    const { token: t, ...info } = res.data
    setAuth(t, info)
  }

  async function doRegister(form: RegisterRequest) {
    return registerApi(form)
  }

  function logout() {
    token.value = null
    userId.value = null
    username.value = ''
    role.value = ''
    realName.value = ''
    removeStorage('token')
    removeStorage('user')
  }

  return {
    token,
    userId,
    username,
    role,
    realName,
    isLoggedIn,
    hydrateFromStorage,
    login,
    doRegister,
    logout,
  }
})
